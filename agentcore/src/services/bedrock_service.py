"""Amazon Bedrock サービス"""

import json
import time
from typing import Dict, Any
import structlog
import boto3
from botocore.exceptions import ClientError
from botocore.config import Config

from ..utils.config import get_config

logger = structlog.get_logger(__name__)


class BedrockService:
    """Amazon Bedrock サービス"""

    # リトライ設定
    MAX_RETRIES = 2
    RETRY_DELAY = 1.0  # 秒（固定間隔）
    TIMEOUT = 15  # 秒

    def __init__(self):
        config = get_config()
        # タイムアウト設定を含むboto3設定
        boto_config = Config(
            read_timeout=self.TIMEOUT,
            connect_timeout=5,
            retries={"max_attempts": 0},  # boto3の自動リトライを無効化（手動で制御）
        )
        self.bedrock_runtime = boto3.client(
            "bedrock-runtime",
            region_name=config.bedrock_region,
            config=boto_config,
        )
        # model_idは毎回configから取得するため、プロパティとして定義
        self._config = config
    
    @property
    def model_id(self) -> str:
        """現在のmodel_idを取得（常に最新のconfigを参照）"""
        return get_config().bedrock_model_id

    def _build_request_body(
        self, prompt: str, max_tokens: int, temperature: float
    ) -> Dict[str, Any]:
        """モデルに応じたリクエストボディを構築

        Args:
            prompt: プロンプト
            max_tokens: 最大トークン数
            temperature: 温度パラメータ

        Returns:
            Dict[str, Any]: リクエストボディ
        """
        model_id = self.model_id.lower()

        # Claude系モデル
        if "claude" in model_id or "anthropic" in model_id:
            return {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": max_tokens,
                "temperature": temperature,
                "messages": [{"role": "user", "content": prompt}],
            }
        
        # Nova系モデル
        elif "nova" in model_id:
            return {
                "messages": [
                    {
                        "role": "user",
                        "content": [{"text": prompt}]
                    }
                ],
                "inferenceConfig": {
                    "max_new_tokens": max_tokens,
                    "temperature": temperature,
                }
            }
        
        # その他のモデル（デフォルト：Claude形式）
        else:
            logger.warning(
                "未知のモデルIDです。Claude形式を使用します",
                model_id=model_id
            )
            return {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": max_tokens,
                "temperature": temperature,
                "messages": [{"role": "user", "content": prompt}],
            }

    def _parse_response(self, response_body: Dict[str, Any]) -> str:
        """モデルに応じたレスポンスをパース

        Args:
            response_body: レスポンスボディ

        Returns:
            str: 生成されたテキスト

        Raises:
            ValueError: レスポンスのパースに失敗した場合
        """
        model_id = self.model_id.lower()

        # Claude系モデル
        if "claude" in model_id or "anthropic" in model_id:
            if "content" not in response_body or not response_body["content"]:
                raise ValueError("Bedrockレスポンスにcontentフィールドがありません")
            return response_body["content"][0]["text"]
        
        # Nova系モデル
        elif "nova" in model_id:
            if "output" not in response_body or "message" not in response_body["output"]:
                raise ValueError("Bedrockレスポンスにoutput.messageフィールドがありません")
            message = response_body["output"]["message"]
            if "content" not in message or not message["content"]:
                raise ValueError("Bedrockレスポンスにoutput.message.contentフィールドがありません")
            return message["content"][0]["text"]
        
        # その他のモデル（デフォルト：Claude形式）
        else:
            if "content" not in response_body or not response_body["content"]:
                raise ValueError("Bedrockレスポンスにcontentフィールドがありません")
            return response_body["content"][0]["text"]

    async def generate_text(
        self, prompt: str, max_tokens: int = 2000, temperature: float = 0.7
    ) -> str:
        """テキスト生成（リトライ機能付き）

        Args:
            prompt: プロンプト
            max_tokens: 最大トークン数
            temperature: 温度パラメータ

        Returns:
            str: 生成されたテキスト

        Raises:
            ClientError: Bedrock APIエラー
            Exception: その他のエラー
        """
        logger.info(
            "テキスト生成を開始",
            model_id=self.model_id,
            prompt_length=len(prompt),
            max_tokens=max_tokens,
            temperature=temperature,
        )

        last_error = None
        for attempt in range(self.MAX_RETRIES + 1):
            try:
                # モデルに応じたリクエストボディを構築
                body = self._build_request_body(prompt, max_tokens, temperature)

                logger.debug(
                    "Bedrock呼び出しを実行",
                    attempt=attempt + 1,
                    max_attempts=self.MAX_RETRIES + 1,
                    model_id=self.model_id,
                )

                # Bedrockを呼び出し（タイムアウト設定済み）
                response = self.bedrock_runtime.invoke_model(
                    modelId=self.model_id,
                    body=json.dumps(body),
                    contentType="application/json",
                    accept="application/json",
                )

                # レスポンスをパース
                response_body = json.loads(response["body"].read())
                
                # モデルに応じたレスポンスをパース
                generated_text = self._parse_response(response_body)

                logger.info(
                    "テキスト生成を完了",
                    model_id=self.model_id,
                    response_length=len(generated_text),
                    attempt=attempt + 1,
                )
                return generated_text

            except ClientError as e:
                last_error = e
                error_code = e.response.get("Error", {}).get("Code", "Unknown")
                error_message = e.response.get("Error", {}).get("Message", str(e))
                
                # エラーメッセージに応じた追加情報を提供
                additional_info = ""
                if "AccessDeniedException" in error_code:
                    additional_info = " (ヒント: AWS SCPでモデルへのアクセスが拒否されています。許可されているモデルを使用してください)"
                elif "ValidationException" in error_code and "inference profile" in error_message:
                    additional_info = " (ヒント: Novaモデルは inference profile ARN を使用してください。例: us.amazon.nova-lite-v1:0)"
                
                logger.warning(
                    "Bedrock呼び出しでClientErrorが発生",
                    model_id=self.model_id,
                    error_code=error_code,
                    error_message=error_message + additional_info,
                    attempt=attempt + 1,
                    max_attempts=self.MAX_RETRIES + 1,
                )

                # 最後の試行でない場合はリトライ
                if attempt < self.MAX_RETRIES:
                    logger.info(
                        "リトライを実行",
                        retry_delay=self.RETRY_DELAY,
                        next_attempt=attempt + 2,
                    )
                    time.sleep(self.RETRY_DELAY)
                    continue
                else:
                    logger.error(
                        "Bedrock呼び出しが最大リトライ回数に達しました",
                        model_id=self.model_id,
                        error_code=error_code,
                        total_attempts=self.MAX_RETRIES + 1,
                    )
                    raise

            except Exception as e:
                last_error = e
                logger.warning(
                    "テキスト生成で予期しないエラーが発生",
                    model_id=self.model_id,
                    error=str(e),
                    error_type=type(e).__name__,
                    attempt=attempt + 1,
                    max_attempts=self.MAX_RETRIES + 1,
                )

                # 最後の試行でない場合はリトライ
                if attempt < self.MAX_RETRIES:
                    logger.info(
                        "リトライを実行",
                        retry_delay=self.RETRY_DELAY,
                        next_attempt=attempt + 2,
                    )
                    time.sleep(self.RETRY_DELAY)
                    continue
                else:
                    logger.error(
                        "テキスト生成が最大リトライ回数に達しました",
                        model_id=self.model_id,
                        total_attempts=self.MAX_RETRIES + 1,
                    )
                    raise

        # ここには到達しないはずだが、念のため
        if last_error:
            raise last_error
        raise Exception("テキスト生成に失敗しました")

    async def generate_embeddings(self, text: str) -> list:
        """テキスト埋め込みを生成

        Args:
            text: 埋め込み対象のテキスト

        Returns:
            list: 埋め込みベクトル
        """
        logger.info("埋め込み生成を開始", text_length=len(text))

        try:
            # Titan Embeddings用のリクエストボディ
            body = {"inputText": text}

            # Bedrockを呼び出し
            response = self.bedrock_runtime.invoke_model(
                modelId="amazon.titan-embed-text-v1",
                body=json.dumps(body),
                contentType="application/json",
                accept="application/json",
            )

            # レスポンスをパース
            response_body = json.loads(response["body"].read())
            embeddings = response_body["embedding"]

            logger.info("埋め込み生成を完了", embedding_dimension=len(embeddings))
            return embeddings

        except ClientError as e:
            logger.error("Bedrock埋め込み生成でエラーが発生", error=str(e))
            raise
        except Exception as e:
            logger.error("埋め込み生成でエラーが発生", error=str(e))
            raise

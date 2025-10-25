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
        self.model_id = config.bedrock_model_id

    async def generate_text(
        self, prompt: str, max_tokens: int = 2000, temperature: float = 0.7
    ) -> str:
        """テキスト生成

        Args:
            prompt: プロンプト
            max_tokens: 最大トークン数
            temperature: 温度パラメータ

        Returns:
            str: 生成されたテキスト
        """
        logger.info(
            "テキスト生成を開始", model_id=self.model_id, prompt_length=len(prompt)
        )

        try:
            # Claude用のリクエストボディを構築
            body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": max_tokens,
                "temperature": temperature,
                "messages": [{"role": "user", "content": prompt}],
            }

            # Bedrockを呼び出し
            response = self.bedrock_runtime.invoke_model(
                modelId=self.model_id,
                body=json.dumps(body),
                contentType="application/json",
                accept="application/json",
            )

            # レスポンスをパース
            response_body = json.loads(response["body"].read())
            generated_text = response_body["content"][0]["text"]

            logger.info(
                "テキスト生成を完了",
                model_id=self.model_id,
                response_length=len(generated_text),
            )
            return generated_text

        except ClientError as e:
            logger.error(
                "Bedrock呼び出しでエラーが発生", model_id=self.model_id, error=str(e)
            )
            raise
        except Exception as e:
            logger.error(
                "テキスト生成でエラーが発生", model_id=self.model_id, error=str(e)
            )
            raise

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

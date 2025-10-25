"""設定管理"""

import os
from typing import Optional
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# 環境変数を読み込み
load_dotenv()


class Config(BaseModel):
    """アプリケーション設定
    
    設計書の要件に基づいた設定管理クラス。
    環境変数から設定を読み込み、デフォルト値を提供する。
    """
    
    # 環境設定
    environment: str = Field(
        default=os.getenv("ENVIRONMENT", "development"),
        description="実行環境 (development/production)"
    )
    
    # AWS設定
    aws_region: str = Field(
        default=os.getenv("AWS_REGION", "ap-northeast-1"),
        description="AWSリージョン"
    )
    aws_access_key_id: Optional[str] = Field(
        default=os.getenv("AWS_ACCESS_KEY_ID"),
        description="AWSアクセスキーID（開発環境のみ）"
    )
    aws_secret_access_key: Optional[str] = Field(
        default=os.getenv("AWS_SECRET_ACCESS_KEY"),
        description="AWSシークレットアクセスキー（開発環境のみ）"
    )
    
    # AgentCore設定
    agentcore_runtime_id: Optional[str] = Field(
        default=os.getenv("AGENTCORE_RUNTIME_ID"),
        description="AgentCore RuntimeのID"
    )
    agentcore_memory_id: Optional[str] = Field(
        default=os.getenv("AGENTCORE_MEMORY_ID"),
        description="AgentCore MemoryのID"
    )
    agentcore_gateway_url: Optional[str] = Field(
        default=os.getenv("AGENTCORE_GATEWAY_URL"),
        description="AgentCore GatewayのURL"
    )
    
    # Bedrock設定（設計書に準拠）
    bedrock_model_id: str = Field(
        default=os.getenv("BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20240620-v1:0"),
        description="BedrockモデルID（Claude 3.5 Sonnet v1）"
    )
    bedrock_region: str = Field(
        default=os.getenv("BEDROCK_REGION", "us-east-1"),
        description="Bedrockリージョン"
    )
    bedrock_max_tokens: int = Field(
        default=int(os.getenv("BEDROCK_MAX_TOKENS", "2000")),
        description="Bedrock最大トークン数"
    )
    bedrock_temperature: float = Field(
        default=float(os.getenv("BEDROCK_TEMPERATURE", "0.7")),
        description="Bedrock temperature設定"
    )
    bedrock_timeout: int = Field(
        default=int(os.getenv("BEDROCK_TIMEOUT", "15")),
        description="Bedrock呼び出しタイムアウト（秒）"
    )
    

    
    # ログ設定
    log_level: str = Field(
        default=os.getenv("LOG_LEVEL", "INFO"),
        description="ログレベル (DEBUG/INFO/WARNING/ERROR/CRITICAL)"
    )
    log_format: str = Field(
        default=os.getenv("LOG_FORMAT", "json"),
        description="ログフォーマット (json/console)"
    )
    
    # 推薦設定（設計書に準拠）
    max_recommendations: int = Field(
        default=int(os.getenv("MAX_RECOMMENDATIONS", "10")),
        description="最大推薦件数"
    )
    recommendation_timeout: int = Field(
        default=int(os.getenv("RECOMMENDATION_TIMEOUT", "30")),
        description="推薦処理全体のタイムアウト（秒）"
    )
    cache_ttl: int = Field(
        default=int(os.getenv("CACHE_TTL", "600")),
        description="キャッシュTTL（秒）"
    )
    
    @property
    def is_development(self) -> bool:
        """開発環境かどうかを判定"""
        return self.environment.lower() == "development"
    
    @property
    def is_production(self) -> bool:
        """本番環境かどうかを判定"""
        return self.environment.lower() == "production"


# グローバル設定インスタンス
_config: Optional[Config] = None


def get_config() -> Config:
    """設定を取得
    
    シングルトンパターンで設定インスタンスを返す。
    初回呼び出し時に環境変数から設定を読み込む。
    
    Returns:
        Config: アプリケーション設定
    """
    global _config
    if _config is None:
        _config = Config()
    return _config


def reload_config() -> Config:
    """設定を再読み込み
    
    環境変数が変更された場合に設定を再読み込みする。
    主にテスト用途で使用。
    
    Returns:
        Config: 再読み込みされたアプリケーション設定
    """
    global _config
    _config = Config()
    return _config
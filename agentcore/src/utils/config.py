"""設定管理"""

import os
from typing import Optional
from pydantic import BaseModel
from dotenv import load_dotenv

# 環境変数を読み込み
load_dotenv()


class Config(BaseModel):
    """アプリケーション設定"""
    
    # AWS設定
    aws_region: str = os.getenv("AWS_REGION", "ap-northeast-1")
    aws_access_key_id: Optional[str] = os.getenv("AWS_ACCESS_KEY_ID")
    aws_secret_access_key: Optional[str] = os.getenv("AWS_SECRET_ACCESS_KEY")
    
    # AgentCore設定
    agentcore_runtime_id: Optional[str] = os.getenv("AGENTCORE_RUNTIME_ID")
    agentcore_memory_id: Optional[str] = os.getenv("AGENTCORE_MEMORY_ID")
    agentcore_gateway_url: Optional[str] = os.getenv("AGENTCORE_GATEWAY_URL")
    
    # Bedrock設定
    bedrock_model_id: str = os.getenv("BEDROCK_MODEL_ID", "anthropic.claude-3-sonnet-20240229-v1:0")
    bedrock_region: str = os.getenv("BEDROCK_REGION", "us-east-1")
    
    # DynamoDB設定
    dynamodb_table_name: str = os.getenv("DYNAMODB_TABLE_NAME", "sake-drinking-records")
    dynamodb_region: str = os.getenv("DYNAMODB_REGION", "ap-northeast-1")
    
    # ログ設定
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    log_format: str = os.getenv("LOG_FORMAT", "json")
    
    # 推薦設定
    max_recommendations: int = int(os.getenv("MAX_RECOMMENDATIONS", "5"))
    recommendation_timeout: int = int(os.getenv("RECOMMENDATION_TIMEOUT", "10"))


# グローバル設定インスタンス
_config: Optional[Config] = None


def get_config() -> Config:
    """設定を取得"""
    global _config
    if _config is None:
        _config = Config()
    return _config
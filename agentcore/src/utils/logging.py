"""ログ設定


要件5.5、8.5に準拠したログ設定。
- structlogによる構造化ログ
- 環境別のログレベル（開発: DEBUG、本番: INFO）
- JSON形式での統一
- 個人情報のマスキング
"""

import logging
import sys
import re
from typing import Any, Dict
import structlog
from .config import get_config


# 個人情報マスキング用のパターン
SENSITIVE_PATTERNS = [
    # 銘柄名（sake_name, brand等のフィールド）
    (re.compile(r'"(sake_name|brand)"\s*:\s*"([^"]+)"'), r'"\1": "[MASKED]"'),
    # 味の感想（taste_impression, impression等のフィールド）
    (re.compile(r'"(taste_impression|impression)"\s*:\s*"([^"]+)"'), r'"\1": "[MASKED]"'),
    # 推薦理由（explanation, reason等のフィールド）
    (re.compile(r'"(explanation|reason)"\s*:\s*"([^"]+)"'), r'"\1": "[MASKED]"'),
]


def mask_sensitive_data(logger: Any, method_name: str, event_dict: Dict[str, Any]) -> Dict[str, Any]:
    """個人情報をマスキングするプロセッサ
    
    要件8.5: ログに個人を特定できる情報（銘柄、感想の詳細）を記録しない
    
    Args:
        logger: ロガーインスタンス
        method_name: ログメソッド名
        event_dict: ログイベント辞書
        
    Returns:
        マスキング済みのログイベント辞書
    """
    # イベントメッセージをマスキング
    if "event" in event_dict and isinstance(event_dict["event"], str):
        message = event_dict["event"]
        for pattern, replacement in SENSITIVE_PATTERNS:
            message = pattern.sub(replacement, message)
        event_dict["event"] = message
    
    # 特定のフィールドをマスキング
    sensitive_fields = [
        "sake_name", "brand", "taste_impression", "impression",
        "explanation", "reason", "menu", "recommendations"
    ]
    
    for field in sensitive_fields:
        if field in event_dict:
            if isinstance(event_dict[field], str):
                event_dict[field] = "[MASKED]"
            elif isinstance(event_dict[field], list):
                event_dict[field] = f"[MASKED_LIST:{len(event_dict[field])}]"
            elif isinstance(event_dict[field], dict):
                event_dict[field] = "[MASKED_DICT]"
    
    return event_dict


def setup_logging() -> None:
    """ログ設定をセットアップ
    
    要件5.5: すべてのエラーメッセージを日本語で提供
    要件8.5: ログに個人を特定できる情報を記録しない
    
    環境別の設定:
    - 開発環境: DEBUG、コンソール形式（色付き）
    - 本番環境: INFO、JSON形式
    """
    config = get_config()
    
    # ログレベルを設定
    log_level = getattr(logging, config.log_level.upper(), logging.INFO)
    
    # 共通プロセッサ
    common_processors = [
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        mask_sensitive_data,  # 個人情報マスキング
    ]
    
    # 環境別のレンダラー設定
    if config.log_format.lower() == "json" or config.is_production:
        # JSON形式のログ（本番環境）
        processors = common_processors + [
            structlog.processors.JSONRenderer(ensure_ascii=False, sort_keys=True)
        ]
    else:
        # 人間が読みやすい形式のログ（開発環境）
        processors = common_processors + [
            structlog.dev.ConsoleRenderer(colors=True)
        ]
    
    # structlogの設定
    structlog.configure(
        processors=processors,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    
    # 標準ライブラリのloggingを設定
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=log_level,
    )
    
    # 外部ライブラリのログレベルを調整（冗長なログを抑制）
    logging.getLogger('boto3').setLevel(logging.WARNING)
    logging.getLogger('botocore').setLevel(logging.WARNING)
    logging.getLogger('urllib3').setLevel(logging.WARNING)
    logging.getLogger('s3transfer').setLevel(logging.WARNING)
    
    # 初期化ログ
    logger = structlog.get_logger(__name__)
    logger.info(
        "ログ設定を初期化しました",
        environment=config.environment,
        log_level=config.log_level,
        log_format=config.log_format
    )


def get_logger(name: str) -> structlog.BoundLogger:
    """ロガーを取得
    
    Args:
        name: ロガー名（通常は__name__を指定）
        
    Returns:
        構造化ロガー
        
    Example:
        >>> logger = get_logger(__name__)
        >>> logger.info("処理を開始", user_id="user_123", request_id="req_456")
    """
    return structlog.get_logger(name)
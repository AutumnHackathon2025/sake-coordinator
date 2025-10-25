"""飲酒記録サービス"""

import structlog

from ..models import DrinkingRecord

logger = structlog.get_logger(__name__)


class DrinkingRecordService:
    """飲酒記録サービス
    
    リクエストペイロードから飲酒記録データを受け取り、
    DrinkingRecordモデルに変換する
    """

    def __init__(self):
        logger.info("飲酒記録サービスを初期化")

    async def parse_records(
        self, records_data: list[dict]
    ) -> list[DrinkingRecord]:
        """飲酒記録データをパース

        Args:
            records_data: 飲酒記録の辞書リスト

        Returns:
            List[DrinkingRecord]: 飲酒記録リスト
        """
        logger.info("飲酒記録をパース", record_count=len(records_data))

        records = []
        for item in records_data:
            try:
                record = DrinkingRecord(**item)
                records.append(record)
            except Exception as e:
                logger.warning(
                    "飲酒記録のパースに失敗", item=item, error=str(e)
                )
                continue

        logger.info(
            "飲酒記録のパース完了", 
            input_count=len(records_data),
            parsed_count=len(records)
        )
        return records

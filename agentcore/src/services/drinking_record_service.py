"""飲酒記録サービス"""

from typing import List, Optional
import structlog
import boto3
from botocore.exceptions import ClientError

from ..models import DrinkingRecord
from ..utils.config import get_config

logger = structlog.get_logger(__name__)


class DrinkingRecordService:
    """飲酒記録サービス"""

    def __init__(self):
        config = get_config()
        self.dynamodb = boto3.resource("dynamodb", region_name=config.dynamodb_region)
        self.table = self.dynamodb.Table(config.dynamodb_table_name)

    async def get_user_records(
        self, user_id: str, limit: Optional[int] = None
    ) -> List[DrinkingRecord]:
        """ユーザーの飲酒記録を取得

        Args:
            user_id: ユーザーID
            limit: 取得件数制限

        Returns:
            List[DrinkingRecord]: 飲酒記録リスト
        """
        logger.info("飲酒記録を取得", user_id=user_id, limit=limit)

        try:
            # DynamoDBからユーザーの記録を取得
            response = self.table.query(
                KeyConditionExpression="user_id = :user_id",
                ExpressionAttributeValues={":user_id": user_id},
                ScanIndexForward=False,  # 新しい順でソート
                Limit=limit if limit else 100,
            )

            records = []
            for item in response.get("Items", []):
                try:
                    record = DrinkingRecord(**item)
                    records.append(record)
                except Exception as e:
                    logger.warning("飲酒記録のパースに失敗", item=item, error=str(e))
                    continue

            logger.info(
                "飲酒記録を取得完了", user_id=user_id, record_count=len(records)
            )
            return records

        except ClientError as e:
            logger.error("DynamoDB操作でエラーが発生", user_id=user_id, error=str(e))
            raise
        except Exception as e:
            logger.error("飲酒記録取得でエラーが発生", user_id=user_id, error=str(e))
            raise

    async def get_record_by_id(
        self, user_id: str, record_id: str
    ) -> Optional[DrinkingRecord]:
        """IDで飲酒記録を取得

        Args:
            user_id: ユーザーID
            record_id: 記録ID

        Returns:
            Optional[DrinkingRecord]: 飲酒記録（存在しない場合はNone）
        """
        logger.info("飲酒記録を取得", user_id=user_id, record_id=record_id)

        try:
            response = self.table.get_item(Key={"user_id": user_id, "id": record_id})

            item = response.get("Item")
            if not item:
                logger.info(
                    "飲酒記録が見つかりません", user_id=user_id, record_id=record_id
                )
                return None

            record = DrinkingRecord(**item)
            logger.info("飲酒記録を取得完了", user_id=user_id, record_id=record_id)
            return record

        except ClientError as e:
            logger.error(
                "DynamoDB操作でエラーが発生",
                user_id=user_id,
                record_id=record_id,
                error=str(e),
            )
            raise
        except Exception as e:
            logger.error(
                "飲酒記録取得でエラーが発生",
                user_id=user_id,
                record_id=record_id,
                error=str(e),
            )
            raise

import { DrinkingRecord } from "@/types/api";
import { RatingStamp } from "./RatingStamp";

interface RecordCardProps {
  record: DrinkingRecord;
}

export function RecordCard({ record }: RecordCardProps) {
  return (
    <div className="sake-label-card shadow-xl p-5 relative">
      {/* 評価スタンプ（右上・内側） */}
      <div className="absolute right-3 top-3 z-20">
        <RatingStamp rating={record.rating} />
      </div>

      <div className="relative z-10">
        {/* ヘッダー */}
        <div className="mb-4">
          <h3 className="text-subtitle text-primary font-semibold font-label pr-24">
            {record.brand}
          </h3>
        </div>

        {/* 感想 */}
        <p className="mb-4 text-body text-gray-800 leading-relaxed font-zen-kurenaido">
          {record.impression}
        </p>

        {/* 日付 */}
        <p className="text-body text-gray-600 font-zen-kurenaido text-right">
          {new Date(record.createdAt).toLocaleDateString("ja-JP", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>
    </div>
  );
}


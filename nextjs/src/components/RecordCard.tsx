import { DrinkingRecord, Rating, RATING_LABELS } from "@/types/api";

interface RecordCardProps {
  record: DrinkingRecord;
}

export function RecordCard({ record }: RecordCardProps) {
  const getRatingColor = (rating: Rating) => {
    switch (rating) {
      case "VERY_GOOD":
        return "bg-rating-love-bg text-rating-love-text";
      case "GOOD":
        return "bg-rating-like-bg text-rating-like-text";
      case "BAD":
        return "bg-rating-dislike-bg text-rating-dislike-text";
      case "VERY_BAD":
        return "bg-rating-hate-bg text-rating-hate-text";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="sake-label-card shadow-xl p-5">
      <div className="relative z-10">
        {/* ヘッダー */}
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-subtitle text-primary font-semibold">
            {record.brand}
          </h3>
          <span
            className={`rounded-full px-3 py-1 text-body font-medium ${getRatingColor(
              record.rating
            )}`}
          >
            {RATING_LABELS[record.rating]}
          </span>
        </div>

        {/* 感想 */}
        <p className="mb-4 text-body text-gray-800 leading-relaxed">
          {record.impression}
        </p>

        {/* 日付 */}
        <p className="text-body text-gray-600">
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


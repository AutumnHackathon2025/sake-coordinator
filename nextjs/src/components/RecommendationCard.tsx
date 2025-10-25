import { RecommendationResult } from "@/types/api";
import Link from "next/link";

interface RecommendationCardProps {
  sake: RecommendationResult;
  rank: number;
}

export function RecommendationCard({ sake, rank }: RecommendationCardProps) {
  const getRankingDisplay = (rankNumber: number) => {
    if (rankNumber === 0) return { icon: "🥇", isEmoji: true };
    if (rankNumber === 1) return { icon: "🥈", isEmoji: true };
    if (rankNumber === 2) return { icon: "🥉", isEmoji: true };
    return { icon: (rankNumber + 1).toString(), isEmoji: false };
  };

  const ranking = getRankingDisplay(rank);

  return (
    <Link href={`/history?openRecordModal=true&brand=${sake.brand}`}>
      <div className="wood-texture relative p-4 shadow-md">
        {/* 四隅の組み込み装飾 */}
        <div className="masu-corner pointer-events-none absolute inset-0" />
        <div className="masu-corner-bottom pointer-events-none absolute inset-0" />
        <div className="masu-edge-left pointer-events-none absolute top-8 left-0 inset-0" />
        <div className="masu-edge-left pointer-events-none absolute top-22 left-0 inset-0" />
        <div className="masu-edge-right pointer-events-none absolute top-16 right-0 inset-0" />
        <div className="masu-edge-right pointer-events-none absolute top-32 right-0 inset-0" />

        {/* コンテンツ */}
        <div className="flex items-start gap-4 relative z-10">
          <div className={ranking.isEmoji ? "text-3xl" : "flex h-9 w-9 items-center justify-center text-body-lg font-bold text-primary"}>
            {ranking.icon}
          </div>
          <div className="flex-1">
            <div className="mb-2 flex items-start justify-between gap-4">
              <h3 className="text-subtitle text-primary-dark">
                {sake.brand}
              </h3>
              <span className="flex-shrink-0 rounded bg-primary px-3 py-1 text-body font-medium text-white shadow-sm">
                {sake.score.toFixed(1)}
              </span>
            </div>
            <p className="text-body text-gray-700 leading-relaxed">
              {sake.reason}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}


import { RecommendationResult } from "@/types/api";

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
    <div 
      className="relative rounded-sm border-2 border-secondary bg-gradient-to-br from-bg-card to-bg-page p-4 shadow-sm"
      style={{
        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8), 0 2px 4px rgba(107,68,35,0.15)'
      }}
    >
      <div className="flex items-start gap-4">
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
  );
}


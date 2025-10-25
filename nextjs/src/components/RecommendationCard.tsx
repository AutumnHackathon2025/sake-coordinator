import { RecommendationResult } from "@/types/api";
import Link from "next/link";
import { RankBadge } from "./RankBadge";

interface RecommendationCardProps {
  sake: RecommendationResult;
  rank: number;
}

export function RecommendationCard({ sake, rank }: RecommendationCardProps) {
  return (
    <Link href={`/history?openRecordModal=true&brand=${sake.brand}`}>
      <div className="wood-texture relative p-4 shadow-md">
        {/* 順位バッジ（左上） */}
        <div className="absolute -left-2 -top-2 z-20">
          <RankBadge rank={rank} />
        </div>

        {/* 四隅の組み込み装飾 */}
        <div className="masu-edge-left pointer-events-none absolute top-8 left-0 inset-0" />
        <div className="masu-edge-left pointer-events-none absolute top-22 left-0 inset-0" />
        <div className="masu-edge-right pointer-events-none absolute top-16 right-0 inset-0" />
        <div className="masu-edge-right pointer-events-none absolute top-32 right-0 inset-0" />
        <div className="masu-corner pointer-events-none absolute inset-0" />
        <div className="masu-corner-bottom pointer-events-none absolute inset-0" />

        {/* コンテンツ */}
        <div className="relative z-10 pl-8">
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
    </Link>
  );
}


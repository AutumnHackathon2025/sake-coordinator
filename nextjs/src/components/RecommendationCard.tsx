import { RecommendationResult } from "@/types/api";
import Link from "next/link";
import { RankBadge } from "./RankBadge";

interface RecommendationCardProps {
  sake: RecommendationResult;
  rank: number;
}

export function RecommendationCard({ sake, rank }: RecommendationCardProps) {
  // カテゴリに応じた色設定
  const getCategoryColor = (category?: string) => {
    switch (category) {
      case "鉄板マッチ":
        return "bg-action-record text-white";
      case "次の一手":
        return "bg-primary text-white";
      case "運命の出会い":
        return "bg-secondary text-primary-dark";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <Link href={`/history?openRecordModal=true&brand=${sake.brand}`}>
      {/* ラッパー: バッジ用のoverflow対策 */}
      <div className="relative">
        {/* 順位バッジ（左上） */}
        <div className="absolute -left-2 -top-2 z-20">
          <RankBadge rank={rank} />
        </div>

        <div className="wood-texture relative p-6 shadow-md">
          {/* 四隅の組み込み装飾 */}
          <div className="masu-edge-left pointer-events-none absolute top-8 left-0 inset-0" />
          <div className="masu-edge-left pointer-events-none absolute top-22 left-0 inset-0" />
          <div className="masu-edge-right pointer-events-none absolute top-16 right-0 inset-0" />
          <div className="masu-edge-right pointer-events-none absolute top-32 right-0 inset-0" />
          <div className="masu-corner pointer-events-none absolute inset-0" />
          <div className="masu-corner-bottom pointer-events-none absolute inset-0" />

          {/* コンテンツ */}
          <div className="relative z-10 space-y-4">
            {/* ヘッダー: 銘柄とマッチスコア */}
            <div className="flex items-start justify-between gap-3">
              <h3 className="flex-1 text-title font-bold text-primary-dark">
                {sake.brand}
              </h3>
              <div className="flex-shrink-0 text-center">
                <div className="text-caption text-primary opacity-80">
                  マッチ度
                </div>
                <div className="text-display font-bold text-action-record">
                  {sake.match_score}
                  <span className="text-subtitle">%</span>
                </div>
              </div>
            </div>

            {/* カテゴリバッジ */}
            {sake.category && (
              <div className="flex justify-center">
                <span
                  className={`inline-block rounded-full px-4 py-1 text-body-lg font-bold shadow-sm ${getCategoryColor(sake.category)}`}
                >
                  {sake.category}
                </span>
              </div>
            )}

            {/* 銘柄説明 */}
            <div className="rounded-lg bg-white/40 p-3 backdrop-blur-sm">
              <p className="text-body leading-relaxed text-primary-dark">
                {sake.brand_description}
              </p>
            </div>

            {/* 期待される体験 */}
            <div className="rounded-lg bg-primary/10 p-3">
              <div className="mb-1 text-body-lg font-bold text-primary">
                あなたへの一言
              </div>
              <p className="text-body leading-relaxed text-primary-dark">
                {sake.expected_experience}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}


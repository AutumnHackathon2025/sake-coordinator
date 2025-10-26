import { RecommendationResult } from "@/types/api";
import { RankBadge } from "./RankBadge";

interface RecommendationCardProps {
  sake: RecommendationResult;
  rank: number;
  onClick?: () => void;
}

export function RecommendationCard({ sake, rank, onClick }: RecommendationCardProps) {
  // 日本酒ラベルっぽい色のパレット
  const labelColors = [
    { bg: "#9C2A1D", text: "#FFFFFF" }, // 赤茶色（獺祭など）
    { bg: "#1E3A8A", text: "#FFFFFF" }, // 深い青（十四代など）
    { bg: "#065F46", text: "#FFFFFF" }, // 深緑（黒龍など）
    { bg: "#7C2D12", text: "#FFFFFF" }, // 焦茶色（八海山など）
    { bg: "#581C87", text: "#FFFFFF" }, // 紫（久保田など）
    { bg: "#92400E", text: "#FFFFFF" }, // 琥珀色
    { bg: "#991B1B", text: "#FFFFFF" }, // 深紅
    { bg: "#1F2937", text: "#FFFFFF" }, // 墨色
    { bg: "#6B4423", text: "#FFFFFF" }, // 焼酎色
    { bg: "#0F766E", text: "#FFFFFF" }, // 青緑
  ];

  // 銘柄名から一貫性のある色を選択
  const getColorFromBrand = (brand: string) => {
    let hash = 0;
    for (let i = 0; i < brand.length; i++) {
      hash = brand.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % labelColors.length;
    return labelColors[index];
  };

  const categoryColor = getColorFromBrand(sake.brand);

  return (
    <div 
      onClick={onClick}
      className="cursor-pointer"
    >
      {/* ラッパー: バッジ用のoverflow対策 */}
      <div className="relative">
        {/* 順位バッジ（左上） */}
        {/* <div className="absolute -left-2 -top-2 z-20">
          <RankBadge rank={rank} />
        </div> */}

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
              <h3 
                className="flex-1 text-title font-bold text-primary-dark"
                style={{ wordBreak: "keep-all", overflowWrap: "break-word" }}
              >
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
                  className="inline-block rounded-full px-4 py-1 text-body-lg font-bold shadow-sm"
                  style={{
                    backgroundColor: categoryColor.bg,
                    color: categoryColor.text,
                  }}
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
              <div className="mb-1 text-body leading-relaxed text-primary-dark">
                あなたへの一言
              </div>
              <p className="text-body leading-relaxed text-primary-dark">
                {sake.expected_experience}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


import { Rating, RATING_LABELS } from "@/types/api";

interface RatingStampProps {
  rating: Rating;
}

export function RatingStamp({ rating }: RatingStampProps) {
  const getRatingColor = (ratingValue: Rating) => {
    switch (ratingValue) {
      case "VERY_GOOD":
      case "GOOD":
        return "#9C2A1D"; // 赤茶色
      case "BAD":
      case "VERY_BAD":
        return "#072870"; // 青
      default:
        return "#6B7280"; // グレー
    }
  };

  const color = getRatingColor(rating);

  return (
    <div className="relative">
      {/* スタンプ本体 */}
      <div
        className="relative rounded-lg px-3 py-1.5 text-body-lg font-label font-bold border-3 transform rotate-3"
        style={{
          color: color,
          borderColor: color,
          opacity: 0.85,
          textShadow: `
            1px 0px 1px ${color}20,
            -1px 0px 1px ${color}20,
            0px 1px 1px ${color}20,
            0px -1px 1px ${color}20
          `,
          boxShadow: `
            0 2px 4px ${color}30,
            inset 0 1px 2px ${color}20
          `,
        }}
      >
        {RATING_LABELS[rating]}
        
        {/* 掠れ効果のための疑似要素風テクスチャ */}
        <div
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            background: `
              repeating-linear-gradient(
                45deg,
                transparent,
                transparent 2px,
                ${color}05 2px,
                ${color}05 4px
              )
            `,
            mixBlendMode: "multiply",
          }}
        />
      </div>
    </div>
  );
}


interface MatchBadgeProps {
  matchScore: number; // 0-100
}

export function MatchBadge({ matchScore }: MatchBadgeProps) {
  // マッチ度に応じた色とスタイルを取得
  const getMatchStyle = (score: number) => {
    if (score >= 90) {
      return {
        bgGradient: "from-yellow-400 via-yellow-300 to-yellow-500",
        borderColor: "border-yellow-600",
        textColor: "text-yellow-900",
        ribbonColor: "from-red-600 via-red-600 to-red-700",
      };
    }
    if (score >= 75) {
      return {
        bgGradient: "from-gray-300 via-gray-200 to-gray-400",
        borderColor: "border-gray-500",
        textColor: "text-gray-800",
        ribbonColor: "from-blue-600 via-blue-600 to-blue-700",
      };
    }
    return {
      bgGradient: "from-amber-600 via-amber-500 to-amber-700",
      borderColor: "border-amber-800",
      textColor: "text-amber-950",
      ribbonColor: "from-green-600 via-green-600 to-green-700",
    };
  };

  const style = getMatchStyle(matchScore);

  return (
    <div className="relative flex flex-col items-center">
      {/* メダル本体 */}
      <div
        className={`relative flex h-16 w-16 flex-col items-center justify-center rounded-full bg-gradient-to-br ${style.bgGradient} border-3 ${style.borderColor} shadow-lg z-10`}
        style={{
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.5)",
        }}
      >
        {/* 内側の円 */}
        <div className="absolute inset-1 rounded-full border-2 border-white/30" />
        
        {/* マッチ度テキスト */}
        <div className={`relative z-10 flex flex-col items-center ${style.textColor}`}>
          <span className="text-[9px] font-medium leading-none">
            マッチ度
          </span>
          <span className="mt-0.5 text-xl font-bold leading-none">
            {matchScore}
          </span>
          <span className="text-[8px] font-medium leading-none">
            %
          </span>
        </div>
      </div>

      {/* リボン部分（下部・2本） */}
      <div className="absolute top-14 flex gap-0.5">
        {/* 左のリボン（右に傾ける） */}
        <div
          className={`h-8 w-2.5 bg-gradient-to-b ${style.ribbonColor} shadow-sm`}
          style={{
            clipPath: "polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)",
            boxShadow: "inset -1px 0 2px rgba(0, 0, 0, 0.3), 0 2px 3px rgba(0, 0, 0, 0.2)",
            transform: "rotate(12deg)",
            transformOrigin: "top center",
          }}
        />
        {/* 右のリボン（左に傾ける） */}
        <div
          className={`h-8 w-2.5 bg-gradient-to-b ${style.ribbonColor} shadow-sm`}
          style={{
            clipPath: "polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)",
            boxShadow: "inset 1px 0 2px rgba(0, 0, 0, 0.3), 0 2px 3px rgba(0, 0, 0, 0.2)",
            transform: "rotate(-12deg)",
            transformOrigin: "top center",
          }}
        />
      </div>
    </div>
  );
}


interface RankBadgeProps {
  rank: number; // 0-indexed (0 = 1位)
}

export function RankBadge({ rank }: RankBadgeProps) {
  // 順位に応じた色とラベルを取得
  const getRankStyle = (rankNumber: number) => {
    if (rankNumber === 0) {
      return {
        bgGradient: "from-yellow-400 via-yellow-300 to-yellow-500",
        borderColor: "border-yellow-600",
        textColor: "text-yellow-900",
        label: "1位",
        isMedal: true,
      };
    }
    if (rankNumber === 1) {
      return {
        bgGradient: "from-gray-300 via-gray-200 to-gray-400",
        borderColor: "border-gray-500",
        textColor: "text-gray-800",
        label: "2位",
        isMedal: true,
      };
    }
    if (rankNumber === 2) {
      return {
        bgGradient: "from-amber-600 via-amber-500 to-amber-700",
        borderColor: "border-amber-800",
        textColor: "text-amber-950",
        label: "3位",
        isMedal: true,
      };
    }
    return {
      bgGradient: "from-gray-500 via-gray-400 to-gray-600",
      borderColor: "border-gray-700",
      textColor: "text-white",
      label: `${rankNumber + 1}位`,
      isMedal: false,
    };
  };

  const style = getRankStyle(rank);

  if (style.isMedal) {
    return (
      <div className="relative flex items-center justify-center">
        {/* メダル本体 */}
        <div
          className={`relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${style.bgGradient} border-3 ${style.borderColor} shadow-lg`}
          style={{
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.5)",
          }}
        >
          {/* 内側の円 */}
          <div className="absolute inset-1 rounded-full border-2 border-white/30" />
          
          {/* 順位テキスト */}
          <span className={`relative z-10 text-sm font-bold ${style.textColor}`}>
            {style.label}
          </span>
        </div>

        {/* リボン部分（上部） */}
        <div className="absolute -top-1 left-1/2 h-6 w-2 -translate-x-1/2">
          <div
            className={`h-full w-full bg-gradient-to-b ${style.bgGradient} ${style.borderColor} border-l border-r`}
            style={{
              boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.2)",
            }}
          />
        </div>
      </div>
    );
  }

  // 4位以降はシンプルなバッジ
  return (
    <div
      className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${style.bgGradient} border-2 ${style.borderColor} shadow-md`}
      style={{
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
      }}
    >
      <span className={`text-sm font-bold ${style.textColor}`}>
        {style.label}
      </span>
    </div>
  );
}


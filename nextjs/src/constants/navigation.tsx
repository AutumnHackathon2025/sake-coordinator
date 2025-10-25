/**
 * ナビゲーション関連の定数定義
 */

import StarIcon from "@mui/icons-material/Star";
import HistoryIcon from "@mui/icons-material/History";

/**
 * フッターナビゲーションアイテム
 */
export const FOOTER_ITEMS = [
  {
    icon: <StarIcon />,
    label: "おすすめ",
    href: "/recommendations",
  },
  {
    icon: <HistoryIcon />,
    label: "履歴",
    href: "/history",
  },
];


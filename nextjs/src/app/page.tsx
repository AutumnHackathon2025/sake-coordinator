import Link from "next/link";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import StarIcon from "@mui/icons-material/Star";
import CreateIcon from "@mui/icons-material/Create";
import HistoryIcon from "@mui/icons-material/History";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary via-primary-hover to-primary px-6">
      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
        {/* アプリ名 */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-display-lg text-text-light font-light tracking-wider font-label">
            御酒印帳
          </h1>
          <div className="h-1 w-24 mx-auto bg-gradient-to-r from-transparent via-text-light to-transparent opacity-50"></div>
        </div>
        
        {/* 簡単な説明 */}
        <div className="mb-8 max-w-sm">
          <p className="text-body text-center text-text-light/90 leading-relaxed">
            あなたの好みを学習して<br />
            居酒屋のメニューから<br />
            <span className="font-semibold text-text-light">最適な日本酒をおすすめ</span>
          </p>
        </div>
        
        {/* メインボタン */}
        <div className="w-full space-y-3 mb-6">
          <Link
            href="/recommendations"
            className="flex items-center justify-center gap-3 w-full rounded-xl bg-text-light py-4 text-body-lg font-medium text-primary shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            <StarIcon className="text-xl" />
            <span>おすすめを見る</span>
          </Link>
          
          <Link
            href="/history?openRecordModal=true"
            className="flex items-center justify-center gap-3 w-full rounded-xl bg-action-record py-4 text-body-lg font-bold text-white shadow-lg transition-all hover:bg-action-record-hover hover:shadow-xl active:scale-[0.98]"
          >
            <CreateIcon className="text-xl" />
            <span>記録する</span>
          </Link>
          
          <Link
            href="/history"
            className="flex items-center justify-center gap-3 w-full rounded-xl border-2 border-text-light/30 bg-text-light/10 backdrop-blur-sm py-4 text-body-lg font-medium text-text-light transition-all hover:bg-text-light/20 hover:border-text-light/50 active:scale-[0.98]"
          >
            <HistoryIcon className="text-xl" />
            <span>履歴を見る</span>
          </Link>
        </div>
        
        {/* 使い方へのリンク */}
        <Link
          href="/how-to-use"
          className="flex items-center gap-2 rounded-full px-5 py-2 text-body text-text-light/70 transition-all hover:text-text-light hover:bg-text-light/10"
        >
          <HelpOutlineIcon className="text-lg" />
          <span>使い方を見る</span>
        </Link>
      </div>

      {/* フッタースペース */}
      <div className="pb-8"></div>
    </div>
  );
}

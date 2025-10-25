import { LinkButton } from "@/components/LinkButton";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#2B2D5F] px-8">
      {/* HOME タイトル */}
      <div className="flex-1 flex items-center justify-center">
        <h1 className="text-8xl font-light tracking-[0.2em] text-white">
          HOME
        </h1>
      </div>

      {/* ボタンエリア */}
      <div className="w-full max-w-2xl space-y-6 pb-32">
        <LinkButton href="/recommendations">おすすめを見る</LinkButton>
        <LinkButton href="/record">記録する</LinkButton>
        <LinkButton href="/history">履歴を見る</LinkButton>
      </div>
    </div>
  );
}

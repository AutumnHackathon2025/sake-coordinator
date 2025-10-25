"use client";

import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FOOTER_ITEMS } from "@/constants/navigation";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

export default function HowToUsePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header showHelpLink={false} />

      <main className="pb-32 pt-14">
        <div className="px-6 py-6">
          <h1 className="mb-4 text-title text-[#2B2D5F]">
            使い方
          </h1>
          
          <p className="mb-8 text-body text-gray-600">
            飲んだお酒を記録するほど、あなた好みのおすすめが表示されます
          </p>

          {/* 簡潔な3ステップ */}
          <div className="mb-8 space-y-4">
            {/* ステップ1 */}
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#2B2D5F] text-body font-bold text-white">
                  1
                </span>
                <h2 className="text-body-lg font-semibold text-[#2B2D5F]">
                  メニューを入力
                </h2>
              </div>
              <p className="text-body text-gray-700 pl-11">
                居酒屋にある日本酒の銘柄を入力します
              </p>
            </div>

            {/* ステップ2 */}
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#2B2D5F] text-body font-bold text-white">
                  2
                </span>
                <h2 className="text-body-lg font-semibold text-[#2B2D5F]">
                  おすすめを確認
                </h2>
              </div>
              <p className="text-body text-gray-700 pl-11">
                あなたの好みに合った日本酒を提案します
              </p>
            </div>

            {/* ステップ3 */}
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#2B2D5F] text-body font-bold text-white">
                  3
                </span>
                <h2 className="text-body-lg font-semibold text-[#2B2D5F]">
                  感想を記録
                </h2>
              </div>
              <p className="text-body text-gray-700 pl-11">
                飲んだお酒の評価と感想を記録します
              </p>
            </div>
          </div>

          {/* ポイント */}
          <div className="mb-8 rounded-xl border-2 border-[#2B2D5F] bg-gradient-to-r from-purple-50 to-blue-50 p-5">
            <h2 className="mb-3 text-body-lg font-semibold text-[#2B2D5F]">
              💡 ポイント
            </h2>
            <ul className="space-y-2 text-body text-gray-700">
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>記録が増えるほど精度が上がります</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>「合わない」も大事な情報です</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>感想は詳しく書くほど効果的</span>
              </li>
            </ul>
          </div>

          {/* アクションボタン */}
          <Link
            href="/recommendations"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2B2D5F] py-4 text-body-lg font-medium text-white shadow-lg transition-all hover:bg-[#3B3D7F] hover:shadow-xl active:scale-[0.98]"
          >
            <span>おすすめを見る</span>
            <ArrowForwardIcon />
          </Link>
        </div>
      </main>

      <Footer items={FOOTER_ITEMS} />
    </div>
  );
}


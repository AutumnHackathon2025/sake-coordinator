"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { MenuEditor } from "@/components/MenuEditor";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HintCaption } from "@/components/HintCaption";
import { useRecommendations } from "./useRecommendations";
import { getDefaultMenu } from "@/lib/mockData";
import { FOOTER_ITEMS } from "@/constants/navigation";
import EditIcon from "@mui/icons-material/Edit";

export default function RecommendationsPage() {
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const { menuItems, recommendations, isLoading, updateMenu } = useRecommendations(getDefaultMenu());

  const handleSubmitMenu = (items: string[]) => {
    updateMenu(items);
    setIsMenuModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* メインコンテンツ */}
      <main className="pb-32 pt-14">
        <div className="px-6 py-6">
          <div className="mb-6 flex flex-col gap-3">
            <h2 className="text-title text-[#2B2D5F]">
              今夜のおすすめ日本酒
            </h2>
            <button
              onClick={() => setIsMenuModalOpen(true)}
              className="flex w-fit items-center gap-1 self-end rounded-lg bg-gray-100 px-3 py-2 text-[#2B2D5F] transition-colors hover:bg-gray-200"
              aria-label="メニューを編集"
            >
              <EditIcon className="text-lg" />
              <span className="text-body font-medium">メニューを編集</span>
            </button>
          </div>

          {/* おすすめリスト */}
          {isLoading ? (
            <div className="py-12 text-center text-gray-500">
              <p className="text-body-lg">おすすめを読み込んでいます...</p>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <p className="text-body-lg">おすすめが見つかりませんでした</p>
              <p className="mt-2 text-body">メニューを編集して、もう一度お試しください</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((sake, index) => (
                <div key={`${sake.brand}-${index}`} className="border-b border-gray-300 pb-4">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">
                      {sake.score === 5 ? "🏆" : sake.score === 4 ? "⭐" : "✨"}
                    </div>
                    <div className="flex-1">
                      <div className="mb-2 flex items-start justify-between gap-4">
                        <h3 className="text-subtitle text-gray-800">
                          {sake.brand}
                        </h3>
                        <span className="flex-shrink-0 rounded-full bg-[#2B2D5F] px-3 py-1 text-body font-medium text-white">
                          {sake.score}/5
                        </span>
                      </div>
                      <p className="text-body text-gray-700 leading-relaxed">
                        {sake.reason}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer items={FOOTER_ITEMS} />
      <HintCaption message="💡 気に入った日本酒を見つけたら、感想を記録しておきましょう" />

      {/* メニュー編集モーダル */}
      <Modal isOpen={isMenuModalOpen} onClose={() => setIsMenuModalOpen(false)}>
        <MenuEditor initialItems={menuItems} onSubmit={handleSubmitMenu} />
      </Modal>
    </div>
  );
}


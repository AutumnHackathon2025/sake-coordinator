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
    <div className="min-h-screen bg-bg-page">
      <Header />

      {/* メインコンテンツ */}
      <main className="pb-32 pt-14">
        <div className="px-6 py-6">
          <div className="mb-6 flex flex-col gap-3">
            <h2 className="text-title text-primary">
              今夜のおすすめ日本酒
            </h2>
            <button
              onClick={() => setIsMenuModalOpen(true)}
              className="flex w-fit items-center gap-1 self-end rounded-lg bg-bg-subtle px-3 py-2 text-primary transition-colors hover:bg-border-subtle"
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
              {recommendations.map((sake, index) => {
                const getRankingDisplay = (rank: number) => {
                  if (rank === 0) return { icon: "🥇", isEmoji: true };
                  if (rank === 1) return { icon: "🥈", isEmoji: true };
                  if (rank === 2) return { icon: "🥉", isEmoji: true };
                  return { icon: (rank + 1).toString(), isEmoji: false };
                };

                const ranking = getRankingDisplay(index);

                return (
                  <div 
                    key={`${sake.brand}-${index}`} 
                    className="relative rounded-sm border-2 border-secondary bg-gradient-to-br from-bg-card to-bg-page p-4 shadow-sm"
                    style={{
                      boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8), 0 2px 4px rgba(107,68,35,0.15)'
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className={ranking.isEmoji ? "text-3xl" : "flex h-9 w-9 items-center justify-center text-body-lg font-bold text-primary"}>
                        {ranking.icon}
                      </div>
                      <div className="flex-1">
                        <div className="mb-2 flex items-start justify-between gap-4">
                          <h3 className="text-subtitle text-primary-dark">
                            {sake.brand}
                          </h3>
                          <span className="flex-shrink-0 rounded bg-primary px-3 py-1 text-body font-medium text-white shadow-sm">
                            {sake.score.toFixed(1)}
                          </span>
                        </div>
                        <p className="text-body text-gray-700 leading-relaxed">
                          {sake.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
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


"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { MenuEditor } from "@/components/MenuEditor";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HintCaption } from "@/components/HintCaption";
import { RecommendationCard } from "@/components/RecommendationCard";
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
              {recommendations.map((sake, index) => (
                <RecommendationCard 
                  key={`${sake.brand}-${index}`}
                  sake={sake}
                  rank={index}
                />
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


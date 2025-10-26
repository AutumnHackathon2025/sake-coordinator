"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export default function RecommendationsPage() {
  const router = useRouter();
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const { menuItems, recommendations, isLoading, updateMenu } = useRecommendations(getDefaultMenu());
  
  // recommendationsが更新されたらcurrentIndexをリセット
  useEffect(() => {
    setCurrentIndex(0);
  }, [recommendations]);

  const handleSubmitMenu = (items: string[]) => {
    updateMenu(items);
    setIsMenuModalOpen(false);
  };

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % recommendations.length);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handlePrev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + recommendations.length) % recommendations.length);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleSelect = () => {
    const currentSake = recommendations[currentIndex];
    router.push(`/history?openRecordModal=true&brand=${currentSake.brand}`);
  };

  return (
    <div className="min-h-screen max-w-[100vw] max-h-[100vh] overflow-hidden bg-bg-page">
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

          {/* スワイプカードUI */}
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
            <>
              {/* カルーセル */}
              {/* 余白マイナス10vw */}
              <div className="w-[100vw] overflow-hidden ml-[-5vw]">
                <div 
                  className="flex transition-transform duration-300 ease-out"
                  style={{
                    transform: `translateX(calc(50vw - 40vw - ${currentIndex * 80 }vw))`,
                  }}
                >
                  {recommendations.map((sake, index) => (
                    <div
                      key={index}
                      className="flex-shrink-0 w-[80vw] px-2"
                    >
                      <RecommendationCard sake={sake} rank={index} />
                    </div>
                  ))}
                </div>
              </div>

              {/* ナビゲーションボタン */}
              <div className="mt-6 flex items-center justify-center gap-4">
                <button
                  onClick={handlePrev}
                  className="flex h-14 w-14 items-center justify-center rounded-full border-3 border-primary bg-white text-primary shadow-lg transition-all hover:scale-110 hover:bg-primary hover:text-white active:scale-95"
                  aria-label="前へ"
                >
                  <ChevronLeftIcon className="text-3xl" />
                </button>
                <button
                  onClick={handleSelect}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-action-record text-white shadow-xl transition-all hover:scale-110 hover:bg-action-record-hover active:scale-95"
                  aria-label="これを選ぶ"
                >
                  <CheckCircleIcon className="text-4xl" />
                </button>
                <button
                  onClick={handleNext}
                  className="flex h-14 w-14 items-center justify-center rounded-full border-3 border-primary bg-white text-primary shadow-lg transition-all hover:scale-110 hover:bg-primary hover:text-white active:scale-95"
                  aria-label="次へ"
                >
                  <ChevronRightIcon className="text-3xl" />
                </button>
              </div>

              {/* 進捗インジケーター */}
              <div className="mt-4 text-center">
                <p className="text-body text-gray-500">
                  {currentIndex + 1} / {recommendations.length}
                </p>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer items={FOOTER_ITEMS} />
      <HintCaption>
      💡 左右のカードやボタンで回転<br/>気に入ったら✓ボタンで記録へ
      </HintCaption>

      {/* メニュー編集モーダル */}
      <Modal isOpen={isMenuModalOpen} onClose={() => setIsMenuModalOpen(false)}>
        <MenuEditor initialItems={menuItems} onSubmit={handleSubmitMenu} />
      </Modal>
    </div>
  );
}


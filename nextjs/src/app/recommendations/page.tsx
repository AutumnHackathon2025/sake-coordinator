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
import CloseIcon from "@mui/icons-material/Close";
import FavoriteIcon from "@mui/icons-material/Favorite";

export default function RecommendationsPage() {
  const router = useRouter();
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const { menuItems, recommendations, isLoading, updateMenu } = useRecommendations(getDefaultMenu());
  
  // recommendationsが更新されたらcurrentIndexをリセット
  useEffect(() => {
    setCurrentIndex(0);
  }, [recommendations]);

  const handleSubmitMenu = (items: string[]) => {
    updateMenu(items);
    setIsMenuModalOpen(false);
  };

  const handleDragStart = (clientX: number, clientY: number, e?: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    setStartPos({ x: clientX, y: clientY });
    if (e && 'touches' in e) {
      e.preventDefault();
    }
  };

  const handleDragMove = (clientX: number, clientY: number, e?: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = clientX - startPos.x;
    const deltaY = clientY - startPos.y;
    setDragOffset({ x: deltaX, y: deltaY });
    
    if (e && 'touches' in e) {
      e.preventDefault();
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    
    const threshold = 100; // スワイプ判定の閾値
    
    if (Math.abs(dragOffset.x) > threshold) {
      if (dragOffset.x < 0) {
        // 左スワイプ（パス）
        handlePass();
      } else {
        // 右スワイプ（いいね）
        handleLike();
      }
    }
    
    // ドラッグをリセット
    setDragOffset({ x: 0, y: 0 });
  };

  const handlePass = () => {
    setSwipeDirection("left");
    setTimeout(() => {
      setSwipeDirection(null);
      // currentIndexを次に進める（最後に達したら0に戻る）
      setCurrentIndex((prevIndex) => (prevIndex + 1) % recommendations.length);
    }, 150);
  };

  const handleLike = () => {
    if (currentIndex < recommendations.length) {
      const currentSake = recommendations[currentIndex];
      setSwipeDirection("right");
      setTimeout(() => {
        router.push(`/history?openRecordModal=true&brand=${currentSake.brand}`);
      }, 300);
    }
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
              {/* カードスタック */}
              <div className="relative mx-auto max-w-lg">
                {/* 3枚目のカード（一番下） */}
                {recommendations.length > 2 && (
                  <div 
                    className="absolute inset-x-2 pointer-events-none"
                    style={{
                      top: "24px",
                      transform: "scale(0.88) rotate(-1deg)",
                      opacity: 0.4,
                      zIndex: 1,
                      filter: "brightness(0.95)",
                    }}
                  >
                    <RecommendationCard 
                      sake={recommendations[(currentIndex + 2) % recommendations.length]}
                      rank={(currentIndex + 2) % recommendations.length}
                    />
                  </div>
                )}
                
                {/* 2枚目のカード（真ん中） */}
                {recommendations.length > 1 && (
                  <div 
                    className={`absolute pointer-events-none transition-all duration-200 ${
                      swipeDirection ? "inset-x-0" : "inset-x-1"
                    }`}
                    style={{
                      top: swipeDirection ? "0px" : "12px",
                      transform: swipeDirection ? "scale(1) rotate(0deg)" : "scale(0.94) rotate(-0.5deg)",
                      opacity: swipeDirection ? 1 : 0.7,
                      zIndex: 2,
                      filter: swipeDirection ? "brightness(1)" : "brightness(0.97)",
                    }}
                  >
                    <RecommendationCard 
                      sake={recommendations[(currentIndex + 1) % recommendations.length]}
                      rank={(currentIndex + 1) % recommendations.length}
                    />
                  </div>
                )}
                
                {/* 現在のカード - ドラッグ可能 */}
                {!swipeDirection && (
                  <div 
                    className="relative cursor-grab active:cursor-grabbing touch-none"
                    style={{
                      transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x * 0.1}deg)`,
                      transition: isDragging ? "none" : "transform 0.3s ease-out",
                      touchAction: "none",
                      zIndex: 10,
                      filter: isDragging ? "brightness(1.05) drop-shadow(0 20px 40px rgba(0, 0, 0, 0.3))" : "none",
                    }}
                    onMouseDown={(e) => handleDragStart(e.clientX, e.clientY, e)}
                    onMouseMove={(e) => handleDragMove(e.clientX, e.clientY, e)}
                    onMouseUp={handleDragEnd}
                    onMouseLeave={handleDragEnd}
                    onTouchStart={(e) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY, e)}
                    onTouchMove={(e) => handleDragMove(e.touches[0].clientX, e.touches[0].clientY, e)}
                    onTouchEnd={handleDragEnd}
                  >
                    <RecommendationCard 
                      sake={recommendations[currentIndex]}
                      rank={currentIndex}
                    />
                    
                    {/* スワイプヒント */}
                    {isDragging && (
                      <>
                        {dragOffset.x < -50 && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-lg pointer-events-none">
                            <div className="text-white text-4xl font-bold">✕</div>
                          </div>
                        )}
                        {dragOffset.x > 50 && (
                          <div className="absolute inset-0 flex items-center justify-center bg-action-record/50 rounded-lg pointer-events-none">
                            <div className="text-white text-4xl font-bold">♥</div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
                
                {/* スワイプアニメーション中のカード */}
                {swipeDirection && (
                  <div 
                    className={`relative transition-all duration-150 ${
                      swipeDirection === "left" ? "-translate-x-full rotate-[-15deg] opacity-0" :
                      "translate-x-full rotate-[15deg] opacity-0"
                    }`}
                    style={{ zIndex: 10 }}
                  >
                    <RecommendationCard 
                      sake={recommendations[currentIndex]}
                      rank={currentIndex}
                    />
                  </div>
                )}
              </div>

              {/* アクションボタン */}
              <div className="mt-6 flex items-center justify-center gap-6">
                <button
                  onClick={handlePass}
                  className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-gray-400 bg-white text-gray-400 shadow-lg transition-all hover:scale-110 hover:border-gray-500 hover:text-gray-500 active:scale-95"
                  aria-label="パス"
                >
                  <CloseIcon className="text-3xl" />
                </button>
                <button
                  onClick={handleLike}
                  className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-action-record bg-white text-action-record shadow-xl transition-all hover:scale-110 hover:bg-action-record hover:text-white active:scale-95"
                  aria-label="気に入った"
                >
                  <FavoriteIcon className="text-4xl" />
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
      <HintCaption  >
      💡 気に入った日本酒を見つけたら<br/>感想を記録しておきましょう
      </HintCaption>

      {/* メニュー編集モーダル */}
      <Modal isOpen={isMenuModalOpen} onClose={() => setIsMenuModalOpen(false)}>
        <MenuEditor initialItems={menuItems} onSubmit={handleSubmitMenu} />
      </Modal>
    </div>
  );
}


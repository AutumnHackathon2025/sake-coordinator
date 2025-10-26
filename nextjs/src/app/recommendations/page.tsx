"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { MenuEditor } from "@/components/MenuEditor";
import { RecordForm } from "@/components/RecordForm";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HintCaption } from "@/components/HintCaption";
import { RecommendationCard } from "@/components/RecommendationCard";
import { useRecommendations } from "./useRecommendations";
import { getDefaultMenu } from "@/lib/mockData";
import { FOOTER_ITEMS } from "@/constants/navigation";
import { CreateRecordRequest } from "@/types/api";
import EditIcon from "@mui/icons-material/Edit";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

export default function RecommendationsPage() {
  const router = useRouter();
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchOffset, setTouchOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const { menuItems, recommendations, isLoading, updateMenu } = useRecommendations(getDefaultMenu());
  
  // recommendationsが更新されたらcurrentIndexをリセット
  useEffect(() => {
    setCurrentIndex(0);
  }, [recommendations]);

  // 画面スクロールを禁止
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleSubmitMenu = (items: string[]) => {
    updateMenu(items);
    setIsMenuModalOpen(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    setIsSwiping(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const deltaX = e.touches[0].clientX - touchStart.x;
    const deltaY = e.touches[0].clientY - touchStart.y;

    // 横方向のスワイプが優勢な場合
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      setIsSwiping(true);
      setTouchOffset(deltaX);
      // 横スワイプ時は縦スクロールを防止
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !isSwiping) {
      setTouchStart(null);
      setTouchOffset(0);
      setIsSwiping(false);
      return;
    }

    const threshold = 50; // スワイプ判定の閾値（ピクセル）

    if (Math.abs(touchOffset) > threshold) {
      if (touchOffset < 0) {
        // 左スワイプ（次へ）
        handleNext();
      } else {
        // 右スワイプ（前へ）
        handlePrev();
      }
    }

    setTouchStart(null);
    setTouchOffset(0);
    setIsSwiping(false);
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
    setSelectedBrand(currentSake.brand);
    setIsRecordModalOpen(true);
  };

  const handleCardClick = (brand: string) => {
    setSelectedBrand(brand);
    setIsRecordModalOpen(true);
  };

  const handleSubmitRecord = async (record: CreateRecordRequest) => {
    // TODO: APIに記録を送信
    console.log("記録を追加:", record);
    setIsRecordModalOpen(false);
    // 記録後、履歴ページに遷移
    router.push("/history");
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-bg-page">
      <Header 
        title="今夜のおすすめ日本酒"
        enableHomeLink={false}
        showHelpLink={false}
      />

      {/* メニュー編集ボタン */}
      <div className="fixed left-0 right-0 top-[52px] z-30 bg-bg-page px-6 py-2">
        <button
          onClick={() => setIsMenuModalOpen(true)}
          className="ml-auto flex items-center gap-1 rounded-lg bg-bg-subtle px-3 py-1.5 text-primary transition-colors hover:bg-border-subtle"
          aria-label="メニューを編集"
        >
          <EditIcon className="text-lg" />
          <span className="text-body font-medium">メニュー編集</span>
        </button>
      </div>

      {/* メインコンテンツ */}
      <main className="h-[calc(100vh-56px)] overflow-hidden pb-32 pt-24">
        <div className="px-6 pt-2">

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
              <div 
                className="w-[100vw] ml-[-5vw]"
                style={{ overflowX: "hidden", overflowY: "visible" }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div 
                  className="flex ease-out items-center"
                  style={{
                    transform: `translateX(calc(50vw - 40vw - ${currentIndex * 80}vw + ${touchOffset}px))`,
                    transition: isSwiping ? "none" : "transform 0.3s",
                  }}
                >
                  {recommendations.map((sake, index) => (
                    <div
                      key={index}
                      className="flex-shrink-0 w-[80vw] px-2 py-8 -mt-4"
                    >
                      <RecommendationCard 
                        sake={sake} 
                        rank={index}
                        onClick={() => handleCardClick(sake.brand)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* ナビゲーションボタン */}
              <div className="mt-6 flex items-center justify-center gap-6">
                <button
                  onClick={handlePrev}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-3 border-primary bg-white text-primary shadow-lg transition-all hover:scale-110 hover:bg-primary hover:text-white active:scale-95"
                  aria-label="前へ"
                >
                  <ChevronLeftIcon className="text-3xl" />
                </button>
                <button
                  onClick={handleSelect}
                  className="flex items-center justify-center rounded-full bg-action-record text-white shadow-xl transition-all hover:scale-110 hover:bg-action-record-hover active:scale-95 py-2 px-4"
                  aria-label="記録する"
                >
                  <span className="text-body-lg font-medium">
                    記録する
                  </span>
                </button>
                <button
                  onClick={handleNext}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-3 border-primary bg-white text-primary shadow-lg transition-all hover:scale-110 hover:bg-primary hover:text-white active:scale-95"
                  aria-label="次へ"
                >
                  <ChevronRightIcon className="text-3xl" />
                </button>
              </div>

              {/* 進捗インジケーター */}
              <div className="mt-1 text-center">
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

      {/* 記録追加モーダル */}
      <Modal isOpen={isRecordModalOpen} onClose={() => setIsRecordModalOpen(false)}>
        <RecordForm 
          initialBrand={selectedBrand}
          onSubmit={handleSubmitRecord}
        />
      </Modal>
    </div>
  );
}


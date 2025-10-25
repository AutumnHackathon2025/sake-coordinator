"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/Modal";
import { MenuEditor } from "@/components/MenuEditor";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HintCaption } from "@/components/HintCaption";
import { RecommendationResult } from "@/types/api";
import { generateMockRecommendations, getDefaultMenu } from "@/lib/mockData";
import StarIcon from "@mui/icons-material/Star";
import HistoryIcon from "@mui/icons-material/History";
import EditIcon from "@mui/icons-material/Edit";

export default function RecommendationsPage() {
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<string[]>(getDefaultMenu());
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // メニューが変更されたら推薦を再取得（モック）
  useEffect(() => {
    fetchRecommendations(menuItems);
  }, []);

  const fetchRecommendations = async (menu: string[]) => {
    setIsLoading(true);
    try {
      // TODO: 実際のAPI呼び出しに置き換え
      // const response = await fetch('/agent/recommend', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ menu })
      // });
      // const data = await response.json();
      // setRecommendations(data.recommendations);

      // モックデータを使用
      await new Promise((resolve) => setTimeout(resolve, 500)); // API呼び出しを模擬
      const mockRecommendations = generateMockRecommendations(menu);
      setRecommendations(mockRecommendations);
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
      // エラー時は空配列
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const footerItems = [
    { 
      icon: <StarIcon />, 
      label: "おすすめ",
      href: "/recommendations"
    },
    { 
      icon: <HistoryIcon />, 
      label: "履歴",
      href: "/history"
    },
  ];

  const handleSubmitMenu = (items: string[]) => {
    setMenuItems(items);
    setIsMenuModalOpen(false);
    // メニュー更新後、推薦を再取得
    fetchRecommendations(items);
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

      <Footer items={footerItems} />
      <HintCaption message="💡 気に入った日本酒を見つけたら、感想を記録しておきましょう" />

      {/* メニュー編集モーダル */}
      <Modal isOpen={isMenuModalOpen} onClose={() => setIsMenuModalOpen(false)}>
        <MenuEditor initialItems={menuItems} onSubmit={handleSubmitMenu} />
      </Modal>
    </div>
  );
}


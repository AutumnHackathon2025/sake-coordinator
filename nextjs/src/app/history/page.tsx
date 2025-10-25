"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/Modal";
import { RecordForm } from "@/components/RecordForm";
import { MenuEditor } from "@/components/MenuEditor";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AddRecordButton } from "@/components/AddRecordButton";
import { DrinkingRecord, Rating, RATING_LABELS } from "@/types/api";
import { generateMockRecords } from "@/lib/mockData";
import StarIcon from "@mui/icons-material/Star";
import HistoryIcon from "@mui/icons-material/History";

export default function HistoryPage() {
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<string[]>([]);
  const [records, setRecords] = useState<DrinkingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // 初回読み込み時にデータを取得
  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      // TODO: 実際のAPI呼び出しに置き換え
      // const response = await fetch('/api/records', {
      //   headers: {
      //     'Authorization': `Bearer ${token}`
      //   }
      // });
      // const data = await response.json();
      // setRecords(data);

      // モックデータを使用
      await new Promise((resolve) => setTimeout(resolve, 300));
      const mockRecords = generateMockRecords();
      setRecords(mockRecords);
    } catch (error) {
      console.error("Failed to fetch records:", error);
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getRatingColor = (rating: Rating) => {
    switch (rating) {
      case "VERY_GOOD":
        return "bg-rating-love-bg text-rating-love-text";
      case "GOOD":
        return "bg-rating-like-bg text-rating-like-text";
      case "BAD":
        return "bg-rating-dislike-bg text-rating-dislike-text";
      case "VERY_BAD":
        return "bg-rating-hate-bg text-rating-hate-text";
      default:
        return "bg-gray-100 text-gray-700";
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

  const handleSubmitRecord = async (data: {
    brand: string;
    impression: string;
    rating: Rating;
  }) => {
    try {
      // TODO: 実際のAPI呼び出しに置き換え
      // const response = await fetch('/api/records', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`
      //   },
      //   body: JSON.stringify(data)
      // });
      // const newRecord = await response.json();

      // モックデータとして新しいレコードを追加
      const newRecord: DrinkingRecord = {
        id: `rec-${Date.now()}`,
        userId: "user-mock-001",
        brand: data.brand,
        impression: data.impression,
        rating: data.rating,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setRecords([newRecord, ...records]);
      alert("記録を保存しました！\nあなたの好みがより正確に分析されます。");
      setIsRecordModalOpen(false);
    } catch (error) {
      console.error("Failed to save record:", error);
      alert("記録の保存に失敗しました。もう一度お試しください。");
    }
  };

  const handleSubmitMenu = (items: string[]) => {
    setMenuItems(items);
    setIsMenuModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* メインコンテンツ */}
      <main className="pb-32 pt-14">
        <div className="px-6 py-6">
          <h2 className="mb-6 text-title text-[#2B2D5F]">
            飲酒記録
          </h2>

          {/* 記録リスト */}
          {isLoading ? (
            <div className="py-12 text-center text-gray-500">
              <p className="text-body-lg">記録を読み込んでいます...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <p className="text-body-lg">まだ記録がありません</p>
              <p className="mt-2 text-body">飲んだお酒を記録してみましょう</p>
              <div className="mt-6">
                <p className="text-body text-gray-400">右下の「+」ボタンから記録できます</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="rounded-lg bg-white p-4 shadow-sm"
                >
                  {/* ヘッダー */}
                  <div className="mb-3 flex items-start justify-between">
                    <h3 className="text-subtitle text-gray-800">
                      {record.brand}
                    </h3>
                    <span
                      className={`rounded-full px-3 py-1 text-body font-medium ${getRatingColor(
                        record.rating
                      )}`}
                    >
                      {RATING_LABELS[record.rating]}
                    </span>
                  </div>

                  {/* 感想 */}
                  <p className="mb-3 text-body text-gray-700 leading-relaxed">
                    {record.impression}
                  </p>

                  {/* 日付 */}
                  <p className="text-body text-gray-500">
                    {new Date(record.createdAt).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer items={footerItems} />
      <AddRecordButton 
        variant="motivational"
        onClick={() => setIsRecordModalOpen(true)}
      />

      {/* 記録追加モーダル */}
      <Modal isOpen={isRecordModalOpen} onClose={() => setIsRecordModalOpen(false)}>
        <RecordForm 
          onSubmit={handleSubmitRecord}
          onCancel={() => setIsRecordModalOpen(false)}
        />
      </Modal>

      {/* メニュー編集モーダル */}
      <Modal isOpen={isMenuModalOpen} onClose={() => setIsMenuModalOpen(false)}>
        <MenuEditor initialItems={menuItems} onSubmit={handleSubmitMenu} />
      </Modal>
    </div>
  );
}


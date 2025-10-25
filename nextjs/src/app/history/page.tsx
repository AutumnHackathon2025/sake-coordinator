"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Modal } from "@/components/Modal";
import { RecordForm } from "@/components/RecordForm";
import { RecordCard } from "@/components/RecordCard";
import { MenuEditor } from "@/components/MenuEditor";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AddRecordButton } from "@/components/AddRecordButton";
import { Rating } from "@/types/api";
import { useRecords } from "./useRecords";
import { FOOTER_ITEMS } from "@/constants/navigation";

function HistoryContent() {
  const searchParams = useSearchParams();
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<string[]>([]);
  const [initialBrand, setInitialBrand] = useState<string | undefined>(undefined);
  const { records, isLoading, addRecord } = useRecords();

  // URLパラメータでモーダルを自動で開く & 銘柄の初期値を設定
  useEffect(() => {
    if (searchParams.get("openRecordModal") === "true") {
      setIsRecordModalOpen(true);
      const brandParam = searchParams.get("brand");
      if (brandParam) {
        setInitialBrand(brandParam);
      }
    }
  }, [searchParams]);

  const handleSubmitRecord = async (data: {
    brand: string;
    impression: string;
    rating: Rating;
  }) => {
    try {
      await addRecord(data);
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
    <div className="min-h-screen bg-bg-collection-wall">
      <Header />

      {/* メインコンテンツ */}
      <main className="pb-32 pt-14">
        <div className="px-6 py-6">
          <h2 className="mb-6 text-title text-text-light">
            飲酒記録コレクション
          </h2>

          {/* 記録リスト */}
          {isLoading ? (
            <div className="py-12 text-center text-gray-400">
              <p className="text-body-lg">記録を読み込んでいます...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="py-12 text-center text-gray-300">
              <p className="text-body-lg">まだ記録がありません</p>
              <p className="mt-2 text-body">飲んだお酒を記録してみましょう</p>
              <div className="mt-6">
                <p className="text-body text-gray-400">右下の「+」ボタンから記録できます</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {records.map((record) => (
                <RecordCard key={record.id} record={record} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer items={FOOTER_ITEMS} />
      <AddRecordButton 
        variant="motivational"
        onClick={() => setIsRecordModalOpen(true)}
      />

      {/* 記録追加モーダル */}
      <Modal isOpen={isRecordModalOpen} onClose={() => setIsRecordModalOpen(false)}>
        <RecordForm 
          onSubmit={handleSubmitRecord}
          onCancel={() => setIsRecordModalOpen(false)}
          initialBrand={initialBrand}
        />
      </Modal>

      {/* メニュー編集モーダル */}
      <Modal isOpen={isMenuModalOpen} onClose={() => setIsMenuModalOpen(false)}>
        <MenuEditor initialItems={menuItems} onSubmit={handleSubmitMenu} />
      </Modal>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-collection-wall">
        <Header />
        <main className="pb-32 pt-14">
          <div className="px-6 py-6">
            <h2 className="mb-6 text-title text-text-light">
              飲酒記録コレクション
            </h2>
            <div className="py-12 text-center text-gray-400">
              <p className="text-body-lg">読み込んでいます...</p>
            </div>
          </div>
        </main>
        <Footer items={FOOTER_ITEMS} />
      </div>
    }>
      <HistoryContent />
    </Suspense>
  );
}


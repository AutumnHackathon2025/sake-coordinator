"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { RecordForm } from "@/components/RecordForm";
import { MenuEditor } from "@/components/MenuEditor";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AddRecordButton } from "@/components/AddRecordButton";
import StarIcon from "@mui/icons-material/Star";
import HistoryIcon from "@mui/icons-material/History";

interface DrinkingRecord {
  id: string;
  name: string;
  impression: string;
  rating: "非常に好き" | "好き" | "合わない" | "非常に合わない";
  date: string;
  imageUrl?: string;
}

export default function HistoryPage() {
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<string[]>([
    "出羽桜",
    "獺祭",
    "hogehoge",
    "菊",
  ]);
  
  // モックデータ
  const [records] = useState<DrinkingRecord[]>([
    {
      id: "1",
      name: "獺祭 純米大吟醸",
      impression: "フルーティで華やかな香り。甘みと酸味のバランスが良く、とても飲みやすい。",
      rating: "非常に好き",
      date: "2024-01-15",
    },
    {
      id: "2",
      name: "東洋美人",
      impression: "すっきりとした味わいで、キレが良い。少し辛口だが飲みやすい。",
      rating: "好き",
      date: "2024-01-10",
    },
    {
      id: "3",
      name: "出羽桜",
      impression: "芳醇な香りと深い味わい。米の旨味がしっかり感じられる。",
      rating: "非常に好き",
      date: "2024-01-05",
    },
  ]);

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "非常に好き":
        return "bg-red-100 text-red-700";
      case "好き":
        return "bg-pink-100 text-pink-700";
      case "合わない":
        return "bg-gray-100 text-gray-700";
      case "非常に合わない":
        return "bg-gray-200 text-gray-800";
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

  const handleSubmitRecord = (data: {
    name: string;
    impression: string;
    rating: string;
  }) => {
    // TODO: 実際のデータ保存処理
    console.log("Record saved:", data);
    alert("記録を保存しました！\nあなたの好みがより正確に分析されます。");
    setIsRecordModalOpen(false);
  };

  const handleSubmitMenu = (items: string[]) => {
    setMenuItems(items);
    setIsMenuModalOpen(false);
    // TODO: ここでおすすめを再取得する処理を追加
    console.log("Updated menu items:", items);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* メインコンテンツ */}
      <main className="pb-32 pt-14">
        <div className="px-6 py-8">
          <h2 className="mb-8 text-title text-[#2B2D5F]">
            飲酒記録
          </h2>

          {/* 記録リスト */}
          {records.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <p className="text-body-lg">まだ記録がありません</p>
              <p className="mt-2 text-body">飲んだお酒を記録してみましょう</p>
              <div className="mt-6">
                <p className="text-body text-gray-400">右下の「+」ボタンから記録できます</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="rounded-lg bg-white p-6 shadow-sm"
                >
                  {/* ヘッダー */}
                  <div className="mb-4 flex items-start justify-between">
                    <h3 className="text-subtitle text-gray-800">
                      {record.name}
                    </h3>
                    <span
                      className={`rounded-full px-3 py-1 text-body font-medium ${getRatingColor(
                        record.rating
                      )}`}
                    >
                      {record.rating}
                    </span>
                  </div>

                  {/* 感想 */}
                  <p className="mb-3 text-body text-gray-700 leading-relaxed">
                    {record.impression}
                  </p>

                  {/* 日付 */}
                  <p className="text-body text-gray-500">
                    {new Date(record.date).toLocaleDateString("ja-JP", {
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
        <MenuEditor onSubmit={handleSubmitMenu} />
      </Modal>
    </div>
  );
}


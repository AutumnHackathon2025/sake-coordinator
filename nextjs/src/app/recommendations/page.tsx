"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { MenuEditor } from "@/components/MenuEditor";
import { RecordForm } from "@/components/RecordForm";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AddRecordButton } from "@/components/AddRecordButton";
import StarIcon from "@mui/icons-material/Star";
import HistoryIcon from "@mui/icons-material/History";
import EditIcon from "@mui/icons-material/Edit";

export default function RecommendationsPage() {
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<string[]>([
    "出羽桜",
    "獺祭",
    "hogehoge",
    "菊",
  ]);

  const recommendations = [
    {
      name: "獺祭",
      features: "特徴",
      reason: "理由",
    },
    {
      name: "東洋美人",
      features: "特徴",
      reason: "理由",
    },
    {
      name: "出羽桜",
      features: "特徴",
      reason: "理由",
    },
  ];

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
    // TODO: ここでおすすめを再取得する処理を追加
    console.log("Updated menu items:", items);
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        rightAction={
          <button
            onClick={() => setIsMenuModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-white transition-colors hover:bg-white/20"
            aria-label="メニューを編集"
          >
            <EditIcon className="text-xl" />
            <span className="text-sm">メニュー</span>
          </button>
        }
      />

      {/* メインコンテンツ */}
      <main className="pb-16 pt-14">
        <div className="px-6 py-8">
          <h2 className="mb-8 text-title text-[#2B2D5F]">
            今夜のおすすめ日本酒
          </h2>

          {/* ヒントメッセージ */}
          <div className="mb-6 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-l-4 border-blue-500">
            <p className="text-body text-blue-800">
              💡 メニューはヘッダーの「メニュー」ボタンから編集できます
            </p>
          </div>

          {/* おすすめリスト */}
          <div className="space-y-6">
            {recommendations.map((sake, index) => (
              <div key={index} className="border-b border-gray-300 pb-6">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">🏆</div>
                  <div className="flex-1">
                    <h3 className="mb-3 text-subtitle text-gray-800">
                      {sake.name}
                    </h3>
                    <div className="space-y-2 text-gray-700">
                      <p className="pl-8 text-body">{sake.features}</p>
                      <p className="pl-8 text-body">{sake.reason}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer items={footerItems} />
      <AddRecordButton onClick={() => setIsRecordModalOpen(true)} />

      {/* メニュー編集モーダル */}
      <Modal isOpen={isMenuModalOpen} onClose={() => setIsMenuModalOpen(false)}>
        <MenuEditor onSubmit={handleSubmitMenu} />
      </Modal>

      {/* 記録追加モーダル */}
      <Modal isOpen={isRecordModalOpen} onClose={() => setIsRecordModalOpen(false)}>
        <RecordForm 
          onSubmit={handleSubmitRecord}
          onCancel={() => setIsRecordModalOpen(false)}
        />
      </Modal>
    </div>
  );
}


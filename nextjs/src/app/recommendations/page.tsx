"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { MenuEditor } from "@/components/MenuEditor";

export default function RecommendationsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const handleSubmitMenu = (items: string[]) => {
    setMenuItems(items);
    setIsModalOpen(false);
    // TODO: ここでおすすめを再取得する処理を追加
    console.log("Updated menu items:", items);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-[#2B2D5F] py-6 text-center">
        <h1 className="text-2xl font-medium text-white">御酒印帳</h1>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 px-6 py-8">
        <h2 className="mb-8 text-3xl font-medium text-[#2B2D5F]">
          今夜のおすすめ日本酒
        </h2>

        {/* おすすめリスト */}
        <div className="space-y-6">
          {recommendations.map((sake, index) => (
            <div key={index} className="border-b border-gray-300 pb-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl">🏆</div>
                <div className="flex-1">
                  <h3 className="mb-3 text-2xl font-medium text-gray-800">
                    {sake.name}
                  </h3>
                  <div className="space-y-2 text-gray-700">
                    <p className="pl-8">{sake.features}</p>
                    <p className="pl-8">{sake.reason}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* モーダル風の情報カード */}
      <div className="px-6 pb-6">
        <div className="rounded-3xl bg-white px-6 py-8 shadow-lg">
          <p className="mb-4 text-center text-gray-700">
            メニューをもとに
            <br />
            おすすめを選出します。
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex w-full items-center justify-center gap-3 bg-[#2B2D5F] py-4 text-lg text-white transition-all hover:bg-[#3B3D7F]"
          >
            <span className="text-2xl">✏️</span>
            <span>メニューを編集する</span>
          </button>
        </div>
      </div>

      {/* フッターナビゲーション */}
      <footer className="grid grid-cols-2 border-t border-gray-300 bg-white">
        <button className="flex flex-col items-center justify-center gap-2 py-4 text-gray-600 hover:bg-gray-50">
          <span className="text-2xl">🏆</span>
          <span className="text-sm">出羽桜</span>
        </button>
        <button className="flex flex-col items-center justify-center gap-2 py-4 text-gray-600 hover:bg-gray-50">
          <span className="text-2xl">🏆</span>
          <span className="text-sm">出羽桜</span>
        </button>
      </footer>

      {/* メニュー編集モーダル */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <MenuEditor onSubmit={handleSubmitMenu} />
      </Modal>
    </div>
  );
}


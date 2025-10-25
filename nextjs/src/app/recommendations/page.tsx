"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { MenuEditor } from "@/components/MenuEditor";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HintCaption } from "@/components/HintCaption";
import StarIcon from "@mui/icons-material/Star";
import HistoryIcon from "@mui/icons-material/History";
import EditIcon from "@mui/icons-material/Edit";

export default function RecommendationsPage() {
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* メインコンテンツ */}
      <main className="pb-16 pt-14">
        <div className="px-6 py-8">
          <div className="mb-8 flex flex-col gap-3">
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
      <HintCaption message="💡 気に入った日本酒を見つけたら、感想を記録しておきましょう" />

      {/* メニュー編集モーダル */}
      <Modal isOpen={isMenuModalOpen} onClose={() => setIsMenuModalOpen(false)}>
        <MenuEditor onSubmit={handleSubmitMenu} />
      </Modal>
    </div>
  );
}


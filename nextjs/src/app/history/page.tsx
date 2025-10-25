"use client";

import { useState } from "react";
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* メインコンテンツ */}
      <main className="pb-16 pt-14">
        <div className="px-6 py-8">
          <h2 className="mb-8 text-3xl font-medium text-[#2B2D5F]">
            飲酒記録
          </h2>

          {/* モチベーションメッセージ */}
          <div className="mb-6 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 p-4 border-l-4 border-amber-500">
            <p className="text-sm font-medium text-amber-800">
              🎯 記録が増えるほど、AIがあなたの好みを学習します
            </p>
          </div>

          {/* 記録リスト */}
          {records.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <p className="text-lg">まだ記録がありません</p>
              <p className="mt-2 text-sm">飲んだお酒を記録してみましょう</p>
              <div className="mt-6">
                <p className="text-xs text-gray-400">右下の「+」ボタンから記録できます</p>
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
                    <h3 className="text-2xl font-medium text-gray-800">
                      {record.name}
                    </h3>
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-medium ${getRatingColor(
                        record.rating
                      )}`}
                    >
                      {record.rating}
                    </span>
                  </div>

                  {/* 感想 */}
                  <p className="mb-3 text-gray-700 leading-relaxed">
                    {record.impression}
                  </p>

                  {/* 日付 */}
                  <p className="text-sm text-gray-500">
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
      <AddRecordButton variant="motivational" />
    </div>
  );
}


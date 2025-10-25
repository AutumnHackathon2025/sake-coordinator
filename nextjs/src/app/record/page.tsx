"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import StarIcon from "@mui/icons-material/Star";
import HistoryIcon from "@mui/icons-material/History";

export default function RecordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    impression: "",
    rating: "" as "" | "非常に好き" | "好き" | "合わない" | "非常に合わない",
  });
  const [isSaving, setIsSaving] = useState(false);

  const ratings = [
    { value: "非常に好き", label: "非常に好き", emoji: "😍", color: "bg-red-500" },
    { value: "好き", label: "好き", emoji: "😊", color: "bg-pink-500" },
    { value: "合わない", label: "合わない", emoji: "😐", color: "bg-gray-400" },
    { value: "非常に合わない", label: "非常に合わない", emoji: "😞", color: "bg-gray-600" },
  ] as const;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // バリデーション
    if (!formData.name.trim()) {
      alert("銘柄を入力してください");
      return;
    }
    if (!formData.impression.trim()) {
      alert("味の感想を入力してください");
      return;
    }
    if (!formData.rating) {
      alert("評価を選択してください");
      return;
    }

    setIsSaving(true);
    
    // TODO: 実際のデータ保存処理
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setIsSaving(false);
    
    // 成功メッセージと履歴画面への遷移
    alert("記録を保存しました！\nあなたの好みがより正確に分析されます。");
    router.push("/history");
  };

  const isFormValid = formData.name.trim() && formData.impression.trim() && formData.rating;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* メインコンテンツ */}
      <main className="pb-24 pt-20">
        <div className="px-6 py-8">
          <h2 className="mb-4 text-3xl font-medium text-[#2B2D5F]">
            飲酒記録を追加
          </h2>
          
          {/* モチベーションメッセージ */}
          <div className="mb-8 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 p-4 border-l-4 border-[#2B2D5F]">
            <p className="text-sm text-gray-700 leading-relaxed">
              💡 記録すればするほど、あなたの好みに合ったおすすめが表示されるようになります
            </p>
          </div>

          {/* 記録フォーム */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 銘柄 */}
            <div>
              <label htmlFor="name" className="mb-2 block text-lg font-medium text-gray-700">
                銘柄 <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例：獺祭 純米大吟醸"
                maxLength={64}
                className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-lg text-gray-800 transition-colors focus:border-[#2B2D5F] focus:outline-none"
              />
              <p className="mt-1 text-sm text-gray-500">
                {formData.name.length}/64文字
              </p>
            </div>

            {/* 評価 */}
            <div>
              <label className="mb-3 block text-lg font-medium text-gray-700">
                評価 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {ratings.map((rating) => (
                  <button
                    key={rating.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: rating.value })}
                    className={`flex items-center justify-center gap-2 rounded-lg border-2 p-4 text-center transition-all ${
                      formData.rating === rating.value
                        ? `${rating.color} border-transparent text-white shadow-lg scale-105`
                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    <span className="text-2xl">{rating.emoji}</span>
                    <span className="font-medium">{rating.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 味の感想 */}
            <div>
              <label htmlFor="impression" className="mb-2 block text-lg font-medium text-gray-700">
                味の感想 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="impression"
                value={formData.impression}
                onChange={(e) => setFormData({ ...formData, impression: e.target.value })}
                placeholder="例：フルーティで華やかな香り。甘みと酸味のバランスが良く、とても飲みやすい。"
                maxLength={1000}
                rows={6}
                className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-lg text-gray-800 transition-colors focus:border-[#2B2D5F] focus:outline-none"
              />
              <p className="mt-1 text-sm text-gray-500">
                {formData.impression.length}/1000文字
              </p>
            </div>

            {/* 保存ボタン */}
            <button
              type="submit"
              disabled={!isFormValid || isSaving}
              className={`w-full rounded-lg py-4 text-xl font-medium text-white transition-all ${
                isFormValid && !isSaving
                  ? "bg-[#2B2D5F] hover:bg-[#3B3D7F] shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              {isSaving ? "保存中..." : "✨ 記録を保存する"}
            </button>
          </form>
        </div>
      </main>

      <Footer items={footerItems} />
    </div>
  );
}


"use client";

import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Rating, RATING_LABELS } from "@/types/api";
import { useRecordForm } from "./useRecordForm";
import { FOOTER_ITEMS } from "@/constants/navigation";

export default function RecordPage() {
  const router = useRouter();
  const { formData, isSaving, isFormValid, updateField, submitForm } = useRecordForm();

  const ratings: Array<{
    value: Rating;
    label: string;
    emoji: string;
    color: string;
  }> = [
    { value: "VERY_GOOD", label: RATING_LABELS["VERY_GOOD"], emoji: "😍", color: "bg-rating-love" },
    { value: "GOOD", label: RATING_LABELS["GOOD"], emoji: "😊", color: "bg-rating-like" },
    { value: "BAD", label: RATING_LABELS["BAD"], emoji: "😐", color: "bg-rating-dislike" },
    { value: "VERY_BAD", label: RATING_LABELS["VERY_BAD"], emoji: "😞", color: "bg-rating-hate" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const success = await submitForm(async (data) => {
      // TODO: 実際のAPI呼び出しに置き換え
      // const response = await fetch('/api/records', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`
      //   },
      //   body: JSON.stringify(data)
      // });

      await new Promise(resolve => setTimeout(resolve, 800));
      console.log("記録データ:", data);
    });

    if (success) {
      alert("記録を保存しました！\nあなたの好みがより正確に分析されます。");
      router.push("/history");
    } else {
      alert("記録の保存に失敗しました。もう一度お試しください。");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* メインコンテンツ */}
      <main className="pb-16 pt-14">
        <div className="px-6 py-6">
          <h2 className="mb-4 text-title text-[#2B2D5F]">
            飲酒記録を追加
          </h2>
          
          {/* モチベーションメッセージ */}
          <div className="mb-6 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 p-4 border-l-4 border-[#2B2D5F]">
            <p className="text-body text-gray-700 leading-relaxed">
              💡 記録すればするほど、あなたの好みに合ったおすすめが表示されるようになります
            </p>
          </div>

          {/* 記録フォーム */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 銘柄 */}
            <div>
              <label htmlFor="brand" className="mb-2 block text-body-lg font-medium text-gray-700">
                銘柄 <span className="text-red-500">*</span>
              </label>
              <input
                id="brand"
                type="text"
                value={formData.brand}
                onChange={(e) => updateField("brand", e.target.value)}
                placeholder="例：獺祭 純米大吟醸"
                maxLength={64}
                className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-body-lg text-gray-800 transition-colors focus:border-[#2B2D5F] focus:outline-none"
              />
              <p className="mt-1 text-body text-gray-500">
                {formData.brand.length}/64文字
              </p>
            </div>

            {/* 評価 */}
            <div>
              <label className="mb-3 block text-body-lg font-medium text-gray-700">
                評価 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {ratings.map((rating) => (
                  <button
                    key={rating.value}
                    type="button"
                    onClick={() => updateField("rating", rating.value)}
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
              <label htmlFor="impression" className="mb-2 block text-body-lg font-medium text-gray-700">
                味の感想 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="impression"
                value={formData.impression}
                onChange={(e) => updateField("impression", e.target.value)}
                placeholder="例：フルーティで華やかな香り。甘みと酸味のバランスが良く、とても飲みやすい。"
                maxLength={1000}
                rows={6}
                className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-body-lg text-gray-800 transition-colors focus:border-[#2B2D5F] focus:outline-none"
              />
              <p className="mt-1 text-body text-gray-500">
                {formData.impression.length}/1000文字
              </p>
            </div>

            {/* 保存ボタン */}
            <button
              type="submit"
              disabled={!isFormValid || isSaving}
              className={`w-full rounded-lg py-4 text-body-lg font-medium text-white transition-all ${
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

      <Footer items={FOOTER_ITEMS} />
    </div>
  );
}


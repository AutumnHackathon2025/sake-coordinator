"use client";

import { useState } from "react";
import { Rating, RATING_LABELS } from "@/types/api";

interface RecordFormProps {
  onSubmit: (data: {
    brand: string;
    impression: string;
    rating: Rating;
  }) => void;
  onCancel?: () => void;
  initialBrand?: string;
}

export function RecordForm({ onSubmit, onCancel, initialBrand }: RecordFormProps) {
  const [formData, setFormData] = useState({
    brand: initialBrand || "",
    impression: "",
    rating: "" as "" | Rating,
  });
  const [isSaving, setIsSaving] = useState(false);

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
    
    // バリデーション
    if (!formData.brand.trim()) {
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
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      onSubmit({
        brand: formData.brand,
        impression: formData.impression,
        rating: formData.rating,
      });
    } catch (error) {
      console.error("Error submitting record:", error);
      alert("記録の保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = formData.brand.trim() && formData.impression.trim() && formData.rating;

  return (
    <div className="flex flex-col p-6">
      <h2 className="mb-4 text-title text-primary">
        飲酒記録を追加
      </h2>
      
      {/* モチベーションメッセージ */}
      <div className="mb-6 rounded-lg bg-gradient-to-r from-bg-card to-bg-page p-4 border-l-4 border-primary">
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
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            placeholder="例：獺祭 純米大吟醸"
            maxLength={64}
            className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-body-lg text-gray-800 transition-colors focus:border-primary focus:outline-none"
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
          <label htmlFor="impression" className="mb-2 block text-body-lg font-medium text-gray-700">
            味の感想 <span className="text-red-500">*</span>
          </label>
          <textarea
            id="impression"
            value={formData.impression}
            onChange={(e) => setFormData({ ...formData, impression: e.target.value })}
            placeholder="例：フルーティで華やかな香り。甘みと酸味のバランスが良く、とても飲みやすい。"
            maxLength={1000}
            rows={6}
            className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-body-lg text-gray-800 transition-colors focus:border-primary focus:outline-none"
          />
          <p className="mt-1 text-body text-gray-500">
            {formData.impression.length}/1000文字
          </p>
        </div>

        {/* ボタンエリア */}
        <div className="flex gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg border-2 border-gray-300 py-4 text-body-lg font-medium text-gray-700 transition-all hover:bg-gray-50"
            >
              キャンセル
            </button>
          )}
          <button
            type="submit"
            disabled={!isFormValid || isSaving}
            className={`flex-1 rounded-lg py-4 text-body-lg font-medium text-text-light transition-all ${
              isFormValid && !isSaving
                ? "bg-primary hover:bg-primary-hover shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            {isSaving ? "保存中..." : "✨ 記録を保存する"}
          </button>
        </div>
      </form>
    </div>
  );
}


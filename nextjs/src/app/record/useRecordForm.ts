/**
 * 記録フォーム用のカスタムhook
 */

import { useState } from "react";
import { Rating } from "@/types/api";

interface RecordFormData {
  brand: string;
  impression: string;
  rating: "" | Rating;
}

export function useRecordForm() {
  const [formData, setFormData] = useState<RecordFormData>({
    brand: "",
    impression: "",
    rating: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const isFormValid =
    formData.brand.trim() !== "" &&
    formData.impression.trim() !== "" &&
    formData.rating !== "";

  const updateField = <K extends keyof RecordFormData>(
    field: K,
    value: RecordFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.brand.trim()) {
      alert("銘柄を入力してください");
      return false;
    }
    if (!formData.impression.trim()) {
      alert("味の感想を入力してください");
      return false;
    }
    if (!formData.rating) {
      alert("評価を選択してください");
      return false;
    }
    return true;
  };

  const submitForm = async (
    onSubmit: (data: {
      brand: string;
      impression: string;
      rating: Rating;
    }) => Promise<void> | void
  ) => {
    if (!validateForm()) {
      return false;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSubmit({
        brand: formData.brand,
        impression: formData.impression,
        rating: formData.rating as Rating,
      });
      return true;
    } catch (err) {
      console.error("Error submitting record:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      brand: "",
      impression: "",
      rating: "",
    });
    setError(null);
  };

  return {
    formData,
    isSaving,
    error,
    isFormValid,
    updateField,
    submitForm,
    resetForm,
  };
}


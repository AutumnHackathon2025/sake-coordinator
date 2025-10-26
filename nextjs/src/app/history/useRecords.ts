/**
 * 飲酒記録の取得・追加用のカスタムhook
 */

import { useState, useEffect } from "react";
import { DrinkingRecord, Rating } from "@/types/api";

export function useRecords() {
  const [records, setRecords] = useState<DrinkingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 初回読み込み時にデータを取得
  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/records');
      
      if (!response.ok) {
        throw new Error(`記録の取得に失敗しました: ${response.status}`);
      }
      
      const result = await response.json();
      
      // successResponse関数が{data: T}形式でラップするため、dataプロパティを取得
      const data = result.data || result;
      
      // レスポンスが配列であることを確認
      if (Array.isArray(data)) {
        setRecords(data);
      } else {
        console.warn("予期しないレスポンス形式:", result);
        setRecords([]);
      }
    } catch (err) {
      console.error("Failed to fetch records:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addRecord = async (data: {
    brand: string;
    impression: string;
    rating: Rating;
  }) => {
    try {
      const response = await fetch('/api/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`記録の保存に失敗しました: ${response.status}`);
      }

      const result = await response.json();
      const newRecord = result.data || result; // successResponse形式に対応
      
      setRecords([newRecord, ...records]);
      return newRecord;
    } catch (err) {
      console.error("Failed to save record:", err);
      throw err;
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      const response = await fetch(`/api/records/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`記録の削除に失敗しました: ${response.status}`);
      }

      setRecords(records.filter((record) => record.id !== id));
    } catch (err) {
      console.error("Failed to delete record:", err);
      throw err;
    }
  };

  const updateRecord = async (
    id: string,
    data: Partial<Omit<DrinkingRecord, "id" | "userId" | "createdAt">>
  ) => {
    try {
      const response = await fetch(`/api/records/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`記録の更新に失敗しました: ${response.status}`);
      }

      const result = await response.json();
      const updatedRecord = result.data || result; // successResponse形式に対応
      
      setRecords(
        records.map((record) => (record.id === id ? updatedRecord : record))
      );
      return updatedRecord;
    } catch (err) {
      console.error("Failed to update record:", err);
      throw err;
    }
  };

  return {
    records,
    isLoading,
    error,
    fetchRecords,
    addRecord,
    deleteRecord,
    updateRecord,
  };
}


/**
 * 飲酒記録の取得・追加用のカスタムhook
 */

import { useState, useEffect } from "react";
import { DrinkingRecord, Rating } from "@/types/api";
import { generateMockRecords } from "@/lib/mockData";

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
      // TODO: 実際のAPI呼び出しに置き換え
      // const response = await fetch('/api/records', {
      //   headers: {
      //     'Authorization': `Bearer ${token}`
      //   }
      // });
      // const data = await response.json();
      // setRecords(data);

      // モックデータを使用
      await new Promise((resolve) => setTimeout(resolve, 300));
      const mockRecords = generateMockRecords();
      setRecords(mockRecords);
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
      // TODO: 実際のAPI呼び出しに置き換え
      // const response = await fetch('/api/records', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`
      //   },
      //   body: JSON.stringify(data)
      // });
      // const newRecord = await response.json();

      // モックデータとして新しいレコードを追加
      const newRecord: DrinkingRecord = {
        id: `rec-${Date.now()}`,
        userId: "user-mock-001",
        brand: data.brand,
        impression: data.impression,
        rating: data.rating,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setRecords([newRecord, ...records]);
      return newRecord;
    } catch (err) {
      console.error("Failed to save record:", err);
      throw err;
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      // TODO: 実際のAPI呼び出しに置き換え
      // await fetch(`/api/records/${id}`, {
      //   method: 'DELETE',
      //   headers: {
      //     'Authorization': `Bearer ${token}`
      //   }
      // });

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
      // TODO: 実際のAPI呼び出しに置き換え
      // const response = await fetch(`/api/records/${id}`, {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`
      //   },
      //   body: JSON.stringify(data)
      // });
      // const updatedRecord = await response.json();

      const updatedRecord: DrinkingRecord = {
        ...records.find((r) => r.id === id)!,
        ...data,
        updatedAt: new Date().toISOString(),
      };

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


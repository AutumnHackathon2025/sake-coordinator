/**
 * おすすめページ用のカスタムhook
 */

import { useState, useEffect } from "react";
import { RecommendationResult } from "@/types/api";
import { generateMockRecommendations } from "@/lib/mockData";

export function useRecommendations(initialMenu: string[]) {
  const [menuItems, setMenuItems] = useState<string[]>(initialMenu);
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // メニューが変更されたら推薦を再取得
  useEffect(() => {
    fetchRecommendations(menuItems);
  }, []);

  const fetchRecommendations = async (menu: string[]) => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: 実際のAPI呼び出しに置き換え
      // const response = await fetch('/agent/recommend', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ menu })
      // });
      // const data = await response.json();
      // setRecommendations(data.recommendations);

      // モックデータを使用
      await new Promise((resolve) => setTimeout(resolve, 500)); // API呼び出しを模擬
      const mockRecommendations = generateMockRecommendations(menu);
      setRecommendations(mockRecommendations);
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateMenu = (items: string[]) => {
    setMenuItems(items);
    // メニュー更新後、推薦を再取得
    fetchRecommendations(items);
  };

  return {
    menuItems,
    recommendations,
    isLoading,
    error,
    updateMenu,
    refetch: () => fetchRecommendations(menuItems),
  };
}


/**
 * おすすめページ用のカスタムhook
 */

import { useState, useEffect } from "react";
import { RecommendationResult } from "@/types/api";
import { ApiRecommendationResponse } from "@/utils/transform";

export function useRecommendations(initialMenu: string[]) {
  const [menuItems, setMenuItems] = useState<string[]>(initialMenu);
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // メニューが変更されたら推薦を再取得
  useEffect(() => {
    fetchRecommendations(menuItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRecommendations = async (menu: string[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/agent/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menu })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`推薦の取得に失敗しました: ${response.status}`);
      }

      const data: ApiRecommendationResponse = await response.json();

      console.log('API Response:', data); // デバッグ用

      // AgentCoreのレスポンスをRecommendationResult[]に変換
      const results: RecommendationResult[] = [];

      // best_recommendがある場合、最初に追加
      if (data.best_recommend) {
        results.push({
          brand: data.best_recommend.brand,
          brand_description: data.best_recommend.brand_description,
          expected_experience: data.best_recommend.expected_experience,
          match_score: data.best_recommend.match_score,
          category: "鉄板マッチ"
        });
      }

      // その他のrecommendationsを追加
      if (data.recommendations && Array.isArray(data.recommendations) && data.recommendations.length > 0) {
        data.recommendations.forEach(rec => {
          results.push({
            brand: rec.brand,
            brand_description: rec.brand_description,
            expected_experience: rec.expected_experience,
            category: rec.category,
            match_score: rec.match_score,
          });
        });
      }

      setRecommendations(results);
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


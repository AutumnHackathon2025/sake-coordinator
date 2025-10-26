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
      
      // match_scoreを1-5のスコアに変換する関数
      const convertScore = (matchScore: number): number => {
        // 0-100のスコアを1-5に変換
        if (matchScore >= 90) return 5;
        if (matchScore >= 70) return 4;
        if (matchScore >= 50) return 3;
        if (matchScore >= 30) return 2;
        return 1;
      };
      
      // best_recommendがある場合、最初に追加
      if (data.best_recommend) {
        results.push({
          brand: data.best_recommend.brand,
          score: convertScore(data.best_recommend.match_score),
          reason: data.best_recommend.expected_experience,
        });
      }
      
      // その他のrecommendationsを追加
      if (data.recommendations && Array.isArray(data.recommendations) && data.recommendations.length > 0) {
        data.recommendations.forEach(rec => {
          results.push({
            brand: rec.brand,
            score: convertScore(rec.match_score),
            reason: rec.expected_experience,
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


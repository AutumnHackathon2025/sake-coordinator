/**
 * モックデータ生成ヘルパー
 * APIが実装されるまでの仮データを提供
 */

import { DrinkingRecord, RecommendationResult } from "@/types/api";

/**
 * モックの飲酒記録データを生成
 */
export function generateMockRecords(): DrinkingRecord[] {
  return [
    {
      id: "rec-001",
      userId: "user-mock-001",
      brand: "獺祭 純米大吟醸",
      impression:
        "フルーティで華やかな香り。甘みと酸味のバランスが良く、とても飲みやすい。後味もスッキリしていて食事との相性も良い。",
      rating: "VERY_GOOD",
      createdAt: "2025-01-15T10:30:00Z",
      updatedAt: "2025-01-15T10:30:00Z",
    },
    {
      id: "rec-002",
      userId: "user-mock-001",
      brand: "東洋美人 純米吟醸",
      impression:
        "すっきりとした味わいで、キレが良い。少し辛口だが飲みやすい。魚料理と合わせると特に美味しい。",
      rating: "GOOD",
      createdAt: "2025-01-10T18:45:00Z",
      updatedAt: "2025-01-10T18:45:00Z",
    },
    {
      id: "rec-003",
      userId: "user-mock-001",
      brand: "出羽桜 桜花吟醸",
      impression:
        "芳醇な香りと深い味わい。米の旨味がしっかり感じられる。やや重めの味わいだが、料理と一緒に楽しむのに最適。",
      rating: "VERY_GOOD",
      createdAt: "2025-01-05T19:20:00Z",
      updatedAt: "2025-01-05T19:20:00Z",
    },
    {
      id: "rec-004",
      userId: "user-mock-001",
      brand: "久保田 千寿",
      impression:
        "バランスの取れた味わい。特に際立つ特徴はないが、安定した美味しさ。万人受けする日本酒だと思う。",
      rating: "GOOD",
      createdAt: "2024-12-28T20:10:00Z",
      updatedAt: "2024-12-28T20:10:00Z",
    },
    {
      id: "rec-005",
      userId: "user-mock-001",
      brand: "菊正宗 上撰",
      impression:
        "辛口で個性が強い。自分の好みとは少し違った。温めて飲むと良いのかもしれない。",
      rating: "BAD",
      createdAt: "2024-12-20T21:30:00Z",
      updatedAt: "2024-12-20T21:30:00Z",
    },
  ];
}

/**
 * メニューに基づいてモックの推薦結果を生成
 */
export function generateMockRecommendations(
  menu: string[]
): RecommendationResult[] {
  // メニューが空の場合
  if (menu.length === 0) {
    return [];
  }

  // スコア順にする。また、スコアは5から1までの少数第二位までの値である。
  const allRecommendations: RecommendationResult[] = [
    {
      brand: "獺祭 純米大吟醸",
      score: 4.9,
      reason:
        "あなたの「フルーティで香りが高い」という好みに最も一致します。華やかで飲みやすい味わいが特徴です。",
    },
    {
      brand: "黒龍 しずく",
      score: 4.8,
      reason:
        "「飲みやすい」という感想に近く、クリアな味わいがおすすめです。すっきりとした後味が魅力的。",
    },
    {
      brand: "十四代 本丸",
      score: 4.3,
      reason:
        "バランスの良い甘みと旨味が特徴。あなたの好みに合った上品な味わいが楽しめます。",
    },
    {
      brand: "出羽桜 桜花吟醸",
      score: 4.2,
      reason:
        "芳醇な香りと深い味わい。米の旨味を重視するあなたの嗜好にぴったりです。",
    },
    {
      brand: "東洋美人 純米吟醸",
      score: 4.1,
      reason:
        "すっきりとキレのある味わい。食事と合わせやすく、飽きのこない美味しさです。",
    },
    {
      brand: "鍋島 特別純米",
      score: 3.9,
      reason:
        "フルーティな香りと柔らかな口当たり。優しい甘みが特徴的な日本酒です。",
    },
    {
      brand: "久保田 千寿",
      score: 3.8,
      reason:
        "バランスの取れた味わいで、どんな料理にも合わせやすい定番の一本です。",
    },
    {
      brand: "八海山 普通酒",
      score: 3.7,
      reason:
        "すっきりとした辛口。クセがなく飲みやすいので、日本酒初心者にもおすすめです。",
    },
    {
      brand: "田酒 特別純米",
      score: 3.0,
      reason:
        "米本来の旨味を存分に感じられる濃醇な味わい。飲み応えのある一本です。",
    },
    {
      brand: "醸し人九平次 純米大吟醸",
      score: 2.5,
      reason:
        "洗練されたフルーティな香りと上品な甘み。ワインのような味わいが特徴的です。",
    },
  ];

  // メニューに含まれているものを優先的に返す
  const inMenu = allRecommendations.filter((rec) =>
    menu.some((item) => rec.brand.includes(item) || item.includes(rec.brand))
  );

  const notInMenu = allRecommendations.filter(
    (rec) =>
      !menu.some((item) => rec.brand.includes(item) || item.includes(rec.brand))
  );

  // メニューに含まれるものを優先し、スコア降順でソート、最大10件まで返す
  const combined = [...inMenu, ...notInMenu];
  return combined.sort((a, b) => b.score - a.score).slice(0, 10);
}

/**
 * デフォルトのメニューリストを生成
 */
export function getDefaultMenu(): string[] {
  return [
    "獺祭 純米大吟醸",
    "十四代 本丸",
    "黒龍 しずく",
    "八海山 普通酒",
    "出羽桜 桜花吟醸",
  ];
}


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

  // マッチスコア順にする。スコアは0-100の値。
  const allRecommendations: RecommendationResult[] = [
    {
      brand: "獺祭 純米大吟醸",
      brand_description: "外れなしの安全圏。現在の味覚パーソナリティに完全に合致する銘柄です。",
      expected_experience: "あなたの『穏やかな吟醸香へのこだわり』と『キレの良さの重視』というマップ傾向に最も忠実な選択です。",
      category: "鉄板マッチ",
      match_score: 95,
    },
    {
      brand: "黒龍 しずく",
      brand_description: "現在の好みを保ちつつ、新しい発見ができる銘柄。感性マップを広げるための賢い一歩です。",
      expected_experience: "『口当たりの優しさ重視度』を維持しながら、『酸味の許容度』を拡張することで、新しい満足感が得られます。",
      category: "次の一手",
      match_score: 88,
    },
    {
      brand: "十四代 本丸",
      brand_description: "バランスの取れた甘みと旨味の極致。幻の銘酒として名高い逸品です。",
      expected_experience: "あなたの『上品な甘み志向』と『芳醇さへの憧れ』が満たされる、至福の一献です。",
      category: "鉄板マッチ",
      match_score: 93,
    },
    {
      brand: "出羽桜 桜花吟醸",
      brand_description: "華やかな香りと深いコク。伝統的な醸造技術が生み出す至高の味わい。",
      expected_experience: "『米の旨味重視度』という軸を深めながら、『芳醇な香り』への探求心を満たします。",
      category: "鉄板マッチ",
      match_score: 91,
    },
    {
      brand: "東洋美人 純米吟醸",
      brand_description: "すっきりとしたキレ味の中に潜む、繊細な旨味。食中酒としての完成度が高い一本。",
      expected_experience: "あなたの『飲みやすさ重視』という感性に寄り添いながら、新たな『キレ味の発見』をもたらします。",
      category: "次の一手",
      match_score: 85,
    },
    {
      brand: "鍋島 特別純米",
      brand_description: "フルーティな香りと柔らかな口当たり。若き杜氏が生み出す革新の味。",
      expected_experience: "『優しい甘み志向』を保ちつつ、『フルーティな香り』への新しい扉を開きます。",
      category: "次の一手",
      match_score: 82,
    },
    {
      brand: "久保田 千寿",
      brand_description: "誰からも愛される定番の味。安定した美味しさで、どんなシーンにも寄り添います。",
      expected_experience: "『バランス重視度』というあなたの軸を再確認しながら、安心感のある時間を提供します。",
      category: "次の一手",
      match_score: 78,
    },
    {
      brand: "八海山 普通酒",
      brand_description: "あなたの現在のマップから最も離れていますが、飲酒記録にある『知的好奇心の高さ』から、意外な感動をもたらす可能性を秘めています。",
      expected_experience: "あなたのメインの感性とは対極にある『軽快さ』が、シチュエーションによって新しい扉を開くかもしれません。",
      category: "運命の出会い",
      match_score: 62,
    },
    {
      brand: "田酒 特別純米",
      brand_description: "米本来の力強い旨味を追求した、硬派な一本。通好みの濃醇な味わい。",
      expected_experience: "『濃醇さ』という未開拓の領域へ、あなたの感性マップを大胆に拡張する冒険です。",
      category: "運命の出会い",
      match_score: 58,
    },
    {
      brand: "醸し人九平次 純米大吟醸",
      brand_description: "ワインのような洗練された香り。日本酒の新しい可能性を切り開く革新的な味わい。",
      expected_experience: "『フルーティ』という軸を極限まで突き詰めた、未知の体験があなたを待っています。",
      category: "運命の出会い",
      match_score: 55,
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

  // メニューに含まれるものを優先し、マッチスコア降順でソート、最大10件まで返す
  const combined = [...inMenu, ...notInMenu];
  return combined.sort((a, b) => b.match_score - a.match_score).slice(0, 10);
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


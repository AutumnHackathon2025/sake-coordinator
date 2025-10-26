# 設計書: 推薦カテゴリーの動的生成

## Overview

本設計は、日本酒推薦システムにおけるカテゴリー生成ロジックを、固定値（「次の一手」「運命の出会い」）から動的生成に変更するものです。AIが推薦理由や特徴に応じて簡潔なカテゴリー名（1-10文字）を生成することで、より柔軟で説明的な推薦を実現します。

### 設計目標

1. **簡潔性**: 10文字以内の短いカテゴリー名
2. **柔軟性**: AIが文脈に応じて適切なカテゴリー名を生成
3. **説明性**: カテゴリー名が推薦理由を明確に表現
4. **後方互換性**: 既存のAPIレスポンス形式を維持

## Architecture

### 変更対象コンポーネント

```
RecommendationService
├── _build_recommendation_prompt()  # プロンプト構築ロジックの更新
├── _parse_recommendations()        # レスポンスパース処理の更新
└── generate_recommendations()      # 推薦生成ロジック（変更なし）

Recommendationモデル
├── BestRecommendation              # 変更なし
└── Recommendation                  # categoryバリデーションの更新（1-10文字）

テスト
├── test_recommendation_service.py  # ユニットテストの更新
└── test_recommendation_integration.py  # 統合テストの更新
```

## Components and Interfaces

### 1. RecommendationService._build_recommendation_prompt()

**変更内容**: プロンプトにカテゴリー動的生成の指示を追加（10文字制限）

**更新後のプロンプト**:
```python
def _build_recommendation_prompt(
    self,
    taste_analysis: Dict[str, Any],
    drinking_records: List[DrinkingRecord],
    menu: Optional[Menu] = None
) -> str:
    prompt = f"""
あなたは日本酒の推薦エキスパートです。ユーザーの味の好みと飲酒履歴を分析し、最適な日本酒を推薦してください。

## ユーザーの味の好み
{json.dumps(taste_analysis, ensure_ascii=False, indent=2)}

## 最近の飲酒履歴（最新10件）
{self._format_drinking_records(drinking_records[:10])}

## メニューリスト
{json.dumps(menu.sake_names if menu else [], ensure_ascii=False)}

## 推薦要件
1. best_recommend: 最もマッチ度が高い1件を選択（カテゴリーなし）
   - brand: 銘柄名（1-64文字）
   - brand_description: 銘柄の説明（1-200文字）
   - expected_experience: 期待される体験（1-500文字）
   - match_score: マッチ度（1-100）

2. recommendations: 残りの銘柄から最大2件を選択
   - brand: 銘柄名（1-64文字）
   - brand_description: 銘柄の説明（1-200文字）
   - expected_experience: 期待される体験（1-500文字）
   - category: 推薦理由や特徴を表現する簡潔な文言（1-10文字）
     例: "新しい挑戦", "好みに近い", "意外な発見", "冒険の一杯", "安定の選択"
   - match_score: マッチ度（1-100）

## レスポンス形式
以下のJSON形式で返してください:
{{
  "best_recommend": {{
    "brand": "銘柄名",
    "brand_description": "説明",
    "expected_experience": "体験",
    "match_score": 95
  }},
  "recommendations": [
    {{
      "brand": "銘柄名",
      "brand_description": "説明",
      "expected_experience": "体験",
      "category": "新しい挑戦",
      "match_score": 85
    }}
  ]
}}
"""
    return prompt
```

### 2. RecommendationService._parse_recommendations()

**変更内容**: 動的カテゴリーの抽出とバリデーション（1-10文字）

**実装例**:
```python
def _parse_recommendations(
    self,
    response_text: str
) -> Tuple[Optional[BestRecommendation], List[Recommendation]]:
    """Bedrockレスポンスをパースして推薦結果を抽出"""
    try:
        # JSONレスポンスをパース
        response_data = json.loads(response_text)
        
        # best_recommendを抽出
        best_recommend = None
        if "best_recommend" in response_data and response_data["best_recommend"]:
            best_data = response_data["best_recommend"]
            best_recommend = BestRecommendation(
                brand=best_data["brand"],
                brand_description=best_data["brand_description"],
                expected_experience=best_data["expected_experience"],
                match_score=best_data["match_score"]
            )
        
        # recommendationsを抽出
        recommendations = []
        if "recommendations" in response_data:
            for rec_data in response_data["recommendations"][:2]:  # 最大2件
                # カテゴリーのバリデーション（1-10文字）
                category = rec_data.get("category", "")
                if not category or len(category) < 1 or len(category) > 10:
                    logger.warning(
                        f"カテゴリーが範囲外です: {category}",
                        category_length=len(category)
                    )
                    # デフォルトカテゴリーを設定
                    category = "おすすめ"
                
                recommendation = Recommendation(
                    brand=rec_data["brand"],
                    brand_description=rec_data["brand_description"],
                    expected_experience=rec_data["expected_experience"],
                    category=category,
                    match_score=rec_data["match_score"]
                )
                recommendations.append(recommendation)
        
        return best_recommend, recommendations
        
    except (json.JSONDecodeError, KeyError, ValidationError) as e:
        logger.error("推薦結果のパースに失敗しました", error=str(e))
        raise ValueError(f"推薦結果のパースに失敗しました: {str(e)}")
```

### 3. Recommendationモデル

**変更内容**: categoryフィールドのバリデーション更新（1-10文字）

**更新後**:
```python
class Recommendation(BaseModel):
    brand: str = Field(..., min_length=1, max_length=64)
    brand_description: str = Field(..., min_length=1, max_length=200)
    expected_experience: str = Field(..., min_length=1, max_length=500)
    category: str = Field(..., min_length=1, max_length=10)  # 10文字以内
    match_score: int = Field(..., ge=1, le=100)
    
    @validator('category')
    def validate_category(cls, v):
        if not v or not v.strip():
            raise ValueError('カテゴリーは空にできません')
        if len(v) > 10:
            raise ValueError('カテゴリーは10文字以内にしてください')
        return v.strip()
```

## Data Models

### BestRecommendation（変更なし）

```python
class BestRecommendation(BaseModel):
    brand: str = Field(..., min_length=1, max_length=64)
    brand_description: str = Field(..., min_length=1, max_length=200)
    expected_experience: str = Field(..., min_length=1, max_length=500)
    match_score: int = Field(..., ge=1, le=100)
```

### Recommendation（更新）

```python
class Recommendation(BaseModel):
    brand: str = Field(..., min_length=1, max_length=64)
    brand_description: str = Field(..., min_length=1, max_length=200)
    expected_experience: str = Field(..., min_length=1, max_length=500)
    category: str = Field(..., min_length=1, max_length=10)  # 動的生成、10文字以内
    match_score: int = Field(..., ge=1, le=100)
```

## Testing Strategy

### 1. ユニットテスト

```python
async def test_parse_recommendations_with_dynamic_category():
    """動的カテゴリーのパース処理をテスト"""
    service = RecommendationService()
    
    response_text = json.dumps({
        "best_recommend": {
            "brand": "獺祭",
            "brand_description": "フルーティで華やか",
            "expected_experience": "洗練された味わい",
            "match_score": 95
        },
        "recommendations": [
            {
                "brand": "久保田",
                "brand_description": "すっきりとした辛口",
                "expected_experience": "キレのある後味",
                "category": "新しい挑戦",
                "match_score": 85
            },
            {
                "brand": "黒龍",
                "brand_description": "バランスの良い味わい",
                "expected_experience": "安定感のある一杯",
                "category": "好みに近い",
                "match_score": 80
            }
        ]
    })
    
    best_recommend, recommendations = service._parse_recommendations(response_text)
    
    # best_recommendの検証
    assert best_recommend is not None
    assert best_recommend.brand == "獺祭"
    
    # recommendationsの検証
    assert len(recommendations) == 2
    assert recommendations[0].category == "新しい挑戦"
    assert recommendations[1].category == "好みに近い"
    assert 1 <= len(recommendations[0].category) <= 10
    assert 1 <= len(recommendations[1].category) <= 10
```

## Error Handling

### カテゴリーバリデーションエラー

**発生条件**:
- カテゴリーが空文字列
- カテゴリーが10文字超過

**対応**:
```python
if not category or len(category) < 1 or len(category) > 10:
    logger.warning(
        f"カテゴリーが範囲外です: {category}",
        category_length=len(category)
    )
    category = "おすすめ"  # デフォルト値（5文字）
```

## Documentation Updates

### README.md

```markdown
## 推薦カテゴリー

推薦結果には以下の構造が含まれます:

- **best_recommend**: 最もマッチ度が高い1件（カテゴリーなし）
- **recommendations**: 残りの推薦（最大2件、各銘柄に動的なカテゴリー）

### カテゴリー名の例（10文字以内）

- "新しい挑戦"
- "好みに近い"
- "意外な発見"
- "冒険の一杯"
- "安定の選択"

カテゴリー名は1-10文字の範囲で、推薦理由や特徴を簡潔に表現します。
```

### レスポンス例

```json
{
  "best_recommend": {
    "brand": "獺祭",
    "brand_description": "フルーティで華やかな香りが特徴の純米大吟醸",
    "expected_experience": "洗練された味わいと上品な余韻をお楽しみいただけます",
    "match_score": 95
  },
  "recommendations": [
    {
      "brand": "久保田",
      "brand_description": "すっきりとした辛口で食事に合わせやすい",
      "expected_experience": "キレのある後味で、どんな料理とも相性抜群",
      "category": "新しい挑戦",
      "match_score": 85
    },
    {
      "brand": "黒龍",
      "brand_description": "バランスの良い味わいで飲みやすい",
      "expected_experience": "安定感のある一杯で、リラックスした時間を",
      "category": "好みに近い",
      "match_score": 80
    }
  ]
}
```

# **🍶 味で楽しむ日本酒おすすめサービス API設計書**

## **1\. 概要**

本ドキュメントは、「味で楽しむ日本酒おすすめサービス」のバックエンド機能を提供するためのREST API仕様を定義します。

インフラ構成に基づき、API Gatewayをエントリーポイントとし、Amazon Cognitoによる認証を必須とします。一部の機能（推薦）はBedrock Agentを活用し、その他の機能（記録、OCR）はLambda関数によって処理されます。

## **2\. 共通仕様**

### **2.1. ベースURL**

すべてのAPIエンドポイントは、以下のベースURLを基点とします。

https://api.your-domain.com/v1

### **2.2. 認証**

すべてのリクエスト（認証エンドポイントを除く）は、Amazon Cognitoが発行したJWT（IDトークン）をAuthorizationヘッダーに含める必要があります。

* **ヘッダー:** Authorization  
* **値:** Bearer \<ID\_Token\>

認証されていないリクエスト、または無効なトークンを持つリクエストは 401 Unauthorized を返します。

### **2.3. エラーレスポンス**

APIはエラー発生時、標準的なエラーレスポンスボディを返します。

**HTTPステータスコード:** 4xx または 5xx

**レスポンスボディ (例: 400 Bad Request)**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "銘柄は必須入力です。"
  }
}
```

## **3\. データモデル**

APIで使用される主要なデータモデルを定義します。

### **3.1. DrinkingRecord (飲酒歴)**

飲酒記録(機能2)で保存・参照されるデータ。

| フィールド名 | 型 | 説明 | 制約 |
| :---- | :---- | :---- | :---- |
| id | String | 一意のレコードID (UUID) | 必須, ReadOnly |
| userId | String | ユーザーID (Cognito sub) | 必須, ReadOnly |
| brand | String | 銘柄 | 必須, 1-64文字 |
| impression | String | 味の感想 | 必須, 1-1000文字 |
| rating | String | 評価 | 必須 ( VERY\_GOOD |
| labelImageKey | String | S3に保存されたラベル画像のキー | 任意, ReadOnly (Uploads API経由で設定) |
| createdAt | String | 作成日時 (ISO 8601\) | 必須, ReadOnly |
| updatedAt | String | 更新日時 (ISO 8601\) | 必須, ReadOnly |

*(注: 評価のEnum値 VERY\_GOOD 等は仮置きであり、フロントエンドの表示ラベル「非常に好き」等に対応します)*

### **3.2. RecommendationResult (推薦結果)**

推薦機能(機能1)の出力データ。

| フィールド名 | 型 | 説明 | 制約 |
| :---- | :---- | :---- | :---- |
| brand | String | 銘柄 | 必須, 1-64文字 |
| score | Number | おすすめ度合い (1-5) | 必須 |
| reason | String | おすすめする理由（説明） | 必須, 1-500文字 |

### **3.3. Menu (メニュー)**

OCR機能(機能3)の出力、または推薦機能(機能1)の入力データ。

```json
{
  "brands": [
    "獺祭 純米大吟醸",
    "十四代 本丸",
    "黒龍 しずく"
  ]
}
```

## **4\. APIエンドポイント**

インフラ構成図の /api/\* (Lambda統合) と /agent/\* (Bedrock Agent統合) のパスに基づき、以下のエンドポイントを定義します。

---

### **4.1. 飲酒歴 (Records)**

**リソースパス:** /api/records

飲酒の記録（機能2）、履歴検索（機能5）、ラベル画像の紐付け（機能4）を管理します。

#### **4.1.1. 飲酒歴の新規作成 (機能2)**

**POST /api/records**

新しい飲酒歴をデータベースに保存します。

* **リクエストボディ (application/json):**

```json
{
  "brand": "獺祭 純米大吟醸",
  "impression": "非常にフルーティで飲みやすい。香りが高い。",
  "rating": "VERY_GOOD"
}
```

* **レスポンス (201 Created):**  
  * 作成された DrinkingRecord オブジェクト（idを含む）を返します。  
* **異常系:**  
  * 400 Bad Request: バリデーションエラー（必須項目不足、文字数超過など）。  
  * 500 Internal Server Error: データベース保存失敗。

#### **4.1.2. 飲酒歴のリスト取得 (機能5: 検索)**

**GET /api/records**

ユーザー自身の飲酒歴リストを取得します。キーワード検索（機能5）にも対応します。

* **クエリパラメータ:**  
  * q (String, 任意): 検索キーワード。「銘柄」または「味の感想」に対して部分一致検索を行います。  
* **レスポンス (200 OK):**  
  * DrinkingRecord オブジェクトの配列を返します。  
  * q が指定され、結果が0件の場合は空の配列 \[\] を返します。

```json
[
  {
    "id": "uuid-1234-abcd",
    "userId": "cognito-sub-uuid",
    "brand": "獺祭 純米大吟醸",
    "impression": "非常にフルーティ...",
    "rating": "VERY_GOOD",
    "labelImageKey": "uploads/labels/image-key.jpg",
    "createdAt": "2025-10-25T01:30:00Z",
    "updatedAt": "2025-10-25T01:35:00Z"
  },
  ...
]
```

* **異常系:**  
  * 500 Internal Server Error: データベース検索失敗。

#### **4.1.3. 飲酒歴の更新 (機能4: ラベル紐付け等)**

**PUT /api/records/{recordId}**

特定の飲酒歴を更新します。主に、ラベル画像アップロード(機能4)の完了後に、画像のS3キーを記録に紐付けるために使用します。

* **パスパラメータ:**  
  * recordId (String, 必須): 更新対象の飲酒歴ID。  
* **リクエストボディ (application/json):**  
  * 更新したいフィールドのみを含めます。

```json
{
  "impression": "改めて飲むと、少し甘みが強いかも。",
  "rating": "GOOD",
  "labelImageKey": "uploads/labels/new-image-key.jpg"
}
```

* **レスポンス (200 OK):**  
  * 更新後の DrinkingRecord オブジェクトを返します。  
* **異常系:**  
  * 400 Bad Request: バリデーションエラー。  
  * 404 Not Found: 指定された recordId が見つからない。  
  * 500 Internal Server Error: データベース更新失敗。

#### **4.1.4. 飲酒歴の削除**

**DELETE /api/records/{recordId}**

特定の飲酒歴を削除します。

* **パスパラメータ:**  
  * recordId (String, 必須): 削除対象の飲酒歴ID。  
* **レスポンス (204 No Content):**  
  * 成功時はボディなし。  
* **異常系:**  
  * 404 Not Found: 指定された recordId が見つからない。  
  * 500 Internal Server Error: データベース削除失敗。

---

### **4.2. アップロード (Uploads)**

**リソースパス:** /api/uploads

機能4（ラベル画像）および機能3（メニュー画像）のアップロード処理をサポートします。大容量ファイル（20MB）に対応するため、S3への署名付きURL(Pre-signed URL)を発行する方式を採用します。

#### **4.2.1. アップロード用URLの取得 (機能3, 4\)**

**POST /api/uploads/presigned-url**

クライアントがS3に直接ファイルをアップロードするための一時的なURLを発行します。

* **リクエストボディ (application/json):**

```json
{
  "contentType": "image/jpeg",
  "purpose": "label" 
}
```

  * purpose (String, 必須): アップロード目的 (label または menu\_ocr)。保存先S3パスの決定に使用します。  
* **レスポンス (200 OK):**

```json
{
  "uploadUrl": "https://s3-bucket-name.s3.ap-northeast-1.amazonaws.com/...",
  "assetKey": "uploads/labels/user-id/random-uuid.jpg"
}
```

  * uploadUrl: クライアントが **HTTP PUT** でファイルをアップロードする先のURL。  
  * assetKey: S3バケット内でのファイルパス。  
    * purposeがlabelの場合、このassetKeyを PUT /api/records/{recordId} で labelImageKey として保存します。  
    * purposeがmenu\_ocrの場合、このassetKeyを POST /api/ocr/menu で使用します。  
* **異常系:**  
  * 500 Internal Server Error: URL発行失敗。

---

### **4.3. メニューOCR (OCR)**

**リソースパス:** /api/ocr

機能3（メニュー取り込み）のOCR処理を実行します。

#### **4.3.1. メニュー画像のOCR実行 (機能3)**

**POST /api/ocr/menu**

S3にアップロードされたメニュー画像のOCRを実行し、銘柄リストを抽出します。

* **前提:** クライアントは事前に POST /api/uploads/presigned-url (purpose: menu\_ocr) でassetKeyを取得し、S3への画像アップロードを完了している必要があります。  
* **リクエストボディ (application/json):**

```json
{
  "assetKey": "uploads/menu_ocr/user-id/menu-image-key.jpg"
}
```

* **レスポンス (200 OK):**  
  * Menu データ形式（銘柄のリスト）を返します。

```json
{
  "brands": [
    "獺祭",
    "十四代",
    "田酒"
  ]
}
```

* **異常系:**  
  * 400 Bad Request: assetKey が無効。  
  * 404 Not Found: assetKey のファイルがS3に存在しない。  
  * 500 Internal Server Error: OCR処理の失敗（「読み取りに失敗しました」）。  
  * (仕様) 抽出結果が0件の場合も 200 OK で {"brands": \[\]} を返します（「検出できませんでした」のメッセージはクライアント側で表示）。

---

### **4.4. 推薦 (Agent)**

**リソースパス:** /agent

インフラ構成図のBedrock Agent (Agent Core Runtime) へのプロキシパス。機能1（日本酒の推薦）を実行します。

#### **4.4.1. 日本酒の推薦 (機能1)**

**POST /agent/recommend**

メニュー（銘柄リスト）とユーザーの飲酒歴（認証トークンからサーバーサイドで取得）に基づき、おすすめの日本酒リストを生成します。

* **リクエストボディ (application/json):**  
  * Menu データ形式（銘柄のリスト）を送信します。

```json
{
  "menu": [
    "獺祭 純米大吟醸",
    "十四代 本丸",
    "黒龍 しずく",
    "八海山 普通酒"
  ]
}
```

* **レスポンス (200 OK):**  
  * RecommendationResult オブジェクトの配列（上位10件）を返します。

```json
{
  "recommendations": [
    {
      "brand": "獺祭 純米大吟醸",
      "score": 5,
      "reason": "あなたの「フルーティで香りが高い」という好みに最も一致します。"
    },
    {
      "brand": "黒龍 しずく",
      "score": 4,
      "reason": "「飲みやすい」という感想に近く、クリアな味わいがおすすめです。"
    }
  ]
}
```

* **異常系:**  
  * 400 Bad Request: メニューリストが空の場合（「メニューを入力してください」）。  
  * (仕様) 推薦結果が0件の場合、200 OK で {"recommendations": \[\]} を返します（「おすすめできる日本酒が見つかりませんでした」）。  
  * 500 Internal Server Error: Bedrock Agentの実行時エラー（「推薦処理に失敗しました」）。












API
入力
{
  "menu": [
    "獺祭 純米大吟醸",
    "十四代 本丸",
    "黒龍 しずく",
    "八海山 普通酒"
  ]
}
出力
ユーザーは獺祭 純米大吟醸を非常に好んでおり、フルーティで香りが豊か、そして甘みと酸味のバランスが良いと評価しています。この酒はユーザーの好みに最も合致する特性を持ち、過去の体験から推薦するのに最適です。

ユーザーにとってその選択肢がどういう立ち位置なのか
そもそもそのお酒はどういうものか


{
  "recommendations": [
    {
          "brand": "獺祭 純米大吟醸",
          "match_score": 95,
          "category": "鉄板マッチ",
          "description": "外れなしの安全圏。現在の味覚パーソナリティに完全に合致する銘柄です。",
          "reason": "あなたの『穏やかな吟醸香へのこだわり』と『キレの良さの重視』というマップ傾向に最も忠実な選択です。"
    },
    {
      "category": "次の一手",
      "description": "現在の好みを保ちつつ、新しい発見ができる銘柄。感性マップを広げるための賢い一歩です。",
      "brand": "黒龍 しずく",
          "reason": "『口当たりの優しさ重視度』を維持しながら、『酸味の許容度』を拡張することで、新しい満足感が得られます。",
          "match_score": 70 // 鉄板よりやや低いが、探求価値が高い
    },
    {
      "category": "運命の出会い",
      "description": "あなたの現在のマップから最も離れていますが、飲酒記録にある『知的好奇心の高さ』から、意外な感動をもたらす可能性を秘めています。",
      "brand": "八海山 普通酒",
          "reason": "あなたのメインの感性とは対極にある『軽快さ』が、シチュエーションによって新しい扉を開くかもしれません。",
          "match_score": 50
    }
  ]
}
Agent 入出力
入力
これ待っで通り
出力

{
  "best_recommend": {
      "brand": "獺祭 純米大吟醸",
      "brand_description": "外れなしの安全圏。現在の味覚パーソナリティに完全に合致する銘柄です。",
      "expected_experience": "あなたの『穏やかな吟醸香へのこだわり』と『キレの良さの重視』というマップ傾向に最も忠実な選択です。",
          "match_score": 95 // 感性マップ上のマッチ度（高いほど鉄板）    },
  "recommendations": [
    {
      "brand": "黒龍 しずく",
      "brand_description": "現在の好みを保ちつつ、新しい発見ができる銘柄。感性マップを広げるための賢い一歩です。",
      "expected_experience": "『口当たりの優しさ重視度』を維持しながら、『酸味の許容度』を拡張することで、新しい満足感が得られます。",
      "category": "次の一手",
      "match_score": 70 // 鉄板よりやや低いが、探求価値が高い
    },
    {
      "brand": "八海山 普通酒",
      "brand_description": "あなたの現在のマップから最も離れていますが、飲酒記録にある『知的好奇心の高さ』から、意外な感動をもたらす可能性を秘めています。",
      "expected_experience": "あなたのメインの感性とは対極にある『軽快さ』が、シチュエーションによって新しい扉を開くかもしれません。",
      "category": "運命の出会い",
      "match_score": 50
    }
  ]
}



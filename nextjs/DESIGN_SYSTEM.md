# デザインシステム

このドキュメントでは、アプリケーション全体で使用するデザインシステムを定義しています。

**関連ドキュメント:**
- [カラーシステム](./COLOR_SYSTEM.md) - テーマカラー、アクセントカラー、ステータスカラーの定義

## タイポグラフィ

### Display（ディスプレイ）- 最も大きい見出し

ヒーローセクションやトップページで使用する、最も目立つテキストサイズです。

#### text-display-xl
- **サイズ**: 80px (5rem)
- **行間**: 1.1
- **太さ**: 300 (Light)
- **字間**: 0.2em
- **用途**: Home画面の「HOME」など、最も大きく目立たせたいテキスト

```tsx
<h1 className="text-display-xl text-white">HOME</h1>
```

#### text-display-lg
- **サイズ**: 56px (3.5rem)
- **行間**: 1.1
- **太さ**: 300 (Light)
- **字間**: 0.15em
- **用途**: セカンダリヒーロー、大きな見出し

```tsx
<h1 className="text-display-lg">大きな見出し</h1>
```

### Title（タイトル）- ページタイトル

各ページの主要な見出しに使用します。

#### text-title
- **サイズ**: 30px (1.875rem)
- **行間**: 1.3
- **太さ**: 500 (Medium)
- **用途**: ページのメインタイトル（「今夜のおすすめ日本酒」「飲酒記録」など）

```tsx
<h2 className="text-title text-[#2B2D5F]">今夜のおすすめ日本酒</h2>
```

### Subtitle（サブタイトル）- セクションタイトル

セクション見出しやカード内のタイトルに使用します。

#### text-subtitle
- **サイズ**: 24px (1.5rem)
- **行間**: 1.4
- **太さ**: 500 (Medium)
- **用途**: 日本酒の銘柄名、カード見出しなど

```tsx
<h3 className="text-subtitle text-gray-800">獺祭</h3>
```

### Body（本文）- テキスト

通常のテキストコンテンツに使用します。

#### text-body
- **サイズ**: 16px (1rem)
- **行間**: 1.6
- **太さ**: 400 (Regular)
- **用途**: 本文、説明文、ラベルなど

```tsx
<p className="text-body text-gray-700">これは本文です。</p>
```

#### text-body-lg
- **サイズ**: 18px (1.125rem)
- **行間**: 1.6
- **太さ**: 400 (Regular)
- **用途**: 強調したい本文、フォームラベル、ボタンテキストなど

```tsx
<label className="text-body-lg font-medium">銘柄</label>
<button className="text-body-lg">保存する</button>
```

## 使用例

### Home画面
```tsx
<h1 className="text-display-xl text-white">HOME</h1>
<LinkButton href="/recommendations" className="text-subtitle">
  おすすめを見る
</LinkButton>
```

### おすすめページ
```tsx
<h2 className="text-title text-[#2B2D5F]">今夜のおすすめ日本酒</h2>
<p className="text-body text-blue-800">💡 気に入った日本酒を見つけたら...</p>
<h3 className="text-subtitle text-gray-800">獺祭</h3>
<p className="text-body text-gray-700">特徴：フルーティで...</p>
```

### 記録ページ
```tsx
<h2 className="text-title text-[#2B2D5F]">飲酒記録を追加</h2>
<label className="text-body-lg font-medium text-gray-700">銘柄</label>
<input className="text-body-lg text-gray-800" />
<p className="text-body text-gray-500">0/64文字</p>
<button className="text-body-lg font-medium">✨ 記録を保存する</button>
```

## カラーパレット

### プライマリカラー
- **メイン**: `#2B2D5F` - ヘッダー、ボタン、アクセント
- **ホバー**: `#3B3D7F` - ホバー時の色

### セカンダリカラー
- **グレー50**: `gray-50` - 背景
- **グレー600**: `gray-600` - テキスト
- **グレー700**: `gray-700` - 本文
- **グレー800**: `gray-800` - 見出し

## レスポンシブデザイン

現在のデザインシステムはモバイルファーストで設計されています。
必要に応じて、レスポンシブブレイクポイントを追加してください。

```css
/* 例：タブレット以上でtext-display-xlをさらに大きく */
@media (min-width: 768px) {
  .text-display-xl {
    font-size: 6rem; /* 96px */
  }
}
```


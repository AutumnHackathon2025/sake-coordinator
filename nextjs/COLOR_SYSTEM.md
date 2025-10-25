# カラーシステム

## プライマリカラー（ブランドカラー）

アプリのメインカラー。ヘッダー、ボタン、リンクなど主要な要素に使用します。

| 変数名 | 色 | 用途 |
|--------|-----|------|
| `--primary` | #2B2D5F | メインカラー |
| `--primary-hover` | #3B3D7F | ホバー時 |
| `--primary-light` | #4B4D8F | グラデーションの明るい側 |
| `--primary-dark` | #1B1D4F | グラデーションの暗い側 |

### 使用例
```css
/* CSS変数として */
.button {
  background-color: var(--primary);
}
.button:hover {
  background-color: var(--primary-hover);
}

/* ユーティリティクラスとして */
<div className="bg-primary text-white">...</div>
<div className="text-primary-color">...</div>
```

## セカンダリカラー

補助的な色。プライマリほど目立たせたくない要素に使用。

| 変数名 | 色 | 用途 |
|--------|-----|------|
| `--secondary` | #6B6D9F | セカンダリ色 |
| `--secondary-hover` | #5B5D8F | ホバー時 |

## 背景色

| 変数名 | 色 | 用途 |
|--------|-----|------|
| `--bg-primary` | #ffffff | 白背景 |
| `--bg-secondary` | #F9FAFB | グレー背景（メインページ） |
| `--bg-tertiary` | #F3F4F6 | 濃いグレー背景 |

## テキストカラー

テキストの階層を表現するための色。

| 変数名 | 色 | 用途 |
|--------|-----|------|
| `--text-primary` | #1F2937 | 最も濃い文字（見出しなど） |
| `--text-secondary` | #374151 | 本文 |
| `--text-tertiary` | #4B5563 | 補足テキスト |
| `--text-quaternary` | #6B7280 | さらに薄い補足テキスト |
| `--text-disabled` | #9CA3AF | 無効状態のテキスト |

### 使用例
```tsx
<h1 className="text-primary">見出し</h1>
<p className="text-secondary">本文テキスト</p>
<span className="text-tertiary">補足情報</span>
```

## ボーダー・区切り線

| 変数名 | 色 | 用途 |
|--------|-----|------|
| `--border-primary` | #D1D5DB | メインのボーダー |
| `--border-secondary` | #E5E7EB | 薄いボーダー |

## アクセントカラー（情報表示用）

ヒントメッセージや情報カードで使用する色。

### Blue（情報）
| 変数名 | 色 | 用途 |
|--------|-----|------|
| `--accent-blue` | #3B82F6 | ブルーアクセント |
| `--accent-blue-bg` | #EFF6FF | 背景色 |
| `--accent-blue-text` | #1E3A8A | テキスト色 |

**使用例**: 「気に入った日本酒を見つけたら、感想を記録しておきましょう」

```tsx
<div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-l-4 border-blue-500">
  <p style={{ color: 'var(--accent-blue-text)' }}>💡 ヒント</p>
</div>
```

### Indigo（情報・プライマリに近い）
| 変数名 | 色 | 用途 |
|--------|-----|------|
| `--accent-indigo` | #6366F1 | インディゴアクセント |
| `--accent-indigo-bg` | #EEF2FF | 背景色 |
| `--accent-indigo-text` | #312E81 | テキスト色 |

### Amber（注意・ヒント）
| 変数名 | 色 | 用途 |
|--------|-----|------|
| `--accent-amber` | #F59E0B | アンバーアクセント |
| `--accent-amber-bg` | #FFFBEB | 背景色 |
| `--accent-amber-text` | #78350F | テキスト色 |

**使用例**: 「記録が増えるほど、AIがあなたの好みを学習します」

```tsx
<div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4">
  <p style={{ color: 'var(--accent-amber-text)' }}>🎯 モチベーションメッセージ</p>
</div>
```

### Orange（警告）
| 変数名 | 色 | 用途 |
|--------|-----|------|
| `--accent-orange` | #F97316 | オレンジアクセント |
| `--accent-orange-bg` | #FFF7ED | 背景色 |
| `--accent-orange-text` | #7C2D12 | テキスト色 |

### Purple（特別な機能）
| 変数名 | 色 | 用途 |
|--------|-----|------|
| `--accent-purple` | #A855F7 | パープルアクセント |
| `--accent-purple-bg` | #FAF5FF | 背景色 |
| `--accent-purple-text` | #581C87 | テキスト色 |

## ステータスカラー

処理結果やシステムメッセージの表示に使用。

### Success（成功）
| 変数名 | 色 | 用途 |
|--------|-----|------|
| `--status-success` | #10B981 | 成功色 |
| `--status-success-bg` | #ECFDF5 | 背景色 |
| `--status-success-text` | #065F46 | テキスト色 |

**使用例**: 「保存しました！」

```tsx
<div style={{ 
  backgroundColor: 'var(--status-success-bg)', 
  color: 'var(--status-success-text)' 
}}>
  ✓ 保存に成功しました
</div>
```

### Error（エラー）
| 変数名 | 色 | 用途 |
|--------|-----|------|
| `--status-error` | #EF4444 | エラー色 |
| `--status-error-bg` | #FEF2F2 | 背景色 |
| `--status-error-text` | #7F1D1D | テキスト色 |

**使用例**: 「保存に失敗しました」

### Warning（警告）
| 変数名 | 色 | 用途 |
|--------|-----|------|
| `--status-warning` | #F59E0B | 警告色 |
| `--status-warning-bg` | #FFFBEB | 背景色 |
| `--status-warning-text` | #78350F | テキスト色 |

### Info（情報）
| 変数名 | 色 | 用途 |
|--------|-----|------|
| `--status-info` | #3B82F6 | 情報色 |
| `--status-info-bg` | #EFF6FF | 背景色 |
| `--status-info-text` | #1E3A8A | テキスト色 |

## 評価カラー（飲酒記録用）

飲酒記録の4段階評価で使用する色。

### 非常に好き
| 変数名 | 色 |
|--------|-----|
| `--rating-love` | #EF4444 |
| `--rating-love-bg` | #FEE2E2 |
| `--rating-love-text` | #7F1D1D |

### 好き
| 変数名 | 色 |
|--------|-----|
| `--rating-like` | #EC4899 |
| `--rating-like-bg` | #FCE7F3 |
| `--rating-like-text` | #831843 |

### 合わない
| 変数名 | 色 |
|--------|-----|
| `--rating-dislike` | #6B7280 |
| `--rating-dislike-bg` | #F3F4F6 |
| `--rating-dislike-text` | #374151 |

### 非常に合わない
| 変数名 | 色 |
|--------|-----|
| `--rating-hate` | #4B5563 |
| `--rating-hate-bg` | #E5E7EB |
| `--rating-hate-text` | #1F2937 |

**使用例**:
```tsx
const getRatingStyle = (rating: string) => {
  switch (rating) {
    case "非常に好き":
      return {
        backgroundColor: 'var(--rating-love-bg)',
        color: 'var(--rating-love-text)'
      };
    case "好き":
      return {
        backgroundColor: 'var(--rating-like-bg)',
        color: 'var(--rating-like-text)'
      };
    // ...
  }
};
```

## シャドウ

要素に立体感を与えるための影。

| 変数名 | 値 | 用途 |
|--------|-----|------|
| `--shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | 小さな影 |
| `--shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1)` | 中くらいの影 |
| `--shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1)` | 大きな影 |
| `--shadow-xl` | `0 20px 25px -5px rgb(0 0 0 / 0.1)` | とても大きな影 |
| `--shadow-2xl` | `0 25px 50px -12px rgb(0 0 0 / 0.25)` | 最も大きな影 |

**使用例**:
```css
.card {
  box-shadow: var(--shadow-lg);
}

.floating-button {
  box-shadow: var(--shadow-2xl);
}
```

## カラーの組み合わせ例

### プライマリボタン
```tsx
<button style={{
  backgroundColor: 'var(--primary)',
  color: 'white'
}}>
  ボタン
</button>
```

### 情報カード（青）
```tsx
<div style={{
  backgroundColor: 'var(--accent-blue-bg)',
  borderLeft: '4px solid var(--accent-blue)',
  color: 'var(--accent-blue-text)'
}}>
  情報メッセージ
</div>
```

### 警告カード（アンバー）
```tsx
<div style={{
  backgroundColor: 'var(--accent-amber-bg)',
  borderLeft: '4px solid var(--accent-amber)',
  color: 'var(--accent-amber-text)'
}}>
  注意メッセージ
</div>
```

## ダークモード対応

現在はライトモードのみですが、将来的にダークモードを追加する場合は、
`:root`セレクタと`@media (prefers-color-scheme: dark)`を使って
カラー変数を再定義します。

```css
@media (prefers-color-scheme: dark) {
  :root {
    --primary: #4B4D8F; /* ダークモードでは明るめに */
    --bg-primary: #1F2937;
    --text-primary: #F9FAFB;
    /* ... */
  }
}
```


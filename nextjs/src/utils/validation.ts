/**
 * バリデーションエラークラス
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * 推薦リクエストのバリデーション
 * @param body リクエストボディ
 * @returns バリデーション済みのメニューリスト
 * @throws ValidationError バリデーションエラー時
 */
export function validateRecommendRequest(body: unknown): string[] {
  // bodyがオブジェクトであることを確認
  if (!body || typeof body !== 'object') {
    throw new ValidationError('リクエストボディが不正です');
  }

  const data = body as Record<string, unknown>;

  // menuフィールドの存在チェック
  if (!('menu' in data)) {
    throw new ValidationError('menuフィールドが必要です');
  }

  // menuが配列であることを確認
  if (!Array.isArray(data.menu)) {
    throw new ValidationError('menuは配列である必要があります');
  }

  const menu = data.menu;

  // menuが空でないことを確認
  if (menu.length === 0) {
    throw new ValidationError('メニューを入力してください');
  }

  // 各要素が文字列であることを確認
  for (let i = 0; i < menu.length; i++) {
    if (typeof menu[i] !== 'string') {
      throw new ValidationError(`menu[${i}]は文字列である必要があります`);
    }
    
    const brand = menu[i] as string;
    
    // 銘柄の文字数チェック（1-64文字）
    if (brand.length < 1 || brand.length > 64) {
      throw new ValidationError(`銘柄は1文字以上64文字以内である必要があります: ${brand}`);
    }
  }

  return menu as string[];
}

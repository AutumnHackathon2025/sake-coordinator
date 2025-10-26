"""カテゴリーバリデーションの動作確認"""
from src.models.recommendation import Recommendation

# 正常なケース（1-10文字）
try:
    rec1 = Recommendation(
        brand='テスト',
        brand_description='テスト説明',
        expected_experience='テスト体験',
        category='新しい挑戦',
        match_score=85
    )
    print(f'✓ 正常なカテゴリー（5文字）: {rec1.category}')
except Exception as e:
    print(f'✗ エラー: {e}')

# 1文字のケース
try:
    rec2 = Recommendation(
        brand='テスト',
        brand_description='テスト説明',
        expected_experience='テスト体験',
        category='挑',
        match_score=85
    )
    print(f'✓ 1文字のカテゴリー: {rec2.category}')
except Exception as e:
    print(f'✗ エラー: {e}')

# 10文字のケース
try:
    rec3 = Recommendation(
        brand='テスト',
        brand_description='テスト説明',
        expected_experience='テスト体験',
        category='1234567890',
        match_score=85
    )
    print(f'✓ 10文字のカテゴリー: {rec3.category}')
except Exception as e:
    print(f'✗ エラー: {e}')

# 空文字列のケース（エラーになるべき）
try:
    rec4 = Recommendation(
        brand='テスト',
        brand_description='テスト説明',
        expected_experience='テスト体験',
        category='',
        match_score=85
    )
    print(f'✗ 空文字列が許可されてしまった')
except ValueError as e:
    print(f'✓ 空文字列でエラー: {e}')

# 11文字のケース（エラーになるべき）
try:
    rec5 = Recommendation(
        brand='テスト',
        brand_description='テスト説明',
        expected_experience='テスト体験',
        category='12345678901',
        match_score=85
    )
    print(f'✗ 11文字が許可されてしまった')
except ValueError as e:
    print(f'✓ 11文字でエラー: {e}')

# 空白のみのケース（エラーになるべき）
try:
    rec6 = Recommendation(
        brand='テスト',
        brand_description='テスト説明',
        expected_experience='テスト体験',
        category='   ',
        match_score=85
    )
    print(f'✗ 空白のみが許可されてしまった')
except ValueError as e:
    print(f'✓ 空白のみでエラー: {e}')

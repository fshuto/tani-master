# 開発ワークフロー

このドキュメントは、たんいマスターの新規機能開発における標準フローを定義します。
**すべての機能開発はこのフローに従って進めること。**

---

## 全体の流れ

```
① 機能の議論・詳細設計
        ↓
② 仕様をドキュメント化
        ↓
③ テストを書く（RED: 失敗を確認）
        ↓
④ 実装する（GREEN: テストを通す）
        ↓
⑤ プルリクエストを作成
        ↓
⑥ レビュー・マージ
        ↓
⑦ main ブランチに戻り、環境を最新化
```

---

## ① 機能の議論・詳細設計

新規機能の開発を始める前に、以下の点が明確になるまで議論する。

- **目的**: なぜこの機能が必要か
- **対象ユーザー**: 子ども向けか、保護者向けか
- **画面・UI**: どんな見た目か（手書きスケッチでもOK）
- **データ**: JSONの変更が必要か、DBのスキーマ変更が必要か
- **API**: 新しいエンドポイントが必要か
- **問題タイプ**: 新しいrendererが必要か
- **実績・スタンプ**: 新しいconditionが必要か
- **スコープ**: このPRに含めること・含めないこと

> **ルール**: 詳細が合意できるまで実装を始めない。

---

## ② 仕様をドキュメント化

議論が完了したら、仕様をファイルに記録する。

### ドキュメントの置き場所

```
docs/specs/
└── <feature-name>.md    # 機能仕様書（例: daily-challenge.md）
```

### 仕様書のフォーマット

```markdown
# 機能名

## 概要
（1〜3文で何をするか）

## 対象ユーザー
（子ども / 保護者 / 両方）

## 要件
- [ ] 要件1
- [ ] 要件2

## 画面・UI設計
（テキストでの説明 or Markdown の表）

## データ設計
### JSONの変更
（変更が必要な場合のみ）

### DBの変更
（変更が必要な場合のみ）

## APIエンドポイント
（変更・追加が必要な場合のみ）

## スコープ外（このPRに含めないこと）
- 〇〇は将来のIssueで対応
```

---

## ③ テストを書く（RED）

仕様書に基づいてテストを先に書く。

### ブランチを切る

```bash
# 機能開発
git checkout -b feature/<feature-name>

# 問題データ追加のみ
git checkout -b content/<category>-<description>

# バグ修正
git checkout -b fix/<description>
```

### テストファイルの置き場所

```
tests/
├── test_<feature>.py      # 新機能のテスト
└── ...
```

### テストの書き方

- **1テスト1アサーション**を原則とする
- テスト名は `test_<何をテストするか>` で日本語コメントを添える
- Pythonテスト: `pytest` + `tmp_path` でDB分離
- フロントエンドのロジックテスト: 必要に応じてPythonで検証

### テストが失敗することを確認する

```bash
python3 -m pytest tests/test_<feature>.py -v
# → FAILED が出ることを確認（実装前なので当然）
```

> **ルール**: テストが意図通りに失敗していることを必ず確認してから実装に進む。

---

## ④ 実装する（GREEN）

テストが通るように実装する。

### 実装の順番

1. **バックエンド（Python）**: モデル → ルート → APIエンドポイント
2. **フロントエンド（HTML/CSS/JS）**: テンプレート → スタイル → JS

### 実装中のルール

- CLAUDE.md のコーディング規約を遵守する
- RPi 3 のスペックを意識する（重い処理・アニメーション禁止）
- 外部CDN・外部API依存禁止（完全オフライン動作）
- 子ども向け画面は**ひらがな**表記（漢字禁止）
- 過剰な実装をしない（スコープ外の機能を追加しない）

### 全テストが通ることを確認する

```bash
# 新機能のテスト
python3 -m pytest tests/test_<feature>.py -v

# 全テスト（リグレッションがないことを確認）
python3 -m pytest tests/ -v
```

> **ルール**: 新機能のテストだけでなく、既存テストがすべて通ることを確認する。

---

## ⑤ プルリクエストを作成

テストが全通りした後にPRを作成する。

```bash
git add <変更ファイル>
git commit -m "機能の説明（日本語）"
git push origin <branch-name>

gh pr create \
  --title "機能名" \
  --body "$(cat <<'EOF'
## 概要
（何をしたか1〜3文）

## 変更内容
- 変更点1
- 変更点2

## テスト
- [ ] `python3 -m pytest tests/ -v` → 全テスト通過
- [ ] 開発サーバーで動作確認（`python3 run.py`）

## 関連ドキュメント
- docs/specs/<feature-name>.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## ⑥ レビュー・マージ

PRを作成したら**レビューを待つ**。

- レビュー中は別ブランチで別タスクを進めてもよい
- レビュー指摘があれば修正してコミットを追加する
- 承認されたらマージする

---

## ⑦ main ブランチに戻り、環境を最新化

マージ後は必ずこの手順を実行する。

```bash
git checkout main
git pull origin main

# 依存パッケージが変わった場合
pip install -r requirements.txt --break-system-packages

# DBスキーマが変わった場合
python3 -c "from app import create_app; app = create_app('development'); \
  from app.models import init_db; \
  with app.app_context(): init_db()"

# 全テストで環境が正常なことを確認
python3 -m pytest tests/ -v
```

---

## ディレクトリ構成（追記分）

```
tani-master/
├── DEVELOPMENT.md       # ← このファイル（開発フロー）
├── docs/
│   └── specs/           # ← 機能仕様書の置き場所
│       └── <feature>.md
└── ...
```

---

## チェックリスト（各機能開発の完了条件）

- [ ] 議論が完了し、仕様が合意されている
- [ ] `docs/specs/<feature>.md` に仕様が記録されている
- [ ] テストを先に書き、失敗することを確認した
- [ ] 実装後、新機能のテストが全通りする
- [ ] 実装後、既存テスト（`pytest tests/ -v`）が全通りする
- [ ] 開発サーバーで動作を目視確認した
- [ ] PRを作成し、レビューを受けた
- [ ] マージ後、main ブランチで `git pull` + テスト確認を完了した

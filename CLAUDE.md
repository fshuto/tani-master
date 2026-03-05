# CLAUDE.md — たんいマスター（単位学習Webアプリ）

## プロジェクト概要

日本の年長〜小学2年生（5〜8歳）が、長さ・かさ（体積）・重さ・時間などの「単位」を楽しく学べるWebアプリケーション。
家庭内のRaspberry Pi 3上で動作するローカルWebサーバーとして提供する。

### ターゲットユーザー

- **メインユーザー**: 年長（5-6歳）〜小学2年生（7-8歳）の子ども
- **管理ユーザー**: 保護者（設定変更・学習進捗の確認）

### 学習コンテンツの範囲

| カテゴリ | 具体的な単位 | 対象学年の目安 |
|---------|------------|-------------|
| 長さ | mm, cm, m | 小1〜小2 |
| かさ（体積） | mL, dL, L | 小2 |
| 重さ | g, kg | 小2（発展） |
| 時間 | 秒, 分, 時間 / 時計の読み方 | 年長〜小2 |
| お金 | 円（硬貨・紙幣の組み合わせ） | 小1〜小2 |

---

## 設計原則: 「よくある更新はデータだけ、新しい体験だけコード」

コンテンツの追加・更新が頻繁に発生する前提で設計する。
コード変更の要否を以下の基準で分離する。

### コード変更なし（JSON編集のみ）で対応できること

- 既存カテゴリへの問題追加・修正
- 新しいレベルの追加（例: レベル4）
- カテゴリの新設（例:「面積」）
- カテゴリの表示順変更・有効/無効切り替え
- スタンプ・ごほうびの追加
- 体験コーナーの表示順変更・有効/無効切り替え

### 最小限のコード追加（JS 1ファイル程度）で対応できること

- 新しい問題タイプ（並べ替え型、ドラッグ型、自由入力型など）
- 新しい体験モジュール（ものさしシミュレーター等）
- 新しい実績解除条件

---

## 技術スタック

### 制約: Raspberry Pi 3 で快適に動作すること

- **CPU**: ARM Cortex-A53 1.2GHz（4コア）
- **RAM**: 1GB
- **想定OS**: Raspberry Pi OS (Lite or Desktop)
- **同時接続**: 家庭内1〜3台程度

### フロントエンド

- **HTML + CSS + Vanilla JavaScript**（フレームワークなし）
  - 理由: ビルドステップ不要、RPi上でのデプロイが単純
- **CSS**: カスタムCSS（TailwindやBootstrapは使わない。ビルド不要にするため）
- **JS**: ES Modules（`<script type="module">`）で読み込み
- アニメーションは CSS アニメーション + 軽量な JS で実装（ライブラリ不使用）

### バックエンド

- **Python 3 + Flask**（軽量Webフレームワーク）
  - 理由: RPi OS にPythonがプリインストール済み、軽量、セットアップ簡単
- **データベース**: SQLite3（学習記録・ユーザー管理）
  - 理由: ファイルベースでインストール不要、RPiのI/O負荷が小さい
- **コンテンツデータ**: JSONファイル（問題・カテゴリ・ごほうび定義）
  - 理由: DB不要で直接編集可能、git管理しやすい
- **Webサーバー**: Gunicorn（本番）/ Flask 開発サーバー（開発時）

---

## ディレクトリ構成

```
tani-master/
├── CLAUDE.md
├── ARCHITECTURE.md          # 詳細設計書（データ構造・画面遷移の全容）
├── README.md                # セットアップ手順・利用ガイド
├── LICENSE
├── requirements.txt         # Python依存パッケージ（Flask, Gunicorn）
├── setup_rpi.sh             # RPi向け初期セットアップスクリプト
│
├── app/
│   ├── __init__.py          # Flaskアプリファクトリ
│   ├── config.py            # 設定（開発 / RPi本番）
│   ├── models.py            # SQLite モデル定義
│   ├── question_loader.py   # JSONコンテンツ読み込み・キャッシュ
│   ├── achievement_checker.py # 実績解除ロジック
│   │
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── main.py          # ホーム・ユーザー選択
│   │   ├── quiz.py          # クイズAPI（出題・回答受付）
│   │   ├── explore.py       # たいけんコーナー
│   │   ├── progress.py      # 学習記録・スタンプ
│   │   └── admin.py         # 保護者向け設定・進捗確認
│   │
│   ├── data/                # ★ コンテンツ層（JSONのみ・コード変更なしで編集可能）
│   │   ├── categories.json  #   カテゴリ定義（名前・色・順序・有効/無効）
│   │   ├── questions/       #   カテゴリ別の問題データ
│   │   │   ├── length.json
│   │   │   ├── volume.json
│   │   │   ├── weight.json
│   │   │   ├── time.json
│   │   │   └── money.json
│   │   ├── explore/
│   │   │   └── modules.json #   体験コーナーのモジュール定義
│   │   └── rewards/
│   │       └── rewards.json #   スタンプ・ごほうび定義
│   │
│   ├── static/
│   │   ├── css/
│   │   │   ├── style.css           # 共通スタイル・CSS変数
│   │   │   ├── quiz.css            # クイズ画面
│   │   │   ├── explore.css         # 体験コーナー
│   │   │   └── animations.css      # フィードバックアニメーション
│   │   ├── js/
│   │   │   ├── main.js             # アプリ初期化
│   │   │   ├── quiz-engine.js      # ★ クイズ進行エンジン（type非依存）
│   │   │   ├── renderers/          # ★ 問題タイプ別レンダラー（拡張ポイント）
│   │   │   │   ├── choice.js       #     選択肢型
│   │   │   │   ├── fill_unit.js    #     空欄補充型
│   │   │   │   └── conversion.js   #     単位変換型
│   │   │   ├── explore/            # ★ 体験モジュール（各モジュール独立）
│   │   │   │   ├── clock.js        #     とけい
│   │   │   │   └── ruler.js        #     ものさし
│   │   │   ├── ui.js               # 共通UIヘルパー（フィードバック表示等）
│   │   │   └── sound.js            # 効果音管理
│   │   ├── fonts/                  # ローカル配置のWebフォント
│   │   │   └── rounded-mplus-1c/
│   │   ├── images/
│   │   │   ├── common/             # 共通アイコン（ホーム・戻るボタン等）
│   │   │   ├── length/             # カテゴリ別イラスト
│   │   │   ├── volume/
│   │   │   ├── weight/
│   │   │   ├── time/
│   │   │   ├── money/
│   │   │   ├── stamps/             # スタンプ画像
│   │   │   └── rewards/            # ごほうびイラスト
│   │   └── sounds/
│   │       ├── correct.ogg
│   │       ├── incorrect.ogg
│   │       └── levelup.ogg
│   │
│   └── templates/
│       ├── base.html               # 共通レイアウト（ヘッダー・ナビ・フッター）
│       ├── components/             # 再利用パーツ（Jinja2 include）
│       │   ├── _nav.html
│       │   ├── _category_card.html
│       │   ├── _level_badge.html
│       │   ├── _stamp_card.html
│       │   ├── _feedback.html
│       │   └── _user_switcher.html
│       ├── home.html               # ユーザー選択 + ホーム
│       ├── category_list.html      # カテゴリ一覧
│       ├── level_select.html       # レベル選択
│       ├── quiz.html               # クイズ画面（全type共通、JSで描き分け）
│       ├── result.html             # 結果・スタンプ獲得
│       ├── explore_list.html       # たいけんコーナー一覧
│       ├── explore_module.html     # 体験モジュール共通枠（JSを動的ロード）
│       ├── records.html            # 学習きろく
│       ├── rewards.html            # ごほうび
│       ├── daily.html              # きょうのチャレンジ
│       └── admin.html              # ほごしゃ画面
│
├── db/
│   └── tani_master.db              # SQLiteデータベース（.gitignore対象）
│
└── tests/
    ├── conftest.py
    ├── test_quiz.py
    ├── test_models.py
    ├── test_question_loader.py
    └── test_achievements.py
```

---

## サイトマップとURL設計

### 画面構成

```
🏠 ホーム（/）— ユーザー選択 → カテゴリ一覧
├── 📂 カテゴリ選択（/category）
│   └── 📊 レベル選択（/category/<id>/levels）
│       └── 📝 クイズ（/quiz/<cat_id>/<level>）
│           └── 🎉 結果（/quiz/<cat_id>/<level>/result）
├── 🕐 たいけんコーナー（/explore）
│   ├── とけい（/explore/clock）
│   ├── ものさし（/explore/ruler）
│   └── ...（modules.json で追加可能）
├── 📒 きろく（/records）— スタンプカード・がくしゅうりれき
├── ⭐ ごほうび（/rewards）— 集めたイラスト
├── 🏆 きょうのチャレンジ（/daily）— 日替わり1問
└── 🔧 ほごしゃ（/admin）— ユーザー管理・進捗・設定
```

### APIエンドポイント（JSON返却）

| パス | メソッド | 説明 |
|-----|--------|------|
| `/api/categories` | GET | カテゴリ一覧（categories.jsonから） |
| `/api/quiz/<cat_id>/<level>` | GET | 問題セット取得 |
| `/api/quiz/answer` | POST | 回答送信・正誤判定・記録保存 |
| `/api/records/<user_id>` | GET | 学習記録取得 |
| `/api/daily` | GET | 今日のチャレンジ問題 |

---

## コンテンツデータ構造

### categories.json — カテゴリ定義

カテゴリの追加は、このファイルに1エントリ追加 + `questions/` に対応するJSONファイルを作成するだけ。

```json
{
  "categories": [
    {
      "id": "length",
      "name": "ながさ",
      "icon": "ruler.svg",
      "color": "#4ECDC4",
      "description": "mm・cm・m をまなぼう",
      "order": 1,
      "levels": [1, 2, 3],
      "enabled": true
    }
  ]
}
```

- `enabled: false` で開発中カテゴリを非表示
- `order` でホーム画面の表示順を制御
- `levels` 配列の要素数でレベル数を動的に決定
- `color` でカテゴリ別テーマカラーをUI側に渡す

### questions/<category_id>.json — 問題データ

問題データはカテゴリごとに独立ファイル。1ファイル肥大化を防ぎ、カテゴリ単位で編集しやすくする。

```json
{
  "category_id": "length",
  "levels": {
    "1": {
      "title": "どっちがながい？",
      "instruction": "ながいほうを えらんでね",
      "passing_score": 3,
      "questions": [
        {
          "id": "len_1_001",
          "type": "choice",
          "question": "ながいのは どっち？",
          "image": "length/compare_pencil_eraser.svg",
          "options": [
            { "text": "えんぴつ", "image": null },
            { "text": "けしごむ", "image": null }
          ],
          "answer_index": 0,
          "explanation": "えんぴつのほうが ながいね！",
          "hint": "てに もって くらべてみよう"
        }
      ]
    }
  }
}
```

### 問題タイプ（type）一覧

`type` フィールドで表示方法を切り替える。新typeの追加は `renderers/` にJS 1ファイル追加で対応。

| type | 表示方法 | 実装状況 |
|------|---------|---------|
| `choice` | 選択肢ボタン | Phase 1で実装 |
| `fill_unit` | 空欄に単位を選ぶ | Phase 1で実装 |
| `conversion` | 単位変換の選択 | Phase 1で実装 |
| `ordering` | 小さい順に並べ替え | 将来追加 |
| `drag_match` | 単位と物を線で結ぶ | 将来追加 |
| `clock_read` | 時計の針を読む | 将来追加 |
| `free_input` | 数値を直接入力 | 将来追加 |

### rewards.json — スタンプ・ごほうび定義

```json
{
  "stamps": [
    {
      "id": "length_l1_clear",
      "name": "ながさマスター ★",
      "condition": { "type": "level_clear", "category": "length", "level": 1 },
      "image": "stamps/length_star1.svg"
    }
  ],
  "secret_rewards": [
    {
      "id": "secret_dino",
      "name": "きょうりゅう",
      "condition": { "type": "total_correct", "count": 100 },
      "image": "rewards/dino.svg",
      "message": "100もん せいかい！ きょうりゅうが でてきた！"
    }
  ]
}
```

condition.type: `level_clear` / `daily_streak` / `all_categories_clear` / `total_correct`
新しい解除条件は `achievement_checker.py` に判定関数を1つ追加するだけ。

---

## アーキテクチャ上の重要パターン

### quiz-engine.js + renderer パターン

クイズの進行ロジック（出題→回答→正誤判定→次へ）と、問題の表示ロジックを分離する。

```javascript
// quiz-engine.js — type に応じて renderer を動的に選択
const RENDERERS = {};

export function registerRenderer(type, renderer) {
  RENDERERS[type] = renderer;
}

export function renderQuestion(question, containerEl) {
  const renderer = RENDERERS[question.type] || RENDERERS['choice'];
  renderer.render(question, containerEl);
}
```

```javascript
// renderers/choice.js — 自己登録パターン
import { registerRenderer } from '../quiz-engine.js';

const choiceRenderer = {
  render(question, container) { /* 選択肢ボタンを描画 */ },
  getAnswer(container) { /* 選択された回答を返す */ }
};

registerRenderer('choice', choiceRenderer);
```

新しい問題タイプの追加手順:
1. `renderers/new_type.js` を作成し、`registerRenderer` で登録
2. `quiz.html` に `<script>` の import を追加
3. `questions/*.json` で `"type": "new_type"` を使った問題を作成

quiz-engine.js 本体の変更は不要。

### question_loader.py — JSONキャッシュ

```python
# 開発時: 毎回ファイル読み込み（変更即反映）
# 本番時: 起動時にメモリキャッシュ（RPi I/O負荷軽減）
# 保護者画面から手動キャッシュクリア可能（reload_cache()）

def load_categories() -> list[dict]:
    return _load_json("categories.json")["categories"]

def load_questions(category_id: str, level: int) -> list[dict]:
    data = _load_json(f"questions/{category_id}.json")
    return data["levels"].get(str(level), {}).get("questions", [])
```

---

## データベース設計（SQLite）

学習記録とユーザー管理のみDBに保存。コンテンツデータはJSONで管理する。

```sql
-- ユーザー（家庭内なので簡易。パスワードなし、名前で切り替え）
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    avatar TEXT DEFAULT 'default',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 学習記録
CREATE TABLE records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category TEXT NOT NULL,        -- categories.json の id に対応
    level INTEGER NOT NULL,
    question_id TEXT NOT NULL,     -- questions/*.json 内の id に対応
    is_correct BOOLEAN NOT NULL,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- スタンプ・実績
CREATE TABLE achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    achievement_key TEXT NOT NULL, -- rewards.json の stamps[].id に対応
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## コーディング規約

### Python

- Python 3.9+（RPi OS標準のバージョンに合わせる）
- フォーマッタ: なし（手動で PEP 8 準拠）。Claude Codeでの自動整形は歓迎
- docstring: 日本語OK（開発者が日本語話者のため）
- 型ヒント: 関数の引数と戻り値には付ける
- テスト: pytest を使用

### JavaScript

- ES6+ Modules（`<script type="module">` で読み込み）
- セミコロンあり
- `const` 優先、`let` は必要時のみ、`var` 禁止
- JSDoc コメントで関数を説明
- renderer は自己登録パターンに従う

### HTML / CSS

- HTMLはセマンティックタグを活用（`<main>`, `<section>`, `<nav>` など）
- CSSカスタムプロパティ（変数）でテーマカラーを管理
- クラス命名: BEM（`.quiz-card__option--correct`）
- レスポンシブ対応: タブレット（768px〜）をメインターゲット、スマホも考慮

### JSON（コンテンツデータ）

- ファイルはUTF-8、インデント2スペース
- 問題IDの命名規則: `{カテゴリ略称}_{レベル}_{連番3桁}`（例: `len_1_001`）
- 新規カテゴリ追加時は既存ファイルのフォーマットを厳密に踏襲する
- `enabled` フラグで表示/非表示を制御（不要なエントリを削除しない）

### 共通

- コミットメッセージ: 日本語で簡潔に（例: `「長さ」クイズの問題データを追加`）
- ブランチ戦略: `main`（安定版）+ `feature/*`（機能開発）+ `fix/*`（バグ修正）+ `content/*`（問題データ追加）

---

## UI/UXデザイン指針

### 子ども向けUIの鉄則

1. **大きなボタン・タップターゲット**: 最小 48px × 48px、推奨 64px以上
2. **ひらがな表記**: 漢字は使わない。カタカナにはふりがな不要（年長で読める前提）
3. **文字サイズ**: 本文 24px 以上、ボタンラベル 20px 以上
4. **色使い**: 高コントラスト、カラフルだが目に優しいパステル系をベース
5. **フィードバック**: 正解→大きな丸（⭕）+ 効果音 + 褒め言葉 / 不正解→「もういちど！」で優しく促進
6. **ナビゲーション**: 階層は最大2段。常に「もどる」「ホーム」ボタンを表示

### テーマカラー（CSS変数）

```css
:root {
  --color-primary: #4ECDC4;      /* メインカラー（ミントグリーン） */
  --color-secondary: #FFE66D;    /* アクセント（やまぶき） */
  --color-correct: #7BC67E;      /* 正解 */
  --color-incorrect: #FF8A80;    /* 不正解（やさしい赤） */
  --color-bg: #FFF8F0;           /* 背景（あたたかいホワイト） */
  --color-text: #4A4A4A;         /* 文字色 */
  --font-family: 'Rounded Mplus 1c', 'Hiragino Maru Gothic Pro', sans-serif;
}
```

カテゴリ別テーマカラーは `categories.json` の `color` フィールドで定義し、JSからCSSカスタムプロパティとして注入する。

### アニメーション

- 正解時: 星やキラキラが飛ぶ（CSS + JS、Canvas不使用でRPi負荷を軽減）
- レベルアップ時: キャラクターが喜ぶ簡易アニメーション（CSSスプライト）
- ページ遷移: フェードイン程度（派手な遷移はRPiで重い）

---

## ゲーミフィケーション設計

### モチベーション維持の仕組み

1. **スタンプカード**: カテゴリ×レベルをクリアするとスタンプ獲得（rewards.jsonで定義）
2. **レベルシステム**: ★〜★★★で成長を可視化
3. **今日のチャレンジ**: 日替わり1問出題（毎日アクセスする動機づけ）
4. **ごほうびイラスト**: 累計正解数・連続チャレンジ達成でシークレット解放

### 難易度調整

- レベル1（年長）: 選択肢2つ、イラスト中心、単位の名前を覚える
- レベル2（小1）: 選択肢3つ、簡単な比較（どっちがながい？）
- レベル3（小2）: 選択肢4つ、単位変換（1m = ? cm）、文章題

---

## RPiデプロイ関連

### setup_rpi.sh が行うこと

1. Python仮想環境の作成
2. `pip install -r requirements.txt`
3. SQLiteデータベースの初期化
4. systemd サービスファイルの配置（自動起動設定）
5. mDNS（Avahi）設定 → `http://tani-master.local` でアクセス可能に

### パフォーマンス考慮

- 画像は SVG を優先（ファイルサイズ小、スケーラブル）
- 音声ファイルは 48kbps 以下の ogg 形式に圧縮
- 1ページあたりの総アセットサイズ: 500KB 以下を目標
- JavaScriptの外部ライブラリは原則ゼロ（依存なし）
- Gzip圧縮を有効化（Flask-Compress または Gunicornの設定で）
- キャッシュヘッダーを適切に設定（静的ファイルは長期キャッシュ）
- question_loader.py のキャッシュ機構で本番時のJSON読み込みI/Oを最小化

### ネットワーク

- インターネット接続不要（完全オフライン動作）
- CDN依存なし（Google Fonts も使わない。Webフォントはローカルに配置）
- LAN内アクセスのみ想定（セキュリティはシンプルでOK）

---

## 開発ワークフロー（Claude Code + GitHub）

### 初期セットアップ

```bash
gh repo create tani-master --private --clone
cd tani-master
# Claude Code に「CLAUDE.mdを読んで初期セットアップして」と依頼
```

### 開発の進め方

1. **GitHub Issue で機能を管理**
   - ラベル: `feature`, `bug`, `content`（問題データ追加）, `design`
   - 例: `#1 ホーム画面の実装`, `#2 「ながさ」レベル1のクイズ実装`

2. **Claude Code での典型的な作業指示**

   機能開発:
   ```
   Issue #3 を実装して。「かさ」カテゴリのレベル1クイズを作って。
   questions/volume.json にクイズデータを5問追加し、
   カテゴリ一覧画面からアクセスできるようにして。
   ```

   コンテンツ追加:
   ```
   「ながさ」レベル2の問題を5問追加して。
   小1向けに「ただしいたんいをえらぶ」形式（fill_unit type）で。
   ```

   新問題タイプ:
   ```
   「並べ替え」問題タイプを追加して。
   renderers/ordering.js を作成し、quiz-engine.js の registerRenderer で登録。
   length.json のレベル3に ordering type のサンプル問題を2問追加して。
   ```

3. **ブランチ運用**
   ```bash
   git checkout -b feature/volume-quiz    # 機能開発
   git checkout -b content/length-level2  # 問題データ追加
   git checkout -b fix/score-calculation  # バグ修正
   ```

4. **RPiへのデプロイ**
   ```bash
   # RPi上で
   cd ~/tani-master
   git pull origin main
   sudo systemctl restart tani-master
   # ※ JSONのみの変更なら開発モードでは再起動不要
   ```

### テスト方針

- **ユニットテスト**: クイズ出題ロジック、スコア計算、DB操作、question_loader、achievement_checker
- **JSONバリデーション**: 問題データのフォーマット整合性（IDの一意性、必須フィールド確認）
- **手動テスト**: 実機（タブレット）で子どもに触ってもらって反応を見る
- RPi上での動作確認は機能追加のたびに実施

---

## コンテンツ追加手順クイックリファレンス

### 既存カテゴリに問題を追加

1. `app/data/questions/<category_id>.json` を開く
2. 該当レベルの `questions` 配列に問題を追加（IDの連番に注意）
3. 必要なSVG画像を `app/static/images/<category_id>/` に追加
4. RPiで `git pull` → 完了（開発モードならサーバー再起動不要）

### 新しいカテゴリを追加

1. `app/data/categories.json` にエントリ追加（`enabled: true`, `order` を設定）
2. `app/data/questions/<new_id>.json` を新規作成（既存ファイルをコピーして編集）
3. アイコンSVGを `app/static/images/common/` に追加
4. RPiで `git pull` → 完了

### 新しい問題タイプを追加

1. `app/static/js/renderers/<type_name>.js` を作成（`registerRenderer` で登録）
2. `quiz.html` の `<script>` に新rendererのimportを追加
3. `questions/*.json` 内で `"type": "<type_name>"` の問題を作成
4. RPiで `git pull` → サーバー再起動

### 新しい体験モジュールを追加

1. `app/data/explore/modules.json` にエントリ追加
2. `app/static/js/explore/<module_id>.js` を作成
3. RPiで `git pull` → サーバー再起動

---

## 開発フェーズ（マイルストーン）

### Phase 1: 基盤構築（MVP）
- [ ] Flaskアプリの骨格（ルーティング、テンプレート、静的ファイル配信）
- [ ] question_loader.py（JSONコンテンツ読み込み）
- [ ] ホーム画面（categories.json を読んでカテゴリ一覧を動的生成）
- [ ] quiz-engine.js + choice / fill_unit / conversion レンダラー
- [ ] 「ながさ」カテゴリ 全レベルのクイズ各5問
- [ ] 正解・不正解のフィードバック（視覚 + 効果音プレースホルダー）
- [ ] 結果画面（スコア表示）

### Phase 2: コンテンツ拡充 + ユーザー管理
- [ ] 全カテゴリ × レベル1 の問題データ作成
- [ ] ユーザー選択画面（名前・アバターで切り替え）
- [ ] 学習記録のDB保存
- [ ] たいけんコーナー: とけい（アナログ時計のインタラクティブUI）

### Phase 3: ゲーミフィケーション
- [ ] スタンプカード機能（rewards.json + achievement_checker.py）
- [ ] レベルシステム・レベルアップ演出
- [ ] 今日のチャレンジ
- [ ] ごほうびページ
- [ ] 保護者向け進捗確認ページ

### Phase 4: 本番運用・改善
- [ ] RPiセットアップスクリプト完成（setup_rpi.sh）
- [ ] systemd自動起動 + mDNS（`http://tani-master.local`）
- [ ] レベル2・3の問題データ拡充
- [ ] パフォーマンスチューニング（キャッシュ・圧縮・アセット最適化）

---

## Claude Codeへの注意事項

- テキストはすべて**ひらがな**で書く（子ども向け画面）。保護者画面のみ漢字OK
- 外部CDN・外部APIへの依存は禁止（完全オフライン動作が必須）
- RPi 3 のスペックを常に意識する。重い処理やアニメーションは避ける
- 画像生成はできないので、SVGアイコン・図形をコードで記述する
- 効果音は著作権フリー素材を使用する前提。プレースホルダーとして無音ファイルを配置しておく
- JSON問題データの追加時は、既存ファイルの構造・命名規則を厳密に守ること
- 新しいrendererを作るときは、既存の `choice.js` をテンプレートとして使う
- コミットは小さく頻繁に。1機能1コミットを目安にする
- 詳細なデータ構造・画面遷移は `ARCHITECTURE.md` を参照すること
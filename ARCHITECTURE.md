# たんいマスター — Webサイト構成設計書

---

## 1. 設計の前提：コンテンツ更新パターン

まず「将来どんな追加・変更が起きるか」を洗い出し、それぞれにコードの変更が必要かどうかで分類する。

### コード変更なし（JSONファイル編集のみ）で対応できるべきもの

| 更新パターン | 例 |
|------------|---|
| 既存カテゴリへの問題追加 | 「ながさ」レベル1に5問追加 |
| 問題文・選択肢の修正 | 誤字修正、ヒント追加 |
| 新しいレベルの追加 | レベル4（発展）を追加 |
| カテゴリの表示順変更 | 「時間」を先頭に移動 |
| カテゴリの追加 | 「面積」カテゴリを新設 |
| キャラクター・ごほうびの追加 | 新しいスタンプ画像を追加 |

### 最小限のコード追加で対応できるべきもの

| 更新パターン | 例 |
|------------|---|
| 新しい問題タイプの追加 | ドラッグ並べ替え型、お絵かき型 |
| 新しいインタラクティブ教材 | アナログ時計、ものさしシミュレーター |
| 新しい画面・機能 | 対戦モード、プリント印刷 |

**設計原則: 「よくある更新はデータだけ、新しい体験だけコード」**

---

## 2. サイトマップ

```
🏠 ホーム（/）
│   ユーザー選択 → カテゴリ一覧
│
├── 📂 カテゴリ選択（/category）
│   │   ながさ / かさ / おもさ / じかん / おかね / ...
│   │
│   └── 📊 レベル選択（/category/<id>/levels）
│       │   ★ / ★★ / ★★★
│       │
│       └── 📝 クイズ（/quiz/<category_id>/<level>）
│           │   問題表示 → 回答 → フィードバック → 次へ
│           │
│           └── 🎉 結果（/quiz/<category_id>/<level>/result）
│                   スコア表示 / スタンプ獲得 / もういちど or つぎへ
│
├── 🕐 たいけんコーナー（/explore）
│   │   インタラクティブ教材の一覧
│   │
│   ├── とけい（/explore/clock）
│   ├── ものさし（/explore/ruler）
│   └── はかり（/explore/scale）
│       ...今後追加可能
│
├── 📒 きろく（/records）
│       スタンプカード / がくしゅうりれき
│
├── ⭐ ごほうび（/rewards）
│       集めたイラスト・キャラクター
│
├── 🏆 きょうのチャレンジ（/daily）
│       日替わり1問
│
└── 🔧 ほごしゃ（/admin）
        ユーザー管理 / 学習進捗 / 設定
```

### URL設計

| パス | 説明 | テンプレート |
|-----|------|------------|
| `/` | ユーザー選択 + ホーム | `home.html` |
| `/category` | カテゴリ一覧 | `category_list.html` |
| `/category/<id>/levels` | レベル選択 | `level_select.html` |
| `/quiz/<cat_id>/<level>` | クイズ画面 | `quiz.html`（共通1枚） |
| `/quiz/<cat_id>/<level>/result` | 結果画面 | `result.html`（共通1枚） |
| `/explore` | たいけんコーナー一覧 | `explore_list.html` |
| `/explore/<module_id>` | 各体験モジュール | 個別テンプレート |
| `/records` | 学習きろく | `records.html` |
| `/rewards` | ごほうび | `rewards.html` |
| `/daily` | 今日のチャレンジ | `daily.html` |
| `/admin` | 保護者画面 | `admin.html` |

### API（JSON返却）

| パス | メソッド | 説明 |
|-----|--------|------|
| `/api/categories` | GET | カテゴリ一覧 |
| `/api/quiz/<cat_id>/<level>` | GET | 問題セット取得 |
| `/api/quiz/answer` | POST | 回答送信・正誤判定 |
| `/api/records/<user_id>` | GET | 学習記録 |
| `/api/daily` | GET | 今日のチャレンジ問題 |

---

## 3. コンテンツデータ構造（拡張性の核）

### 3-1. カテゴリ定義（categories.json）

カテゴリの追加はこのファイルに1エントリ追加するだけで完了する設計。

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
    },
    {
      "id": "volume",
      "name": "かさ",
      "icon": "cup.svg",
      "color": "#45B7D1",
      "description": "mL・dL・L をまなぼう",
      "order": 2,
      "levels": [1, 2, 3],
      "enabled": true
    },
    {
      "id": "weight",
      "name": "おもさ",
      "icon": "scale.svg",
      "color": "#96CEB4",
      "description": "g・kg をまなぼう",
      "order": 3,
      "levels": [1, 2],
      "enabled": true
    },
    {
      "id": "time",
      "name": "じかん",
      "icon": "clock.svg",
      "color": "#FFEAA7",
      "description": "とけいのよみかた・びょう・ふん・じかん",
      "order": 4,
      "levels": [1, 2, 3],
      "enabled": true
    },
    {
      "id": "money",
      "name": "おかね",
      "icon": "coin.svg",
      "color": "#DDA0DD",
      "description": "えんのかぞえかた",
      "order": 5,
      "levels": [1, 2],
      "enabled": true
    },
    {
      "id": "area",
      "name": "ひろさ",
      "icon": "square.svg",
      "color": "#F0E68C",
      "description": "どっちがひろい？",
      "order": 6,
      "levels": [1],
      "enabled": false
    }
  ]
}
```

**ポイント:**
- `enabled: false` で開発中カテゴリを非表示にできる
- `order` でホーム画面の表示順を制御
- `levels` 配列の要素数でレベル数を動的に決定（レベル4追加もここだけ）
- `color` でカテゴリごとのテーマカラーをUI側に渡す

### 3-2. 問題データ（questions/<category_id>.json）

問題データはカテゴリごとに独立したJSONファイルに分離する。
1ファイル肥大化を避け、カテゴリ単位で編集しやすくするため。

```
app/data/
├── categories.json
├── questions/
│   ├── length.json
│   ├── volume.json
│   ├── weight.json
│   ├── time.json
│   ├── money.json
│   └── area.json          ← ファイル追加 = カテゴリ追加
├── explore/
│   └── modules.json        ← 体験コーナーの定義
└── rewards/
    └── rewards.json         ← ごほうびデータ
```

#### 問題ファイルの構造（例: length.json）

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
        },
        {
          "id": "len_1_002",
          "type": "choice",
          "question": "いちばん ながいのは どれ？",
          "image": null,
          "options": [
            { "text": "30cm ものさし", "image": "length/ruler_30.svg" },
            { "text": "15cm ものさし", "image": "length/ruler_15.svg" },
            { "text": "けしごむ",       "image": "length/eraser.svg"   }
          ],
          "answer_index": 0,
          "explanation": "30cm ものさしが いちばん ながい！",
          "hint": null
        }
      ]
    },
    "2": {
      "title": "たんいを おぼえよう",
      "instruction": "ただしいたんいを えらんでね",
      "passing_score": 4,
      "questions": [
        {
          "id": "len_2_001",
          "type": "choice",
          "question": "えんぴつの ながさは だいたい どれくらい？",
          "image": "length/pencil_measure.svg",
          "options": [
            { "text": "17 cm", "image": null },
            { "text": "17 m",  "image": null },
            { "text": "17 mm", "image": null }
          ],
          "answer_index": 0,
          "explanation": "えんぴつは だいたい 17cm だよ",
          "hint": "cm は せんちめーとる。ものさしの めもりだよ"
        },
        {
          "id": "len_2_002",
          "type": "fill_unit",
          "question": "つくえのよこはばは 60 ____",
          "image": "length/desk.svg",
          "options": [
            { "text": "mm", "image": null },
            { "text": "cm", "image": null },
            { "text": "m",  "image": null }
          ],
          "answer_index": 1,
          "explanation": "つくえは だいたい 60cm だよ",
          "hint": null
        }
      ]
    },
    "3": {
      "title": "たんいへんかん",
      "instruction": "おなじながさに なるものを えらんでね",
      "passing_score": 4,
      "questions": [
        {
          "id": "len_3_001",
          "type": "conversion",
          "question": "1m は なん cm？",
          "image": null,
          "options": [
            { "text": "10 cm",  "image": null },
            { "text": "100 cm", "image": null },
            { "text": "50 cm",  "image": null }
          ],
          "answer_index": 1,
          "explanation": "1m = 100cm だよ！",
          "hint": "ものさしが なんぼん ならぶかな？"
        }
      ]
    }
  }
}
```

### 3-3. 問題タイプの拡張

`type` フィールドで問題の表示方法を切り替える。
新しいtypeは JS側にレンダラーを追加するだけで対応可能。

| type | 表示方法 | 必要なコード |
|------|---------|------------|
| `choice` | 選択肢ボタン | 初期実装に含む |
| `fill_unit` | 空欄に単位を選ぶ | 初期実装に含む |
| `conversion` | 単位変換の選択 | 初期実装に含む |
| `ordering` | 小さい順に並べ替え | `renderers/ordering.js` を追加 |
| `drag_match` | 単位と物を線で結ぶ | `renderers/drag_match.js` を追加 |
| `clock_read` | 時計の針を読む | `renderers/clock_read.js` を追加 |
| `free_input` | 数値を直接入力 | `renderers/free_input.js` を追加 |

```
app/static/js/
├── main.js              # アプリ初期化・ルーティング
├── quiz-engine.js       # 出題・正誤判定・進行管理（type非依存）
├── renderers/           # 問題タイプ別の表示ロジック
│   ├── choice.js        # 選択肢型（デフォルト）
│   ├── fill_unit.js     # 空欄補充型
│   ├── conversion.js    # 変換型
│   ├── ordering.js      # 並べ替え型（将来追加）
│   ├── drag_match.js    # マッチング型（将来追加）
│   ├── clock_read.js    # 時計読み型（将来追加）
│   └── free_input.js    # 自由入力型（将来追加）
├── explore/             # 体験コーナー（各モジュール独立）
│   ├── clock.js
│   ├── ruler.js
│   └── scale.js
├── ui.js                # 共通UIヘルパー（フィードバック表示等）
└── sound.js             # 効果音管理
```

**quiz-engine.js の設計思想:**

```javascript
// quiz-engine.js はデータ駆動。typeに応じてrendererを動的に選ぶ。
// 新しいtypeが来ても engine 本体は変更不要。

const RENDERERS = {};

export function registerRenderer(type, renderer) {
  RENDERERS[type] = renderer;
}

export function renderQuestion(question, containerEl) {
  const renderer = RENDERERS[question.type] || RENDERERS['choice'];
  renderer.render(question, containerEl);
}

// 各 renderer が自分自身を登録する（自己登録パターン）
// renderers/choice.js:
//   import { registerRenderer } from '../quiz-engine.js';
//   registerRenderer('choice', { render(q, el) { ... } });
```

---

## 4. 体験コーナーの拡張設計

体験モジュールもデータ定義で管理し、新モジュールは「JS1ファイル + JSON定義1行」で追加。

### explore/modules.json

```json
{
  "modules": [
    {
      "id": "clock",
      "name": "とけい",
      "icon": "clock_interactive.svg",
      "description": "はりを うごかして じかんを よもう",
      "script": "explore/clock.js",
      "enabled": true
    },
    {
      "id": "ruler",
      "name": "ものさし",
      "icon": "ruler_interactive.svg",
      "description": "ものの ながさを はかってみよう",
      "script": "explore/ruler.js",
      "enabled": true
    },
    {
      "id": "scale",
      "name": "はかり",
      "icon": "scale_interactive.svg",
      "description": "おもさを くらべてみよう",
      "script": "explore/scale.js",
      "enabled": false
    }
  ]
}
```

---

## 5. ごほうび・ゲーミフィケーション拡張

### rewards/rewards.json

```json
{
  "stamps": [
    {
      "id": "length_l1_clear",
      "name": "ながさマスター ★",
      "condition": { "type": "level_clear", "category": "length", "level": 1 },
      "image": "stamps/length_star1.svg"
    },
    {
      "id": "daily_3days",
      "name": "3にちれんぞく",
      "condition": { "type": "daily_streak", "days": 3 },
      "image": "stamps/streak_3.svg"
    },
    {
      "id": "all_level1_clear",
      "name": "ぜんぶ ★ クリア！",
      "condition": { "type": "all_categories_clear", "level": 1 },
      "image": "stamps/all_star1.svg"
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

**condition.type の設計:**
- `level_clear` — 特定カテゴリ×レベルをクリア
- `daily_streak` — N日連続チャレンジ
- `all_categories_clear` — 全カテゴリの特定レベルをクリア
- `total_correct` — 累計正解数

新しい解除条件を追加するときは、Python側の `achievement_checker.py` に判定ロジックを1関数追加するだけ。

---

## 6. テンプレート構成（HTMLファイル）

テンプレートは極力共通化し、データに応じて動的に内容が変わる設計にする。

```
app/templates/
├── base.html                 # 共通レイアウト（ヘッダー・ナビ・フッター）
├── components/               # 再利用パーツ（Jinja2 macro / include）
│   ├── _nav.html             # ナビゲーションバー
│   ├── _category_card.html   # カテゴリカード（ホーム画面用）
│   ├── _level_badge.html     # レベルバッジ（★表示）
│   ├── _stamp_card.html      # スタンプ1枚分
│   ├── _feedback.html        # 正解・不正解フィードバック
│   └── _user_switcher.html   # ユーザー切り替えUI
├── home.html                 # ホーム画面
├── category_list.html        # カテゴリ一覧（categoriesを動的描画）
├── level_select.html         # レベル選択（levelsを動的描画）
├── quiz.html                 # クイズ画面（全type共通、JSで描き分け）
├── result.html               # 結果画面
├── explore_list.html         # たいけんコーナー一覧
├── explore_module.html       # 体験モジュール共通枠（JSを動的ロード）
├── records.html              # 学習きろく
├── rewards.html              # ごほうび
├── daily.html                # きょうのチャレンジ
└── admin.html                # ほごしゃ画面
```

**テンプレートの数を最小限に抑える工夫:**
- `quiz.html` は1枚だけ。問題タイプ別のUI差異はJS（renderer）で解決
- `explore_module.html` も1枚だけ。`modules.json` の `script` を動的に読み込む
- `category_list.html` はループで `categories.json` を回す。カテゴリ追加でもHTMLは編集不要

---

## 7. 画面遷移フロー

```
┌─────────────┐
│   ホーム     │  ユーザー選んでスタート
│  home.html  │
└──────┬──────┘
       │
       ▼
┌──────────────┐     ┌────────────────┐
│ カテゴリえらぶ │────▶│ たいけんコーナー │
│ category_list │     │  explore_list   │
└──────┬───────┘     └───────┬────────┘
       │                     │
       ▼                     ▼
┌──────────────┐     ┌────────────────┐
│ レベルえらぶ   │     │ とけい/ものさし  │
│ level_select  │     │ explore_module  │
└──────┬───────┘     └────────────────┘
       │
       ▼
┌──────────────┐
│   クイズ      │  問題 → 回答 → フィードバック → 次 (ループ)
│  quiz.html   │
└──────┬───────┘
       │ 全問終了
       ▼
┌──────────────┐
│   けっか      │  スコア表示 / スタンプゲット!
│ result.html  │
└──────┬───────┘
       │
       ├──▶ もういちど → quiz.html
       ├──▶ つぎのレベル → level_select
       └──▶ ホームにもどる → home.html
```

---

## 8. コンテンツ追加手順のまとめ

### 「ながさ」に問題を5問追加したい

1. `app/data/questions/length.json` を開く
2. 該当レベルの `questions` 配列に5問追加
3. 必要なSVG画像を `app/static/images/length/` に追加
4. RPiで `git pull` → 完了（サーバー再起動すら不要、JSONは毎回読み込み）

### 「めんせき」カテゴリを新設したい

1. `app/data/categories.json` にエントリ追加
2. `app/data/questions/area.json` を新規作成
3. アイコンSVGを `app/static/images/` に追加
4. RPiで `git pull` → 完了

### 「並べ替え」問題タイプを追加したい

1. `app/static/js/renderers/ordering.js` を作成
2. `quiz.html` の `<script>` に `ordering.js` のimportを追加
3. `questions/*.json` 内で `"type": "ordering"` の問題を作成
4. RPiで `git pull` → サーバー再起動 → 完了

### 「ものさしシミュレーター」体験を追加したい

1. `app/data/explore/modules.json` にエントリ追加
2. `app/static/js/explore/ruler.js` を作成
3. RPiで `git pull` → サーバー再起動 → 完了

---

## 9. 最終ディレクトリ構成

```
tani-master/
├── CLAUDE.md
├── README.md
├── LICENSE
├── requirements.txt
├── setup_rpi.sh
├── app/
│   ├── __init__.py
│   ├── config.py
│   ├── models.py
│   ├── achievement_checker.py       # 実績解除ロジック
│   ├── question_loader.py           # JSON読み込み・キャッシュ
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── quiz.py
│   │   ├── explore.py
│   │   ├── progress.py
│   │   └── admin.py
│   ├── data/                         # ★ コンテンツ層（JSONのみ）
│   │   ├── categories.json
│   │   ├── questions/
│   │   │   ├── length.json
│   │   │   ├── volume.json
│   │   │   ├── weight.json
│   │   │   ├── time.json
│   │   │   └── money.json
│   │   ├── explore/
│   │   │   └── modules.json
│   │   └── rewards/
│   │       └── rewards.json
│   ├── static/
│   │   ├── css/
│   │   │   ├── style.css             # 共通スタイル
│   │   │   ├── quiz.css              # クイズ画面
│   │   │   ├── explore.css           # 体験コーナー
│   │   │   └── animations.css        # フィードバックアニメーション
│   │   ├── js/
│   │   │   ├── main.js
│   │   │   ├── quiz-engine.js        # type非依存のクイズ進行エンジン
│   │   │   ├── renderers/            # ★ 問題タイプ別レンダラー
│   │   │   │   ├── choice.js
│   │   │   │   ├── fill_unit.js
│   │   │   │   └── conversion.js
│   │   │   ├── explore/              # ★ 体験モジュール（独立JS）
│   │   │   │   ├── clock.js
│   │   │   │   └── ruler.js
│   │   │   ├── ui.js
│   │   │   └── sound.js
│   │   ├── fonts/                    # ローカル配置のWebフォント
│   │   │   └── rounded-mplus-1c/
│   │   ├── images/
│   │   │   ├── common/              # 共通アイコン
│   │   │   ├── length/              # カテゴリ別イラスト
│   │   │   ├── volume/
│   │   │   ├── stamps/              # スタンプ画像
│   │   │   └── rewards/             # ごほうびイラスト
│   │   └── sounds/
│   │       ├── correct.ogg
│   │       ├── incorrect.ogg
│   │       └── levelup.ogg
│   └── templates/
│       ├── base.html
│       ├── components/
│       │   ├── _nav.html
│       │   ├── _category_card.html
│       │   ├── _level_badge.html
│       │   ├── _stamp_card.html
│       │   ├── _feedback.html
│       │   └── _user_switcher.html
│       ├── home.html
│       ├── category_list.html
│       ├── level_select.html
│       ├── quiz.html
│       ├── result.html
│       ├── explore_list.html
│       ├── explore_module.html
│       ├── records.html
│       ├── rewards.html
│       ├── daily.html
│       └── admin.html
├── db/
│   └── tani_master.db
└── tests/
    ├── conftest.py
    ├── test_quiz.py
    ├── test_models.py
    ├── test_question_loader.py
    └── test_achievements.py
```

---

## 10. question_loader.py の設計メモ

コンテンツJSON読み込みの中心。起動時にロードしてメモリにキャッシュ。
RPiのI/O回数を減らしつつ、開発時はリロードで変更反映できるようにする。

```python
import json
import os
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"

_cache = {}

def load_categories() -> list[dict]:
    return _load_json("categories.json")["categories"]

def load_questions(category_id: str, level: int) -> list[dict]:
    data = _load_json(f"questions/{category_id}.json")
    return data["levels"].get(str(level), {}).get("questions", [])

def load_explore_modules() -> list[dict]:
    return _load_json("explore/modules.json")["modules"]

def _load_json(relative_path: str) -> dict:
    # 開発時: 毎回読み込み / 本番: キャッシュ利用
    if not app_config.DEBUG and relative_path in _cache:
        return _cache[relative_path]
    filepath = DATA_DIR / relative_path
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
    _cache[relative_path] = data
    return data

def reload_cache():
    """保護者画面から手動キャッシュクリア用"""
    _cache.clear()
```
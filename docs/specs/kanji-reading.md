# かんじよみ機能

## 概要

漢字（または熟語）を画面に表示し、子どもが口頭で読みを答える。
親が子どもの回答を聞いて ○ / × ボタンで正誤を判定する新カテゴリを追加する。

## 対象ユーザー

子ども（メインユーザー）＋保護者（判定者）の2人で一緒に使う想定。

## 要件

- [ ] 新カテゴリ「かんじ」を既存カテゴリと並列に追加する
- [ ] レベル1（小1の漢字）・レベル2（小2の漢字）の2レベルを用意する
- [ ] 1セッション10問、8問正解でレベルクリア
- [ ] 漢字または熟語を大きく表示する（単漢字・熟語どちらも出題可能）
- [ ] 例文を漢字の下に表示する
- [ ] 子どもが口頭で答え、親が ○ / × ボタンで判定する（テキスト入力なし）
- [ ] ○ / × ボタン押下後、正しい読みを画面に表示する（正解・不正解どちらの場合も）
- [ ] 既存のスタンプ・学習記録の仕組みを流用する
- [ ] JSONのみの編集で問題を追加・修正できる

## 画面・UIフロー

```
問題表示
┌─────────────────────────────┐
│  レベル1  3/10もん           │  ← 進捗
│                             │
│         山                  │  ← 漢字を大きく（64px以上）表示
│                             │
│   山に のぼる               │  ← 例文（ひらがな混じりOK）
│                             │
│  おやさんが はんていしてね！  │  ← 親向けの指示文
│                             │
│   ［  ○  ］  ［  ×  ］      │  ← 判定ボタン（大きく・目立つ色）
└─────────────────────────────┘

↓ ○ or × を押す

判定後（フィードバック）
┌─────────────────────────────┐
│  ⭕ せいかい！  /  ❌ ざんねん！│
│                             │
│   こたえ：「やま」           │  ← 正しい読みを常に表示
│                             │
│  山に のぼる                │
│                             │
│       ［ つぎへ ➡ ］        │  ← 次の問題へ
└─────────────────────────────┘
```

## データ設計

### categories.json への追加

```json
{
  "id": "kanji",
  "name": "かんじ",
  "icon": "kanji.svg",
  "color": "#FF8C69",
  "description": "かんじを よんでみよう",
  "order": 6,
  "levels": [1, 2],
  "enabled": true
}
```

### questions/kanji.json の構造

```json
{
  "category_id": "kanji",
  "levels": {
    "1": {
      "title": "しょうがく1ねんせいの かんじ",
      "instruction": "かんじを よんでみよう",
      "passing_score": 8,
      "questions": [
        {
          "id": "kan_1_001",
          "type": "kanji_read",
          "display": "山",
          "reading": "やま",
          "example": "山に のぼる",
          "explanation": "「山」は「やま」とよむよ"
        },
        {
          "id": "kan_1_002",
          "type": "kanji_read",
          "display": "山川",
          "reading": "やまかわ",
          "example": "山川を こえて いく",
          "explanation": "「山川」は「やまかわ」とよむよ"
        }
      ]
    },
    "2": {
      "title": "しょうがく2ねんせいの かんじ",
      "instruction": "かんじを よんでみよう",
      "passing_score": 8,
      "questions": []
    }
  }
}
```

#### フィールド定義

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `id` | string | `kan_{レベル}_{連番3桁}` |
| `type` | string | 固定値 `"kanji_read"` |
| `display` | string | 画面に大きく表示する漢字または熟語 |
| `reading` | string | 正しい読み（ひらがな）|
| `example` | string | 使い方の例文 |
| `explanation` | string | 判定後に表示する補足説明 |

## 新規レンダラー: kanji_read

### ファイル

`app/static/js/renderers/kanji_read.js`

### 動作仕様

1. `display`（漢字/熟語）を大きく表示
2. `example`（例文）を下に表示
3. 親向けの指示文「おやさんが はんていしてね！」を表示
4. ○ / × ボタンを表示（通常の選択肢ボタン・送信ボタンは表示しない）
5. ボタン押下で `is_correct` を決定し、quiz-engine に通知
6. 判定後: `reading`・`explanation` を表示、「つぎへ」ボタンを表示

### quiz-engine.js との連携

`kanji_read` 型では親が正誤を判定するため、通常の `getAnswer()` + 自動照合フローを使わない。
レンダラー側から quiz-engine の `submitParentJudgment(is_correct)` を呼び出す形で連携する。

```javascript
// quiz-engine.js に追加するAPI
export function submitParentJudgment(isCorrect) {
  // is_correct を受け取り、記録・次問題表示を実行
}
```

## スタンプ定義（rewards.json への追加）

```json
{ "id": "kanji_l1_clear", "name": "かんじマスター ★",
  "condition": { "type": "level_clear", "category": "kanji", "level": 1 },
  "image": "stamps/kanji_star1.svg" },
{ "id": "kanji_l2_clear", "name": "かんじマスター ★★",
  "condition": { "type": "level_clear", "category": "kanji", "level": 2 },
  "image": "stamps/kanji_star2.svg" }
```

## スコープ外（このPRに含めないこと）

- 音読み・訓読みの区別表示（将来対応）
- 漢字のイラスト・画像（SVGは用意しない）
- 書き順アニメーション
- 問題のランダム出題（現行と同じく先頭から10問を出題）
- レベル3以上（小3以降の漢字）

## 実装ファイル一覧

| ファイル | 変更種別 | 内容 |
|---------|---------|------|
| `docs/specs/kanji-reading.md` | 新規 | 本ファイル |
| `app/data/categories.json` | 変更 | kanji カテゴリを追加 |
| `app/data/questions/kanji.json` | 新規 | 各レベル10問以上 |
| `app/data/rewards/rewards.json` | 変更 | kanji スタンプ2種を追加 |
| `app/static/js/renderers/kanji_read.js` | 新規 | 親判定UIレンダラー |
| `app/static/js/quiz-engine.js` | 変更 | `submitParentJudgment()` を追加 |
| `app/static/css/quiz.css` | 変更 | 漢字大表示・○×ボタンのスタイル |
| `app/static/images/common/kanji.svg` | 新規 | カテゴリアイコン |
| `app/data/rewards/stamps/kanji_star1.svg` | 新規 | スタンプ画像 |
| `app/data/rewards/stamps/kanji_star2.svg` | 新規 | スタンプ画像 |
| `tests/test_kanji_read.py` | 新規 | TDDテスト |

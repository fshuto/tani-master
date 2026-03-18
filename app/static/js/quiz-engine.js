/**
 * quiz-engine.js — クイズ進行エンジン（type非依存）
 *
 * 各レンダラーは自己登録パターンで registerRenderer() を呼ぶ。
 * エンジン自体は問題タイプを知らず、rendererに委譲するだけ。
 */

import { showFeedback, hideFeedback, updateProgress, initHint, resetHint } from "./ui.js";
import { playSound } from "./sound.js";

/** @type {Record<string, {render: function, getAnswer: function}>} */
const RENDERERS = {};

/**
 * レンダラーを登録する
 * @param {string} type
 * @param {{render: function, getAnswer: function}} renderer
 */
export function registerRenderer(type, renderer) {
  RENDERERS[type] = renderer;
}

/**
 * 問題を描画する（typeに応じたrendererを選択）
 * @param {object} question
 * @param {HTMLElement} containerEl
 */
export function renderQuestion(question, containerEl) {
  const renderer = RENDERERS[question.type] || RENDERERS["choice"];
  if (!renderer) {
    containerEl.innerHTML = `<p>レンダラーが みつかりません: ${question.type}</p>`;
    return;
  }
  renderer.render(question, containerEl);
}

/**
 * クイズを開始する（quiz.html から呼ばれる）
 * @param {{categoryId: string, level: number, resultUrl: string, apiQuizUrl: string, apiAnswerUrl: string}} config
 */
export async function startQuiz(config) {
  const { categoryId, level, resultUrl, apiQuizUrl, apiAnswerUrl } = config;

  // 問題セット取得
  let data;
  try {
    const res = await fetch(apiQuizUrl);
    data = await res.json();
  } catch (e) {
    showError("もんだいを よみこめませんでした");
    return;
  }

  const questions = data.questions;
  const total = data.total;
  let currentIndex = 0;
  let score = 0;
  let answered = false;

  const loadingEl = document.getElementById("quiz-loading");
  const questionContainer = document.getElementById("question-container");

  if (loadingEl) loadingEl.hidden = true;
  if (questionContainer) questionContainer.hidden = false;

  /** 指定インデックスの問題を描画する */
  function showQuestion(index) {
    answered = false;
    const q = questions[index];
    hideFeedback();
    resetHint();
    updateProgress(index + 1, total, score);

    // 問題テキスト（kanji_read は renderer が表示を担うので空欄）
    const textEl = document.getElementById("question-text");
    if (textEl) textEl.textContent = q.question || "";

    // 問題画像
    const imageWrap = document.getElementById("question-image-wrap");
    const imageEl   = document.getElementById("question-image");
    if (imageWrap && imageEl) {
      if (q.image) {
        imageEl.src = `/static/images/${q.image}`;
        imageWrap.hidden = false;
      } else {
        imageWrap.hidden = true;
      }
    }

    // rendererで選択肢を描画
    const optionsContainer = document.getElementById("options-container");
    if (optionsContainer) {
      renderQuestion(q, optionsContainer);
    }

    // ヒント
    initHint(q.hint || "");

    // 回答イベント（rendererからdispatchされる）
    optionsContainer.addEventListener("answer", handleAnswer, { once: true });
  }

  /** 回答受付 */
  async function handleAnswer(event) {
    if (answered) return;
    answered = true;

    const { answerIndex, isCorrect: parentIsCorrect } = event.detail;
    const q = questions[currentIndex];
    // kanji_read は親が isCorrect を直接渡す
    const isParentJudge = parentIsCorrect !== undefined;

    // 選択肢ボタンを無効化
    disableOptions();

    // API送信
    let result;
    try {
      const body = isParentJudge
        ? { question_id: q.id, is_correct: parentIsCorrect, category: categoryId, level }
        : { question_id: q.id, answer_index: answerIndex, category: categoryId, level };
      const res = await fetch(apiAnswerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      result = await res.json();
    } catch (e) {
      result = {
        is_correct: isParentJudge ? parentIsCorrect : answerIndex === q.answer_index,
        correct_index: q.answer_index,
        explanation: q.explanation || "",
        reading: q.reading || "",
        score_so_far: score,
      };
    }

    // 正誤ハイライト（親判定型はスキップ）
    if (!isParentJudge) {
      highlightOptions(answerIndex, result.correct_index);
    }

    if (result.is_correct) {
      score++;
      playSound("correct");
    } else {
      playSound("incorrect");
    }
    updateProgress(currentIndex + 1, total, score);

    // フィードバックテキスト（kanji_read は reading を先頭に表示）
    const feedbackText = result.reading
      ? `こたえ：「${result.reading}」　${result.explanation}`
      : result.explanation;

    // フィードバック表示
    showFeedback(result.is_correct, feedbackText, () => {
      currentIndex++;
      if (currentIndex < total) {
        showQuestion(currentIndex);
      } else {
        // 全問終了
        window.location.href = resultUrl;
      }
    }, q.diagram || null);
  }

  showQuestion(0);
}

/**
 * きょうのチャレンジ（daily.html）の初期化
 * @param {{apiAnswerUrl: string, categoryId: string, level: number}} config
 */
export function initDailyChallenge(config) {
  const { apiAnswerUrl, categoryId, level } = config;
  const optionBtns = document.querySelectorAll(".quiz-option");
  if (!optionBtns.length) return;

  optionBtns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      optionBtns.forEach((b) => { b.disabled = true; });

      const answerIndex = parseInt(btn.dataset.index, 10);
      const correctIndex = parseInt(btn.dataset.answer, 10);
      const explanation  = btn.dataset.explanation || "";
      const questionId   = btn.closest("[data-question-id]")?.dataset.questionId || "";

      // ハイライト
      optionBtns.forEach((b, i) => {
        if (i === correctIndex) b.classList.add("quiz-option--correct");
        else if (i === answerIndex) b.classList.add("quiz-option--incorrect");
      });

      const isCorrect = answerIndex === correctIndex;
      if (isCorrect) playSound("correct");
      else           playSound("incorrect");

      // API送信（ログ目的、エラーは無視）
      try {
        await fetch(apiAnswerUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question_id: questionId,
            answer_index: answerIndex,
            category: categoryId,
            level: level,
          }),
        });
      } catch (_) {}

      showFeedback(isCorrect, explanation, () => {});
    });
  });
}

/** 選択肢ボタン全体を無効化する */
function disableOptions() {
  document.querySelectorAll(".quiz-option").forEach((btn) => {
    btn.disabled = true;
  });
}

/** 選択ボタンに正解/不正解クラスを付与する */
function highlightOptions(selectedIndex, correctIndex) {
  document.querySelectorAll(".quiz-option").forEach((btn, i) => {
    if (i === correctIndex)  btn.classList.add("quiz-option--correct");
    if (i === selectedIndex && selectedIndex !== correctIndex) {
      btn.classList.add("quiz-option--incorrect");
    }
  });
}

/** エラーメッセージを表示する */
function showError(message) {
  const loading = document.getElementById("quiz-loading");
  if (loading) loading.textContent = message;
}

/**
 * ui.js — 共通UIヘルパー
 * フィードバック表示・パーティクル・スコア更新などの共通処理
 */

/**
 * 正解・不正解フィードバックを表示する
 * @param {boolean} isCorrect
 * @param {string} explanation
 * @param {function} onNext - 「つぎへ」ボタン押下時のコールバック
 */
export function showFeedback(isCorrect, explanation, onNext) {
  const feedbackEl = document.getElementById("feedback");
  const correctEl  = document.getElementById("feedback-correct");
  const incorrectEl = document.getElementById("feedback-incorrect");
  const explanationEl = isCorrect
    ? document.getElementById("feedback-explanation")
    : document.getElementById("feedback-explanation-wrong");
  const nextBtn = document.getElementById("btn-next");

  if (!feedbackEl) return;

  // フィードバックを表示
  feedbackEl.hidden = false;
  feedbackEl.classList.add("fade-in");

  if (isCorrect) {
    correctEl.hidden  = false;
    incorrectEl.hidden = true;
    correctEl.classList.add("is-active");
    spawnParticles();
  } else {
    correctEl.hidden  = true;
    incorrectEl.hidden = false;
    incorrectEl.classList.add("is-active");
  }

  if (explanationEl) {
    explanationEl.textContent = explanation || "";
  }

  // 「つぎへ」ボタンのハンドラを付け替え
  if (nextBtn) {
    const newBtn = nextBtn.cloneNode(true);
    nextBtn.parentNode.replaceChild(newBtn, nextBtn);
    newBtn.addEventListener("click", onNext, { once: true });
  }
}

/**
 * フィードバックを非表示にしてリセットする
 */
export function hideFeedback() {
  const feedbackEl = document.getElementById("feedback");
  if (!feedbackEl) return;
  feedbackEl.hidden = true;
  feedbackEl.classList.remove("fade-in");
  const correctEl  = document.getElementById("feedback-correct");
  const incorrectEl = document.getElementById("feedback-incorrect");
  if (correctEl)  { correctEl.hidden = false; correctEl.classList.remove("is-active"); }
  if (incorrectEl){ incorrectEl.hidden = false; incorrectEl.classList.remove("is-active"); }
}

/**
 * プログレスと現在のスコアを更新する
 * @param {number} current - 現在の問題番号（1始まり）
 * @param {number} total
 * @param {number} score
 */
export function updateProgress(current, total, score) {
  const currentEl = document.getElementById("progress-current");
  const totalEl   = document.getElementById("progress-total");
  const scoreEl   = document.getElementById("score-value");
  if (currentEl) currentEl.textContent = current;
  if (totalEl)   totalEl.textContent   = total;
  if (scoreEl)   scoreEl.textContent   = score;
}

/**
 * 正解時に星・ハートなどのパーティクルを飛ばす（CSS アニメーションで実装）
 */
function spawnParticles() {
  const emojis = ["⭐", "✨", "🌟", "💫"];
  for (let i = 0; i < 8; i++) {
    const p = document.createElement("span");
    p.className = "particle";
    p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    p.style.left  = `${20 + Math.random() * 60}vw`;
    p.style.top   = `${30 + Math.random() * 40}vh`;
    p.style.animationDelay = `${Math.random() * 0.3}s`;
    document.body.appendChild(p);
    p.addEventListener("animationend", () => p.remove(), { once: true });
  }
}

/**
 * ヒントボタンを初期化する
 * @param {string} hintText
 */
export function initHint(hintText) {
  const hintWrap = document.getElementById("quiz-hint");
  const hintBtn  = document.getElementById("btn-hint");
  const hintTextEl = document.getElementById("hint-text");
  if (!hintWrap) return;

  if (hintText) {
    hintWrap.hidden = false;
    if (hintTextEl) hintTextEl.textContent = hintText;
    if (hintBtn) {
      hintBtn.addEventListener("click", () => {
        if (hintTextEl) {
          hintTextEl.hidden = !hintTextEl.hidden;
          hintBtn.textContent = hintTextEl.hidden ? "💡 ヒントを みる" : "💡 ヒントを かくす";
        }
      });
    }
  } else {
    hintWrap.hidden = true;
  }
}

/**
 * ヒント表示をリセットする
 */
export function resetHint() {
  const hintWrap = document.getElementById("quiz-hint");
  const hintTextEl = document.getElementById("hint-text");
  const hintBtn  = document.getElementById("btn-hint");
  if (hintWrap) hintWrap.hidden = true;
  if (hintTextEl) { hintTextEl.hidden = true; }
  if (hintBtn) hintBtn.textContent = "💡 ヒントを みる";
}

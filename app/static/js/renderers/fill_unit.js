/**
 * renderers/fill_unit.js — 空欄補充型レンダラー
 * type: "fill_unit" の問題を描画する。
 * 問題文の末尾に空欄（____）を表示し、単位を選ばせる。
 */
import { registerRenderer } from "../quiz-engine.js";

const fillUnitRenderer = {
  /**
   * 空欄補充型の問題を描画する
   * @param {object} question - questionオブジェクト
   * @param {HTMLElement} container - 選択肢コンテナ（#options-container）
   */
  render(question, container) {
    container.innerHTML = "";
    container.classList.remove("quiz-card__options--grid");

    // 問題文の空欄部分をハイライト表示に置き換える
    const questionTextEl = document.getElementById("question-text");
    if (questionTextEl) {
      // "____" を span に置き換えてスタイルを付ける
      const filled = question.question.replace(
        /____/g,
        '<span class="fill-unit-blank" id="fill-blank">　</span>'
      );
      questionTextEl.innerHTML = filled;
    }

    // 単位の選択肢ボタン（横並び）
    const optWrapper = document.createElement("div");
    optWrapper.className = "quiz-card__options quiz-card__options--grid";

    question.options.forEach((option, index) => {
      const btn = document.createElement("button");
      btn.className = "quiz-option quiz-option--unit";
      btn.type = "button";
      btn.dataset.index = index;
      btn.textContent = option.text;

      btn.addEventListener("click", () => {
        // 空欄にテキストを入れる（視覚フィードバック）
        const blankEl = document.getElementById("fill-blank");
        if (blankEl) blankEl.textContent = option.text;

        container.dispatchEvent(new CustomEvent("answer", {
          bubbles: true,
          detail: { answerIndex: index },
        }));
      });

      optWrapper.appendChild(btn);
    });

    container.appendChild(optWrapper);
  },

  getAnswer(container) {
    return null;
  },
};

registerRenderer("fill_unit", fillUnitRenderer);

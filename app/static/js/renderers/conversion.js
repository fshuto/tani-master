/**
 * renderers/conversion.js — 単位変換型レンダラー
 * type: "conversion" の問題を描画する。
 * choice レンダラーとほぼ同じだが、変換式のヘッダーを追加する。
 */
import { registerRenderer } from "../quiz-engine.js";

const conversionRenderer = {
  /**
   * 単位変換型の問題を描画する
   * @param {object} question
   * @param {HTMLElement} container
   */
  render(question, container) {
    container.innerHTML = "";

    // 変換式ヘッダーを上部に挿入
    const header = document.createElement("p");
    header.className = "conversion-header";
    header.textContent = "おなじかずに なるものは どれかな？";
    container.appendChild(header);

    // 選択肢グリッド
    const optWrapper = document.createElement("div");
    optWrapper.className = "quiz-card__options" +
      (question.options.length >= 3 ? " quiz-card__options--grid" : "");

    question.options.forEach((option, index) => {
      const btn = document.createElement("button");
      btn.className = "quiz-option";
      btn.type = "button";
      btn.dataset.index = index;
      btn.textContent = option.text;

      btn.addEventListener("click", () => {
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

registerRenderer("conversion", conversionRenderer);

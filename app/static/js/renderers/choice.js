/**
 * renderers/choice.js — 選択肢型レンダラー
 * type: "choice" の問題を描画する。
 * 自己登録パターンで quiz-engine に登録する。
 */
import { registerRenderer } from "../quiz-engine.js";

const choiceRenderer = {
  /**
   * 選択肢ボタンを描画する
   * @param {object} question
   * @param {HTMLElement} container
   */
  render(question, container) {
    container.innerHTML = "";

    // 選択肢が3個以上ならグリッドレイアウト
    if (question.options.length >= 3) {
      container.classList.add("quiz-card__options--grid");
    } else {
      container.classList.remove("quiz-card__options--grid");
    }

    question.options.forEach((option, index) => {
      const btn = document.createElement("button");
      btn.className = "quiz-option";
      btn.type = "button";
      btn.dataset.index = index;

      if (option.image) {
        const img = document.createElement("img");
        img.src = `/static/images/${option.image}`;
        img.alt = option.text;
        img.className = "quiz-option__image";
        btn.appendChild(img);
        if (option.text) {
          const span = document.createElement("span");
          span.textContent = option.text;
          btn.appendChild(span);
        }
      } else {
        btn.textContent = option.text;
      }

      btn.addEventListener("click", () => {
        container.dispatchEvent(new CustomEvent("answer", {
          bubbles: true,
          detail: { answerIndex: index },
        }));
      });

      container.appendChild(btn);
    });
  },

  /**
   * 選択された回答インデックスを返す（未使用だが将来の拡張用）
   * @param {HTMLElement} container
   * @returns {number|null}
   */
  getAnswer(container) {
    const selected = container.querySelector(".quiz-option--selected");
    if (!selected) return null;
    return parseInt(selected.dataset.index, 10);
  },
};

registerRenderer("choice", choiceRenderer);

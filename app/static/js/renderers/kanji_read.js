/**
 * renderers/kanji_read.js — 漢字よみ型レンダラー
 * type: "kanji_read" の問題を描画する。
 * 子どもが口頭で答え、親が ○/× ボタンで正誤を判定する。
 * 自己登録パターンで quiz-engine に登録する。
 */
import { registerRenderer } from "../quiz-engine.js";

const kanjiReadRenderer = {
  /**
   * 漢字・例文・○×ボタンを描画する
   * @param {object} question
   * @param {HTMLElement} container
   */
  render(question, container) {
    container.innerHTML = "";
    container.classList.remove("quiz-card__options--grid");

    // 漢字（メイン表示）
    const displayEl = document.createElement("div");
    displayEl.className = "kanji-display";
    displayEl.textContent = question.display;
    container.appendChild(displayEl);

    // 例文
    const exampleEl = document.createElement("p");
    exampleEl.className = "kanji-example";
    exampleEl.textContent = question.example;
    container.appendChild(exampleEl);

    // 親向け指示文
    const instructEl = document.createElement("p");
    instructEl.className = "kanji-instruct";
    instructEl.textContent = "おやさんが はんていしてね！";
    container.appendChild(instructEl);

    // ○/× ボタン
    const judgeWrap = document.createElement("div");
    judgeWrap.className = "kanji-judge";

    const btnCorrect = document.createElement("button");
    btnCorrect.className = "kanji-judge__btn kanji-judge__btn--correct";
    btnCorrect.type = "button";
    btnCorrect.textContent = "○";
    btnCorrect.addEventListener("click", () => {
      btnCorrect.disabled = true;
      btnIncorrect.disabled = true;
      container.dispatchEvent(new CustomEvent("answer", {
        bubbles: true,
        detail: { answerIndex: -1, isCorrect: true },
      }));
    });

    const btnIncorrect = document.createElement("button");
    btnIncorrect.className = "kanji-judge__btn kanji-judge__btn--incorrect";
    btnIncorrect.type = "button";
    btnIncorrect.textContent = "×";
    btnIncorrect.addEventListener("click", () => {
      btnCorrect.disabled = true;
      btnIncorrect.disabled = true;
      container.dispatchEvent(new CustomEvent("answer", {
        bubbles: true,
        detail: { answerIndex: -1, isCorrect: false },
      }));
    });

    judgeWrap.appendChild(btnCorrect);
    judgeWrap.appendChild(btnIncorrect);
    container.appendChild(judgeWrap);
  },

  /** getAnswer は kanji_read では使用しない（親判定のため） */
  getAnswer(_container) {
    return null;
  },
};

registerRenderer("kanji_read", kanjiReadRenderer);

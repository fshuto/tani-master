/**
 * main.js — アプリ初期化
 * ページ読み込み時に共通処理を行う
 */
import { initSound } from "./sound.js";

document.addEventListener("DOMContentLoaded", () => {
  initSound();
  highlightCurrentNav();
});

/**
 * 現在のURLに対応するナビリンクにactiveクラスを付与する
 */
function highlightCurrentNav() {
  const links = document.querySelectorAll(".app-header__nav-link");
  const path = window.location.pathname;
  links.forEach((link) => {
    if (link.getAttribute("href") === path) {
      link.classList.add("app-header__nav-link--active");
    }
  });
}

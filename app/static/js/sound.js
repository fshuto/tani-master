/**
 * sound.js — 効果音管理
 * Raspberry Pi 上でも軽量に動作するよう、Web Audio API は使わず
 * HTMLAudioElement を使用する。
 */

/** @type {Record<string, HTMLAudioElement>} */
const sounds = {};

/** 効果音を初期化する（ページロード時に1回呼ぶ） */
export function initSound() {
  const base = document.querySelector("script[src*='main.js']");
  const staticBase = base
    ? base.src.replace(/js\/main\.js.*$/, "")
    : "/static/";

  ["correct", "incorrect", "levelup"].forEach((name) => {
    const audio = new Audio(`${staticBase}sounds/${name}.ogg`);
    audio.preload = "auto";
    sounds[name] = audio;
  });
}

/**
 * 効果音を再生する
 * @param {"correct"|"incorrect"|"levelup"} name
 */
export function playSound(name) {
  const audio = sounds[name];
  if (!audio) return;
  audio.currentTime = 0;
  audio.play().catch(() => {
    // 自動再生がブロックされた場合は無視
  });
}

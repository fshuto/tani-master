/**
 * explore/ruler.js — ものさしシミュレーターモジュール
 * スライダーでものの長さを変えて cm/mm を読む練習ができる。
 */

/**
 * ものさしモジュールを初期化する
 * @param {HTMLElement} container
 */
export function init(container) {
  container.innerHTML = "";

  const wrap = document.createElement("div");
  wrap.className = "ruler-module";
  wrap.style.cssText = "display:flex;flex-direction:column;align-items:center;gap:20px;";

  const title = document.createElement("p");
  title.style.cssText = "font-size:1.1rem;font-weight:700;text-align:center;";
  title.textContent = "スライダーを うごかして ながさを よもう！";
  wrap.appendChild(title);

  // SVGものさし
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 320 80");
  svg.setAttribute("width", "100%");
  svg.style.maxWidth = "560px";
  svg.classList.add("ruler-svg");

  // ものさし本体
  const rulerRect = document.createElementNS(svgNS, "rect");
  rulerRect.setAttribute("x", "10"); rulerRect.setAttribute("y", "10");
  rulerRect.setAttribute("width", "300"); rulerRect.setAttribute("height", "40");
  rulerRect.setAttribute("rx", "4");
  rulerRect.setAttribute("fill", "#FFF9C4");
  rulerRect.setAttribute("stroke", "#F4B942");
  rulerRect.setAttribute("stroke-width", "2");
  svg.appendChild(rulerRect);

  // 目盛り（1cm = 30px, 最大10cm）
  const cmPx = 30;
  for (let cm = 0; cm <= 10; cm++) {
    const x = 10 + cm * cmPx;
    // cm目盛り
    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", x); line.setAttribute("y1", "10");
    line.setAttribute("x2", x); line.setAttribute("y2", cm % 5 === 0 ? "34" : "28");
    line.setAttribute("stroke", "#4A4A4A");
    line.setAttribute("stroke-width", cm % 5 === 0 ? "2" : "1");
    svg.appendChild(line);

    // 数字（5の倍数）
    if (cm % 5 === 0 && cm > 0) {
      const text = document.createElementNS(svgNS, "text");
      text.setAttribute("x", x);
      text.setAttribute("y", "46");
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("font-size", "10");
      text.setAttribute("fill", "#4A4A4A");
      text.textContent = cm;
      svg.appendChild(text);
    } else if (cm > 0) {
      const text = document.createElementNS(svgNS, "text");
      text.setAttribute("x", x);
      text.setAttribute("y", "42");
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("font-size", "8");
      text.setAttribute("fill", "#888");
      text.textContent = cm;
      svg.appendChild(text);
    }

    // mm 目盛り（各cm内）
    if (cm < 10) {
      for (let mm = 1; mm < 10; mm++) {
        const mx = x + (mm / 10) * cmPx;
        const mLine = document.createElementNS(svgNS, "line");
        mLine.setAttribute("x1", mx); mLine.setAttribute("y1", "10");
        mLine.setAttribute("x2", mx); mLine.setAttribute("y2", mm === 5 ? "24" : "20");
        mLine.setAttribute("stroke", "#888");
        mLine.setAttribute("stroke-width", "0.5");
        svg.appendChild(mLine);
      }
    }
  }

  // 計測バー（赤いハイライト）
  const measureBar = document.createElementNS(svgNS, "rect");
  measureBar.setAttribute("x", "10"); measureBar.setAttribute("y", "12");
  measureBar.setAttribute("height", "24");
  measureBar.setAttribute("fill", "rgba(255,100,100,0.3)");
  measureBar.setAttribute("rx", "2");
  svg.appendChild(measureBar);

  // 単位ラベル
  const unitText = document.createElementNS(svgNS, "text");
  unitText.setAttribute("y", "70");
  unitText.setAttribute("text-anchor", "middle");
  unitText.setAttribute("font-size", "10");
  unitText.setAttribute("fill", "#4A4A4A");
  svg.appendChild(unitText);

  wrap.appendChild(svg);

  // スライダー
  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = "5"; slider.max = "100"; slider.step = "1";
  slider.value = "30";
  slider.style.cssText = "width:100%;max-width:560px;height:40px;";
  wrap.appendChild(slider);

  // 数値表示
  const display = document.createElement("p");
  display.style.cssText = "font-size:2rem;font-weight:900;color:#4ECDC4;text-align:center;";
  wrap.appendChild(display);

  function update() {
    const mm = parseInt(slider.value, 10);
    const cm = Math.floor(mm / 10);
    const rmm = mm % 10;
    const barWidth = (mm / 100) * cmPx * 10;

    measureBar.setAttribute("width", barWidth);
    unitText.setAttribute("x", 10 + barWidth / 2);

    if (rmm === 0) {
      display.textContent = `${cm} cm`;
      unitText.textContent = `${cm} cm`;
    } else {
      display.textContent = `${cm} cm ${rmm} mm (${mm} mm)`;
      unitText.textContent = `${mm} mm`;
    }
  }

  slider.addEventListener("input", update);
  update();

  container.appendChild(wrap);
}

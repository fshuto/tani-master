/**
 * explore/clock.js — アナログ時計インタラクティブモジュール
 * ユーザーが針を動かして時刻を読む練習ができる。
 */

/**
 * 時計モジュールを初期化する
 * @param {HTMLElement} container
 */
export function init(container) {
  container.innerHTML = "";

  const wrap = document.createElement("div");
  wrap.className = "clock-module";

  const title = document.createElement("p");
  title.style.fontSize = "1.1rem";
  title.style.fontWeight = "700";
  title.textContent = "はりを タップして じかんを よもう！";
  wrap.appendChild(title);

  // SVG時計盤
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 200 200");
  svg.setAttribute("width", "240");
  svg.setAttribute("height", "240");
  svg.style.cursor = "pointer";

  // 盤面
  const circle = document.createElementNS(svgNS, "circle");
  circle.setAttribute("cx", "100");
  circle.setAttribute("cy", "100");
  circle.setAttribute("r", "95");
  circle.setAttribute("fill", "white");
  circle.setAttribute("stroke", "#4ECDC4");
  circle.setAttribute("stroke-width", "4");
  svg.appendChild(circle);

  // 数字
  for (let h = 1; h <= 12; h++) {
    const angle = (h / 12) * 2 * Math.PI - Math.PI / 2;
    const x = 100 + 78 * Math.cos(angle);
    const y = 100 + 78 * Math.sin(angle);
    const text = document.createElementNS(svgNS, "text");
    text.setAttribute("x", x);
    text.setAttribute("y", y);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "central");
    text.setAttribute("font-size", "14");
    text.setAttribute("font-weight", "bold");
    text.setAttribute("fill", "#4A4A4A");
    text.textContent = h;
    svg.appendChild(text);
  }

  // 分目盛り
  for (let m = 0; m < 60; m++) {
    const angle = (m / 60) * 2 * Math.PI - Math.PI / 2;
    const isHour = m % 5 === 0;
    const r1 = isHour ? 84 : 88;
    const r2 = 92;
    const x1 = 100 + r1 * Math.cos(angle);
    const y1 = 100 + r1 * Math.sin(angle);
    const x2 = 100 + r2 * Math.cos(angle);
    const y2 = 100 + r2 * Math.sin(angle);
    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", x1); line.setAttribute("y1", y1);
    line.setAttribute("x2", x2); line.setAttribute("y2", y2);
    line.setAttribute("stroke", isHour ? "#4A4A4A" : "#ccc");
    line.setAttribute("stroke-width", isHour ? "2" : "1");
    svg.appendChild(line);
  }

  // 時針
  const hourHand = document.createElementNS(svgNS, "line");
  hourHand.setAttribute("x1", "100"); hourHand.setAttribute("y1", "100");
  hourHand.setAttribute("stroke", "#4A4A4A");
  hourHand.setAttribute("stroke-width", "5");
  hourHand.setAttribute("stroke-linecap", "round");
  svg.appendChild(hourHand);

  // 分針
  const minHand = document.createElementNS(svgNS, "line");
  minHand.setAttribute("x1", "100"); minHand.setAttribute("y1", "100");
  minHand.setAttribute("stroke", "#4ECDC4");
  minHand.setAttribute("stroke-width", "3");
  minHand.setAttribute("stroke-linecap", "round");
  svg.appendChild(minHand);

  // 中心点
  const center = document.createElementNS(svgNS, "circle");
  center.setAttribute("cx", "100"); center.setAttribute("cy", "100");
  center.setAttribute("r", "4");
  center.setAttribute("fill", "#4A4A4A");
  svg.appendChild(center);

  wrap.appendChild(svg);

  // 時刻表示
  const timeDisplay = document.createElement("p");
  timeDisplay.style.cssText = "font-size:2rem;font-weight:900;text-align:center;color:#4ECDC4;";
  wrap.appendChild(timeDisplay);

  const instruction = document.createElement("p");
  instruction.style.cssText = "font-size:1rem;color:#888;text-align:center;";
  instruction.textContent = "じかんをよみとろう！";
  wrap.appendChild(instruction);

  container.appendChild(wrap);

  // 初期時刻（ランダム）
  let hours   = Math.floor(Math.random() * 12);
  let minutes = Math.floor(Math.random() * 12) * 5;

  function updateHands() {
    const hourAngle  = ((hours + minutes / 60) / 12) * 360 - 90;
    const minAngle   = (minutes / 60) * 360 - 90;

    const hr = (hourAngle * Math.PI) / 180;
    const mr = (minAngle  * Math.PI) / 180;
    const hourLen = 55;
    const minLen  = 75;

    hourHand.setAttribute("x2", 100 + hourLen * Math.cos(hr));
    hourHand.setAttribute("y2", 100 + hourLen * Math.sin(hr));
    minHand.setAttribute("x2",  100 + minLen  * Math.cos(mr));
    minHand.setAttribute("y2",  100 + minLen  * Math.sin(mr));

    const h12 = hours === 0 ? 12 : hours;
    const mPad = String(minutes).padStart(2, "0");
    timeDisplay.textContent = `${h12}じ ${mPad}ふん`;
  }

  // タップで次の時刻（5分刻み）
  svg.addEventListener("click", () => {
    minutes += 5;
    if (minutes >= 60) { minutes = 0; hours = (hours + 1) % 12; }
    updateHands();
  });

  updateHands();
}

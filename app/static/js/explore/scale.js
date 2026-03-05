/**
 * explore/scale.js — てんびんシミュレーターモジュール
 * 左右にものを置いてどちらが重いかを視覚的に確認できる。
 */

// てんびんに乗せられるもの
const ITEMS = [
  { name: "りんご",   weight: 300, emoji: "🍎" },
  { name: "バナナ",   weight: 150, emoji: "🍌" },
  { name: "スイカ",   weight: 5000, emoji: "🍉" },
  { name: "いちご",   weight: 20,  emoji: "🍓" },
  { name: "ぶどう",   weight: 400, emoji: "🍇" },
  { name: "みかん",   weight: 100, emoji: "🍊" },
  { name: "もも",     weight: 250, emoji: "🍑" },
  { name: "メロン",   weight: 1500, emoji: "🍈" },
];

/**
 * てんびんモジュールを初期化する
 * @param {HTMLElement} container
 */
export function init(container) {
  container.innerHTML = "";

  const wrap = document.createElement("div");
  wrap.className = "scale-module";

  // タイトル
  const title = document.createElement("p");
  title.className = "scale-module__title";
  title.textContent = "ものを のせて くらべてみよう！";
  wrap.appendChild(title);

  // SVGてんびん
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 400 260");
  svg.setAttribute("class", "scale-svg");

  // 支柱
  const pole = document.createElementNS(svgNS, "rect");
  pole.setAttribute("x", "196"); pole.setAttribute("y", "60");
  pole.setAttribute("width", "8"); pole.setAttribute("height", "140");
  pole.setAttribute("fill", "#888"); pole.setAttribute("rx", "4");
  svg.appendChild(pole);

  // 台座
  const base = document.createElementNS(svgNS, "rect");
  base.setAttribute("x", "160"); base.setAttribute("y", "195");
  base.setAttribute("width", "80"); base.setAttribute("height", "16");
  base.setAttribute("fill", "#888"); base.setAttribute("rx", "8");
  svg.appendChild(base);

  // 横棒（アニメーション対象）
  const beam = document.createElementNS(svgNS, "line");
  beam.setAttribute("x1", "60"); beam.setAttribute("y1", "80");
  beam.setAttribute("x2", "340"); beam.setAttribute("y2", "80");
  beam.setAttribute("stroke", "#4A4A4A"); beam.setAttribute("stroke-width", "5");
  beam.setAttribute("stroke-linecap", "round");
  svg.appendChild(beam);

  // 吊り下げ紐（左）
  const ropeL = document.createElementNS(svgNS, "line");
  ropeL.setAttribute("x1", "60"); ropeL.setAttribute("y1", "80");
  ropeL.setAttribute("x2", "60"); ropeL.setAttribute("y2", "130");
  ropeL.setAttribute("stroke", "#888"); ropeL.setAttribute("stroke-width", "2");
  svg.appendChild(ropeL);

  // 吊り下げ紐（右）
  const ropeR = document.createElementNS(svgNS, "line");
  ropeR.setAttribute("x1", "340"); ropeR.setAttribute("y1", "80");
  ropeR.setAttribute("x2", "340"); ropeR.setAttribute("y2", "130");
  ropeR.setAttribute("stroke", "#888"); ropeR.setAttribute("stroke-width", "2");
  svg.appendChild(ropeR);

  // 皿（左）
  const plateL = document.createElementNS(svgNS, "ellipse");
  plateL.setAttribute("cx", "60"); plateL.setAttribute("cy", "132");
  plateL.setAttribute("rx", "45"); plateL.setAttribute("ry", "10");
  plateL.setAttribute("fill", "#4ECDC4"); plateL.setAttribute("stroke", "#3bb8b0");
  plateL.setAttribute("stroke-width", "2");
  svg.appendChild(plateL);

  // 皿（右）
  const plateR = document.createElementNS(svgNS, "ellipse");
  plateR.setAttribute("cx", "340"); plateR.setAttribute("cy", "132");
  plateR.setAttribute("rx", "45"); plateR.setAttribute("ry", "10");
  plateR.setAttribute("fill", "#4ECDC4"); plateR.setAttribute("stroke", "#3bb8b0");
  plateR.setAttribute("stroke-width", "2");
  svg.appendChild(plateR);

  // 左皿の絵文字テキスト
  const emojiL = document.createElementNS(svgNS, "text");
  emojiL.setAttribute("x", "60"); emojiL.setAttribute("y", "118");
  emojiL.setAttribute("text-anchor", "middle");
  emojiL.setAttribute("dominant-baseline", "central");
  emojiL.setAttribute("font-size", "28");
  svg.appendChild(emojiL);

  // 右皿の絵文字テキスト
  const emojiR = document.createElementNS(svgNS, "text");
  emojiR.setAttribute("x", "340"); emojiR.setAttribute("y", "118");
  emojiR.setAttribute("text-anchor", "middle");
  emojiR.setAttribute("dominant-baseline", "central");
  emojiR.setAttribute("font-size", "28");
  svg.appendChild(emojiR);

  // 支点（丸）
  const pivot = document.createElementNS(svgNS, "circle");
  pivot.setAttribute("cx", "200"); pivot.setAttribute("cy", "65");
  pivot.setAttribute("r", "8"); pivot.setAttribute("fill", "#4A4A4A");
  svg.appendChild(pivot);

  wrap.appendChild(svg);

  // 重さ表示
  const weightInfo = document.createElement("p");
  weightInfo.className = "scale-module__weight-info";
  wrap.appendChild(weightInfo);

  // 結果表示
  const result = document.createElement("p");
  result.className = "scale-module__result";
  wrap.appendChild(result);

  // ものえらびパネル
  const panel = document.createElement("div");
  panel.className = "scale-module__panel";

  const panelL = document.createElement("div");
  panelL.className = "scale-panel scale-panel--left";
  const panelR = document.createElement("div");
  panelR.className = "scale-panel scale-panel--right";

  const panelLTitle = document.createElement("p");
  panelLTitle.className = "scale-panel__title";
  panelLTitle.textContent = "ひだり";
  panelL.appendChild(panelLTitle);

  const panelRTitle = document.createElement("p");
  panelRTitle.className = "scale-panel__title";
  panelRTitle.textContent = "みぎ";
  panelR.appendChild(panelRTitle);

  const itemsL = document.createElement("div");
  itemsL.className = "scale-panel__items";
  panelL.appendChild(itemsL);

  const itemsR = document.createElement("div");
  itemsR.className = "scale-panel__items";
  panelR.appendChild(itemsR);

  panel.appendChild(panelL);
  panel.appendChild(panelR);
  wrap.appendChild(panel);

  container.appendChild(wrap);

  // 状態
  let leftItem = null;
  let rightItem = null;

  // ランダムに2アイテムを選んで初期表示
  const shuffled = [...ITEMS].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 6);

  function buildItemButtons(panelEl, side) {
    panelEl.innerHTML = "";
    const title = document.createElement("p");
    title.className = "scale-panel__title";
    title.textContent = side === "left" ? "ひだり" : "みぎ";
    panelEl.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "scale-panel__items";
    selected.forEach(item => {
      const btn = document.createElement("button");
      btn.className = "scale-item-btn";
      btn.type = "button";
      const isActive = side === "left"
        ? leftItem && leftItem.name === item.name
        : rightItem && rightItem.name === item.name;
      if (isActive) btn.classList.add("scale-item-btn--active");
      btn.innerHTML = `<span class="scale-item-btn__emoji">${item.emoji}</span><span class="scale-item-btn__name">${item.name}</span>`;
      btn.addEventListener("click", () => {
        if (side === "left") {
          leftItem = item;
        } else {
          rightItem = item;
        }
        update();
      });
      grid.appendChild(btn);
    });
    panelEl.appendChild(grid);
  }

  function update() {
    buildItemButtons(panelL, "left");
    buildItemButtons(panelR, "right");

    const lw = leftItem ? leftItem.weight : 0;
    const rw = rightItem ? rightItem.weight : 0;

    // てんびんの傾き（最大15度）
    let tilt = 0;
    if (lw > 0 && rw > 0) {
      const diff = lw - rw;
      const maxDiff = 5000;
      tilt = Math.max(-15, Math.min(15, (diff / maxDiff) * 15));
    }

    // 横棒・皿・絵文字を傾ける
    const cx = 200; const cy = 65;
    const armLen = 140;
    const rad = (tilt * Math.PI) / 180;

    const lx = cx - armLen * Math.cos(rad);
    const ly = cy - armLen * Math.sin(rad) + armLen * Math.sin(rad) * 0;
    const lEndX = cx - armLen * Math.cos(rad);
    const lEndY = cy + armLen * Math.sin(rad);
    const rEndX = cx + armLen * Math.cos(rad);
    const rEndY = cy - armLen * Math.sin(rad);

    beam.setAttribute("x1", lEndX); beam.setAttribute("y1", lEndY);
    beam.setAttribute("x2", rEndX); beam.setAttribute("y2", rEndY);

    const ropeLen = 50;
    const lPlateX = lEndX;
    const lPlateY = lEndY + ropeLen;
    const rPlateX = rEndX;
    const rPlateY = rEndY + ropeLen;

    ropeL.setAttribute("x1", lEndX); ropeL.setAttribute("y1", lEndY);
    ropeL.setAttribute("x2", lPlateX); ropeL.setAttribute("y2", lPlateY);

    ropeR.setAttribute("x1", rEndX); ropeR.setAttribute("y1", rEndY);
    ropeR.setAttribute("x2", rPlateX); ropeR.setAttribute("y2", rPlateY);

    plateL.setAttribute("cx", lPlateX); plateL.setAttribute("cy", lPlateY);
    plateR.setAttribute("cx", rPlateX); plateR.setAttribute("cy", rPlateY);

    emojiL.setAttribute("x", lPlateX); emojiL.setAttribute("y", lPlateY - 14);
    emojiL.textContent = leftItem ? leftItem.emoji : "";

    emojiR.setAttribute("x", rPlateX); emojiR.setAttribute("y", rPlateY - 14);
    emojiR.textContent = rightItem ? rightItem.emoji : "";

    // 重さ表示
    if (leftItem && rightItem) {
      weightInfo.textContent =
        `ひだり: ${leftItem.name} (${leftItem.weight}g)　みぎ: ${rightItem.name} (${rightItem.weight}g)`;

      if (lw > rw) {
        result.textContent = `${leftItem.name} の ほうが おもい！`;
        result.className = "scale-module__result scale-module__result--left";
      } else if (rw > lw) {
        result.textContent = `${rightItem.name} の ほうが おもい！`;
        result.className = "scale-module__result scale-module__result--right";
      } else {
        result.textContent = "おなじ おもさだ！";
        result.className = "scale-module__result scale-module__result--equal";
      }
    } else {
      weightInfo.textContent = "";
      result.textContent = "ものを えらんでね";
      result.className = "scale-module__result";
    }
  }

  // 初期描画
  update();
}

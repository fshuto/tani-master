/**
 * diagram-renderer.js — 解説図（SVG）を動的生成するレンダラー
 *
 * 対応タイプ:
 *   comparison_bar — 横棒グラフで長さを比較する
 *   ruler          — ものさし風バーで長さを示す
 *   unit_scale     — 大きい単位を小さい単位に分割して関係を示す
 *   segment_bar    — 1本のバーを区間に分けて合計を示す
 */

const NS = "http://www.w3.org/2000/svg";
const COLORS = ["#4ECDC4", "#FFE66D", "#FF8A80", "#A8D8EA"];
const CORRECT_COLOR = "#7BC67E";
const TEXT_COLOR = "#4A4A4A";

/**
 * diagram オブジェクトから SVG 要素を生成して返す
 * @param {object} diagram - 問題データの diagram フィールド
 * @returns {SVGElement|null}
 */
export function renderDiagram(diagram) {
  if (!diagram || !diagram.type) return null;
  switch (diagram.type) {
    case "comparison_bar": return renderComparisonBar(diagram);
    case "ruler":          return renderRuler(diagram);
    case "unit_scale":     return renderUnitScale(diagram);
    case "segment_bar":    return renderSegmentBar(diagram);
    default:               return null;
  }
}

/** SVG要素を生成するヘルパー */
function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

/** テキスト要素を生成するヘルパー */
function svgText(text, attrs = {}) {
  const el = svgEl("text", { "font-family": "inherit", ...attrs });
  el.textContent = text;
  return el;
}

/**
 * comparison_bar — 横棒グラフで長さを比較する
 * @param {{items: Array<{label,value,unit}>, highlight_index: number}} d
 */
function renderComparisonBar(d) {
  const { items, highlight_index } = d;
  if (!items || !items.length) return null;

  const maxVal = Math.max(...items.map(i => i.value));
  const W = 300, LABEL_W = 72, VALUE_W = 60, PAD = 8;
  const BAR_W = W - LABEL_W - VALUE_W - PAD;
  const BAR_H = 34, ROW_H = BAR_H + 10;
  const H = items.length * ROW_H + 16;

  const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", class: "diagram-svg" });

  items.forEach((item, i) => {
    const y = 8 + i * ROW_H;
    const barW = Math.max(8, (item.value / maxVal) * BAR_W);
    const isHighlight = i === highlight_index;
    const color = isHighlight ? CORRECT_COLOR : COLORS[i % COLORS.length];

    // ラベル（左）
    svg.appendChild(svgText(item.label, {
      x: LABEL_W - 6, y: y + BAR_H / 2 + 5,
      "text-anchor": "end", "font-size": 13,
      fill: TEXT_COLOR, "font-weight": isHighlight ? 700 : 400,
    }));

    // バー背景
    svg.appendChild(svgEl("rect", {
      x: LABEL_W, y, width: BAR_W, height: BAR_H, rx: 6, fill: "#f0f0f0",
    }));

    // バー本体
    svg.appendChild(svgEl("rect", {
      x: LABEL_W, y, width: barW, height: BAR_H, rx: 6, fill: color,
    }));

    // 正解マーク（★）
    if (isHighlight) {
      svg.appendChild(svgText("★", {
        x: LABEL_W + Math.min(barW - 22, BAR_W - 22), y: y + BAR_H / 2 + 7,
        "font-size": 15, fill: "rgba(255,255,255,0.9)",
      }));
    }

    // 値テキスト（右）
    svg.appendChild(svgText(`${item.value}${item.unit}`, {
      x: LABEL_W + BAR_W + PAD, y: y + BAR_H / 2 + 5,
      "font-size": 13, "font-weight": 700, fill: TEXT_COLOR,
    }));
  });

  return svg;
}

/**
 * ruler — ものさし風バーで長さを示す
 * @param {{value, unit, label, max_value}} d
 */
function renderRuler(d) {
  const { value, unit, label, max_value } = d;
  const displayMax = max_value || Math.ceil(value * 1.5);

  const W = 300, H = 70;
  const BX = 16, BY = 8, BW = W - BX * 2, BH = 30;
  const measW = Math.max(10, (value / displayMax) * BW);

  const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", class: "diagram-svg" });

  // 背景バー（全体）
  svg.appendChild(svgEl("rect", {
    x: BX, y: BY, width: BW, height: BH,
    rx: 6, fill: "#FFF8E1", stroke: "#F4B942", "stroke-width": 2,
  }));

  // 計測バー（色付き）
  svg.appendChild(svgEl("rect", {
    x: BX, y: BY, width: measW, height: BH, rx: 6, fill: "#4ECDC4",
  }));

  // 4本の目盛り
  for (let i = 1; i <= 4; i++) {
    const x = BX + (i / 5) * BW;
    svg.appendChild(svgEl("line", {
      x1: x, y1: BY, x2: x, y2: BY + BH * 0.4,
      stroke: "rgba(0,0,0,0.18)", "stroke-width": 1,
    }));
  }

  // 目盛りラベル（0 と max）
  svg.appendChild(svgText("0", {
    x: BX + 2, y: BY + BH + 14, "text-anchor": "start", "font-size": 10, fill: "#888",
  }));
  svg.appendChild(svgText(`${displayMax}${unit}`, {
    x: BX + BW - 2, y: BY + BH + 14, "text-anchor": "end", "font-size": 10, fill: "#888",
  }));

  // 計測値ラベル（バー内 or 右外）
  const valLabel = label ? `${label}：${value}${unit}` : `${value}${unit}`;
  if (measW >= 64) {
    svg.appendChild(svgText(valLabel, {
      x: BX + measW / 2, y: BY + BH / 2 + 5,
      "text-anchor": "middle", "font-size": 12, "font-weight": 700, fill: "white",
    }));
  } else {
    svg.appendChild(svgText(valLabel, {
      x: BX + measW + 6, y: BY + BH / 2 + 5,
      "font-size": 12, "font-weight": 700, fill: "#2B7A78",
    }));
  }

  return svg;
}

/**
 * unit_scale — 大きい単位を小さい単位の区間に分けて関係を示す
 * 例: 1m = 10 × 10cm のイメージで表示
 * @param {{from_value, from_unit, to_value, to_unit, segments}} d
 */
function renderUnitScale(d) {
  const { from_value, from_unit, to_value, to_unit, segments = 10 } = d;
  const segs = Math.min(segments, 20);

  const W = 300, H = 84;
  const BX = 16, BY = 8, BW = W - BX * 2, BH = 30;

  const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", class: "diagram-svg" });

  // メインバー
  svg.appendChild(svgEl("rect", {
    x: BX, y: BY, width: BW, height: BH,
    rx: 6, fill: "#4ECDC4", stroke: "#2B7A78", "stroke-width": 2,
  }));

  // 分割線
  for (let i = 1; i < segs; i++) {
    const x = BX + (i / segs) * BW;
    svg.appendChild(svgEl("line", {
      x1: x, y1: BY, x2: x, y2: BY + BH,
      stroke: "rgba(0,0,0,0.22)", "stroke-width": 1,
    }));
  }

  // from ラベル（バー中央）
  svg.appendChild(svgText(`${from_value}${from_unit}`, {
    x: BX + BW / 2, y: BY + BH / 2 + 6,
    "text-anchor": "middle", "font-size": 15, "font-weight": 900, fill: "white",
  }));

  // 矢印（下向き）
  const arrX = BX + BW / 2;
  svg.appendChild(svgEl("line", {
    x1: arrX, y1: BY + BH + 2, x2: arrX, y2: BY + BH + 12,
    stroke: "#666", "stroke-width": 1.5,
  }));
  svg.appendChild(svgEl("polygon", {
    points: `${arrX - 5},${BY + BH + 10} ${arrX + 5},${BY + BH + 10} ${arrX},${BY + BH + 16}`,
    fill: "#666",
  }));

  // to ラベル（下）
  svg.appendChild(svgText(`= ${to_value}${to_unit}`, {
    x: BX + BW / 2, y: BY + BH + 30,
    "text-anchor": "middle", "font-size": 14, "font-weight": 700, fill: TEXT_COLOR,
  }));

  return svg;
}

/**
 * segment_bar — 1本のバーを区間に分けて合計を示す（足し算の可視化）
 * @param {{parts: Array<{value,unit?,label?,color?}>, total: {value,unit}}} d
 */
function renderSegmentBar(d) {
  const { parts, total } = d;
  if (!parts || !parts.length) return null;

  const totalVal = total ? total.value : parts.reduce((s, p) => s + p.value, 0);
  const totalUnit = total ? total.unit : (parts[0].unit || "");

  const W = 300, H = 78;
  const BX = 16, BY = 8, BW = W - BX * 2, BH = 30;

  const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", class: "diagram-svg" });

  // クリップパス（丸角マスク）
  const defs = svgEl("defs");
  const clipPath = svgEl("clipPath", { id: "segclip" });
  clipPath.appendChild(svgEl("rect", { x: BX, y: BY, width: BW, height: BH, rx: 6 }));
  defs.appendChild(clipPath);
  svg.appendChild(defs);

  // セグメント描画グループ
  const g = svgEl("g", { "clip-path": "url(#segclip)" });
  let curX = BX;
  parts.forEach((part, i) => {
    const segW = (part.value / totalVal) * BW;
    const color = part.color || COLORS[i % COLORS.length];

    g.appendChild(svgEl("rect", { x: curX, y: BY, width: segW, height: BH, fill: color }));

    // 区切り線（白）
    if (i < parts.length - 1) {
      g.appendChild(svgEl("line", {
        x1: curX + segW, y1: BY, x2: curX + segW, y2: BY + BH,
        stroke: "rgba(255,255,255,0.7)", "stroke-width": 2,
      }));
    }

    // セグメントラベル
    if (segW > 26) {
      g.appendChild(svgText(part.label || `${part.value}${part.unit || ""}`, {
        x: curX + segW / 2, y: BY + BH / 2 + 5,
        "text-anchor": "middle", "font-size": 12, "font-weight": 700, fill: "white",
      }));
    }

    curX += segW;
  });
  svg.appendChild(g);

  // 外枠
  svg.appendChild(svgEl("rect", {
    x: BX, y: BY, width: BW, height: BH,
    rx: 6, fill: "none", stroke: "rgba(0,0,0,0.15)", "stroke-width": 1.5,
  }));

  // ブレース（下）
  const braceY = BY + BH + 8;
  svg.appendChild(svgEl("path", {
    d: `M ${BX} ${braceY} L ${BX} ${braceY + 4} L ${BX + BW} ${braceY + 4} L ${BX + BW} ${braceY}`,
    fill: "none", stroke: "#888", "stroke-width": 1.5,
  }));

  // 合計ラベル
  svg.appendChild(svgText(`${totalVal}${totalUnit}`, {
    x: BX + BW / 2, y: BY + BH + 22,
    "text-anchor": "middle", "font-size": 13, "font-weight": 700, fill: TEXT_COLOR,
  }));

  return svg;
}

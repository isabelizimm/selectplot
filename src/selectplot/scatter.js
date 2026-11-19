const NS = "http://www.w3.org/2000/svg";
const W = 600, H = 400, M = 40;
const COLOR = "#4c78a8", SELECTED = "#f58518";

function svgEl(tag, attrs, parent) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (parent) parent.appendChild(node);
  return node;
}

function extent(values) {
  const finite = values.filter(Number.isFinite);
  let lo = Math.min(...finite), hi = Math.max(...finite);
  if (!finite.length) [lo, hi] = [0, 1];
  if (lo === hi) [lo, hi] = [lo - 1, hi + 1];
  const pad = (hi - lo) * 0.05;
  return [lo - pad, hi + pad];
}

function fmt(v) {
  return Number(v.toPrecision(3)).toString();
}

function render({ model, el }) {
  const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}` });
  Object.assign(svg.style, { width: "100%", maxWidth: `${W}px`, cursor: "crosshair", userSelect: "none", background: "white" });
  el.appendChild(svg);
  const status = document.createElement("div");
  Object.assign(status.style, { font: "12px sans-serif", padding: "4px 0", color: "#555" });
  el.appendChild(status);

  let px = [], py = [], circles = [];
  const brush = svgEl("rect", { fill: SELECTED, "fill-opacity": 0.15, stroke: SELECTED, visibility: "hidden" });

  function draw() {
    svg.replaceChildren();
    const xs = model.get("x"), ys = model.get("y");
    const [x0, x1] = extent(xs), [y0, y1] = extent(ys);
    const sx = (v) => M + ((v - x0) / (x1 - x0)) * (W - 2 * M);
    const sy = (v) => H - M - ((v - y0) / (y1 - y0)) * (H - 2 * M);

    const axis = { stroke: "#999" };
    svgEl("line", { x1: M, y1: H - M, x2: W - M, y2: H - M, ...axis }, svg);
    svgEl("line", { x1: M, y1: M, x2: M, y2: H - M, ...axis }, svg);
    const label = { "font-size": 11, fill: "#555", "font-family": "sans-serif" };
    for (let i = 0; i <= 4; i++) {
      const xv = x0 + ((x1 - x0) * i) / 4, yv = y0 + ((y1 - y0) * i) / 4;
      svgEl("text", { x: sx(xv), y: H - M + 15, "text-anchor": "middle", ...label }, svg).textContent = fmt(xv);
      svgEl("text", { x: M - 5, y: sy(yv) + 4, "text-anchor": "end", ...label }, svg).textContent = fmt(yv);
    }

    px = xs.map(sx);
    py = ys.map(sy);
    circles = xs.map((_, i) =>
      Number.isFinite(px[i]) && Number.isFinite(py[i])
        ? svgEl("circle", { cx: px[i], cy: py[i], r: 4, "fill-opacity": 0.8 }, svg)
        : null
    );
    svg.appendChild(brush);
    highlight();
  }

  function highlight() {
    const selected = new Set(model.get("selected_indices"));
    circles.forEach((c, i) => c && c.setAttribute("fill", selected.has(i) ? SELECTED : COLOR));
  }

  function toSvg(evt) {
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  let start = null;
  function box(evt) {
    const p = toSvg(evt);
    return {
      x: Math.min(start.x, p.x), y: Math.min(start.y, p.y),
      width: Math.abs(p.x - start.x), height: Math.abs(p.y - start.y),
    };
  }

  svg.addEventListener("pointerdown", (evt) => {
    start = toSvg(evt);
    svg.setPointerCapture(evt.pointerId);
  });
  svg.addEventListener("pointermove", (evt) => {
    if (!start) return;
    const b = box(evt);
    for (const [k, v] of Object.entries(b)) brush.setAttribute(k, v);
    brush.setAttribute("visibility", "visible");
  });
  svg.addEventListener("pointerup", (evt) => {
    if (!start) return;
    const b = box(evt);
    start = null;
    brush.setAttribute("visibility", "hidden");
    // A plain click (no real drag) clears the selection.
    const picked = b.width < 3 && b.height < 3 ? [] : px.flatMap((x, i) =>
      x >= b.x && x <= b.x + b.width && py[i] >= b.y && py[i] <= b.y + b.height ? [i] : []
    );
    model.set("selected_indices", picked);
    model.save_changes();
    highlight();
  });

  const showMessage = () => (status.textContent = model.get("message"));
  model.on("change:x", draw);
  model.on("change:y", draw);
  model.on("change:selected_indices", highlight);
  model.on("change:message", showMessage);
  draw();
  showMessage();
}

export default { render };

//render the shapes on the canvas based on the placedShapes array and the current print settings
//shared utility used by both DrawingThumbnail.jsx and Print.jsx
import Shapes from "../shapes";

const HEART_PATH =
  "M12.8993 3.73386L11.9975 4.63704L11.0912 3.73167" +
  "C9.98254 2.62417 8.4789 2.00205 6.91108 2.00215" +
  "C5.34326 2.00226 3.8397 2.62458 2.73115 3.73221" +
  "C1.62261 4.83985 0.999897 6.34207 1 7.9084" +
  "C1.0001 9.47474 1.62302 10.9769 2.7317 12.0844" +
  "L11.4146 20.759C11.5692 20.9133 11.7789 21 11.9975 21" +
  "C12.216 21 12.4257 20.9133 12.5804 20.759" +
  "L21.2709 12.0822C22.3783 10.9744 23.0002 9.47282 23 7.90724" +
  "C22.9998 6.34166 22.3775 4.8402 21.2698 3.73276" +
  "C20.7203 3.18343 20.0679 2.74766 19.3498 2.45035" +
  "C18.6316 2.15303 17.8619 2 17.0846 2" +
  "C16.3072 2 15.5375 2.15303 14.8194 2.45035" +
  "C14.1012 2.74766 13.4488 3.18453 12.8993 3.73386Z";

/**
 * Compute pixel layout for a shape, applying the shrink gap.
 * Matches clickDrag's renderRegularShape exactly.
 */
function getShapeLayout(cellX, cellY, shapeInfo, CELL, cellSize, shrink) {
  const gap = CELL * (1 - shrink) / 2;
  const x = cellX * CELL + gap;
  const y = cellY * CELL + gap;
  const cellsWide = shapeInfo.width / cellSize;
  const cellsTall = shapeInfo.height / cellSize;
  let w = cellsWide * CELL * shrink;
  let h = cellsTall * CELL * shrink;
  if (cellsWide >= 2) w += gap * 2;
  if (cellsTall >= 2) h += gap * 2;
  const strokeWidth = shapeInfo.strokeWidth
    ? (shapeInfo.strokeWidth / cellSize) * CELL * shrink
    : undefined;
  return { x, y, w, h, strokeWidth };
}

/** Draw a single shape path onto ctx. */
function drawShapePath(ctx, params) {
  const { x, y, w, h, radius, rotation, shapeType, strokeWidth, originalW, originalH } = params;

  ctx.save();
  const pivotX = x + (originalW || w) / 2;
  const pivotY = y + (originalH || h) / 2;
  ctx.translate(pivotX, pivotY);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-pivotX, -pivotY);
  ctx.beginPath();

  if (shapeType === "circle") {
    const r = Math.min(w, h) / 2;
    ctx.arc(x + r, y + r, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  } else if (shapeType === "QuarterCircle") {
    ctx.moveTo(x, y);
    ctx.arc(x, y, w, 0, Math.PI / 2);
    ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fill();
  } else if (shapeType === "Arc") {
    const sw = strokeWidth || w;
    const r = w / 2 + sw / 2;
    ctx.arc(x, y, r, 0, Math.PI / 2);
    ctx.lineWidth = sw;
    ctx.strokeStyle = ctx.fillStyle;
    ctx.stroke();
  } else if (shapeType === "stripedRect") {
    const sw = w / 5;
    for (let i = 0; i < 3; i++) ctx.fillRect(x + sw * (i * 2), y, sw, h);
  } else if (shapeType === "stripedRect_2") {
    const sh = h / 5;
    for (let i = 0; i < 3; i++) ctx.fillRect(x, y + sh * (i * 2), w, sh);
  } else if (shapeType === "triangle") {
    ctx.moveTo(x + w, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.fill();
  } else if (shapeType === "heart") {
    ctx.translate(x, y);
    ctx.scale(w / 24, h / 24);
    ctx.fill(new Path2D(HEART_PATH));
  } else {
    ctx.roundRect(x, y, w, h, radius);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Render a full design onto an already-sized canvas context.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} canvasW  - canvas.width  in px
 * @param {number} canvasH  - canvas.height in px
 * @param {object} opts
 *   @param {number}   opts.CELL         - pixel size of one grid cell on this canvas
 *   @param {number}   opts.cellSize     - editor cell size (used to derive shape proportions)
 *   @param {object[]} opts.placedShapes
 *   @param {string}   opts.bgColor
 *   @param {string}   opts.blockColors
 *   @param {number}   opts.bleed
 *   @param {number}   opts.bleedOpacity
 *   @param {number}   opts.distress
 *   @param {number}   opts.grain
 *   @param {number}   [opts.shrink=0.9]
 */
export function renderDesign(ctx, canvasW, canvasH, opts) {
  const {
    CELL, cellSize, placedShapes,
    bgColor, blockColors,
    bleed, bleedOpacity, distress, grain,
    shrink = 0.9,
  } = opts;

  const shapes = Shapes(cellSize);

  // Build layout params for a shape
  function getParams(shape) {
    const shapeInfo = shapes[shape.type];
    if (!shapeInfo) return null;
    ctx.fillStyle = blockColors;
    const cellX = shape.cellX ?? (shape.x / cellSize);
    const cellY = shape.cellY ?? (shape.y / cellSize);
    const layout = getShapeLayout(cellX, cellY, shapeInfo, CELL, cellSize, shrink);
    return {
      ...layout,
      radius: shapeInfo.borderRadius,
      rotation: shape.rotation || 0,
      shapeType: shapeInfo.type,
    };
  }

  // 1. Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvasW, canvasH);

  // 2. Ink bleed (slightly larger, low opacity)
  if (bleed > 0) {
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = bleedOpacity;
    placedShapes.forEach((shape) => {
      const p = getParams(shape);
      if (!p) return;
      ctx.fillStyle = blockColors;
      drawShapePath(ctx, { ...p, w: p.w + bleed * 2, h: p.h + bleed * 2, originalW: p.w, originalH: p.h });
    });
    ctx.globalAlpha = 1.0;
  }

  // 3. Shapes (multiply for overlaps)
  ctx.globalCompositeOperation = "multiply";
  placedShapes.forEach((shape) => {
    const p = getParams(shape);
    if (p) drawShapePath(ctx, p);
  });
  ctx.globalCompositeOperation = "source-over";

  // 4. Distress — Perlin-like noise fades ink pixels toward background
  if (distress > 0) {
    const bgR = parseInt(bgColor.slice(1, 3), 16);
    const bgG = parseInt(bgColor.slice(3, 5), 16);
    const bgB = parseInt(bgColor.slice(5, 7), 16);
    const imageData = ctx.getImageData(0, 0, canvasW, canvasH);
    const d = imageData.data;

    const makeGrid = (s) => {
      const cols = Math.ceil(canvasW / s) + 2;
      const rows = Math.ceil(canvasH / s) + 2;
      return { data: Array.from({ length: rows * cols }, () => Math.random()), cols };
    };
    const lerp = (a, b, t) => a + (b - a) * t;
    const smoothstep = (t) => t * t * (3 - 2 * t);
    const sampleGrid = ({ data: g, cols }, s, px, py) => {
      const gx = px / s, gy = py / s;
      const ix = Math.floor(gx), iy = Math.floor(gy);
      const fx = smoothstep(gx - ix), fy = smoothstep(gy - iy);
      return lerp(
        lerp(g[iy * cols + ix] || 0, g[iy * cols + ix + 1] || 0, fx),
        lerp(g[(iy + 1) * cols + ix] || 0, g[(iy + 1) * cols + ix + 1] || 0, fx),
        fy
      );
    };

    const g1 = makeGrid(16), g2 = makeGrid(32), g3 = makeGrid(64);
    for (let py = 0; py < canvasH; py++) {
      for (let px = 0; px < canvasW; px++) {
        const i = (py * canvasW + px) * 4;
        if (d[i] === bgR && d[i + 1] === bgG && d[i + 2] === bgB) continue;
        const n = sampleGrid(g1, 16, px, py) * 0.5
                + sampleGrid(g2, 32, px, py) * 0.3
                + sampleGrid(g3, 64, px, py) * 0.2;
        if (n < distress) {
          const fade = n / distress;
          const lerp = (a, b, t) => a + (b - a) * t;
          d[i]     = Math.round(lerp(bgR, d[i], fade));
          d[i + 1] = Math.round(lerp(bgG, d[i + 1], fade));
          d[i + 2] = Math.round(lerp(bgB, d[i + 2], fade));
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  // 5. Grain noise — only on shape pixels
  if (grain > 0) {
    ctx.globalCompositeOperation = "multiply";
    const bgR = parseInt(bgColor.slice(1, 3), 16);
    const bgG = parseInt(bgColor.slice(3, 5), 16);
    const bgB = parseInt(bgColor.slice(5, 7), 16);
    const imageData = ctx.getImageData(0, 0, canvasW, canvasH);
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] === bgR && d[i + 1] === bgG && d[i + 2] === bgB) continue;
      if (Math.random() > 0.4) continue;
      const noise = (Math.random() - 0.5) * grain;
      d[i] += noise; d[i + 1] += noise; d[i + 2] += noise;
    }
    ctx.putImageData(imageData, 0, 0);
  }
}

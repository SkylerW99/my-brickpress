import React, { useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react';
import Shapes from './shapes';

// Renders a small thumbnail preview of a drawing using canvas (with print effects)
function DrawingThumbnail({ placedShapes, cellSize, thumbSize, printSettings }) {
  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const [resolvedSize, setResolvedSize] = useState(0);

  // Measure synchronously on first paint to avoid a 180→actual-size redraw flash
  useLayoutEffect(() => {
    if (thumbSize) {
      setResolvedSize(thumbSize);
      return;
    }
    const el = wrapperRef.current;
    if (!el) return;
    setResolvedSize(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([entry]) => {
      setResolvedSize(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [thumbSize]);

  const grain        = printSettings?.grain        ?? 50;
  const bleed        = printSettings?.bleed        ?? 1.5;
  const bleedOpacity = printSettings?.bleedOpacity ?? 0.15;
  const distress     = printSettings?.distress     ?? 0.3;
  const bgColor      = printSettings?.bgColor      ?? '#f5f2eb';
  const blockColors  = printSettings?.blockColors  ?? '#c9a84e';

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || resolvedSize === 0) return;

    const size = resolvedSize * (window.devicePixelRatio || 1);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const CELL = size / 16;
    const shapes = Shapes(cellSize);

    // 1. Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);

    function getShapeParams(shape) {
      const shapeInfo = shapes[shape.type];
      if (!shapeInfo) return null;
      ctx.fillStyle = blockColors;
      const cellX = shape.cellX ?? (shape.x / cellSize);
      const cellY = shape.cellY ?? (shape.y / cellSize);
      const x = cellX * CELL;
      const y = cellY * CELL;
      const w = (shapeInfo.width / cellSize) * CELL;
      const h = (shapeInfo.height / cellSize) * CELL;
      return { x, y, w, h, radius: shapeInfo.borderRadius, rotation: shape.rotation || 0, shapeType: shapeInfo.type, strokeWidth: shapeInfo.strokeWidth };
    }

    function drawShapePath(params) {
      const { x, y, w, h, radius, rotation, shapeType, strokeWidth, originalW, originalH } = params;
      ctx.save();
      const pivotX = x + (originalW || w) / 2;
      const pivotY = y + (originalH || h) / 2;
      ctx.translate(pivotX, pivotY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-pivotX, -pivotY);
      ctx.beginPath();

      if (shapeType === 'circle') {
        const r = Math.min(w, h) / 2;
        ctx.arc(x + r, y + r, r, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      } else if (shapeType === 'QuarterCircle') {
        ctx.moveTo(x, y);
        ctx.arc(x, y, w, 0, Math.PI / 2);
        ctx.lineTo(x, y);
        ctx.closePath();
        ctx.fill();
      } else if (shapeType === 'Arc') {
        const strokeW = (strokeWidth || CELL);
        const r = w / 2 + strokeW / 2;
        ctx.arc(x, y, r, 0, Math.PI / 2);
        ctx.lineWidth = strokeW;
        ctx.strokeStyle = blockColors;
        ctx.stroke();
      } else if (shapeType === 'stripedRect') {
        const sw = w / 5;
        for (let i = 0; i < 3; i++) ctx.fillRect(x + sw * (i * 2), y, sw, h);
      } else if (shapeType === 'stripedRect_2') {
        const sh = h / 5;
        for (let i = 0; i < 3; i++) ctx.fillRect(x, y + sh * (i * 2), w, sh);
      } else if (shapeType === 'heart') {
        const heartPath = new Path2D(
          'M12.8993 3.73386L11.9975 4.63704L11.0912 3.73167' +
          'C9.98254 2.62417 8.4789 2.00205 6.91108 2.00215' +
          'C5.34326 2.00226 3.8397 2.62458 2.73115 3.73221' +
          'C1.62261 4.83985 0.999897 6.34207 1 7.9084' +
          'C1.0001 9.47474 1.62302 10.9769 2.7317 12.0844' +
          'L11.4146 20.759C11.5692 20.9133 11.7789 21 11.9975 21' +
          'C12.216 21 12.4257 20.9133 12.5804 20.759' +
          'L21.2709 12.0822C22.3783 10.9744 23.0002 9.47282 23 7.90724' +
          'C22.9998 6.34166 22.3775 4.8402 21.2698 3.73276' +
          'C20.7203 3.18343 20.0679 2.74766 19.3498 2.45035' +
          'C18.6316 2.15303 17.8619 2 17.0846 2' +
          'C16.3072 2 15.5375 2.15303 14.8194 2.45035' +
          'C14.1012 2.74766 13.4488 3.18453 12.8993 3.73386Z'
        );
        ctx.translate(x, y);
        ctx.scale(w / 24, h / 24);
        ctx.fill(heartPath);
      } else {
        ctx.roundRect(x, y, w, h, radius);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // 2. Ink bleed
    if (bleed > 0) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = bleedOpacity;
      placedShapes.forEach((shape) => {
        const p = getShapeParams(shape);
        if (!p) return;
        drawShapePath({ ...p, w: p.w + bleed * 2, h: p.h + bleed * 2, originalW: p.w, originalH: p.h });
      });
      ctx.globalAlpha = 1.0;
    }

    // 3. Shapes
    ctx.globalCompositeOperation = 'multiply';
    placedShapes.forEach((shape) => {
      const p = getShapeParams(shape);
      if (p) drawShapePath(p);
    });
    ctx.globalCompositeOperation = 'source-over';

    // 4. Distress
    if (distress > 0) {
      const bgR = parseInt(bgColor.slice(1, 3), 16);
      const bgG = parseInt(bgColor.slice(3, 5), 16);
      const bgB = parseInt(bgColor.slice(5, 7), 16);
      const imageData = ctx.getImageData(0, 0, size, size);
      const d = imageData.data;

      const makeGrid = (s) => {
        const cols = Math.ceil(size / s) + 2;
        const rows = Math.ceil(size / s) + 2;
        const g = Array.from({ length: rows * cols }, () => Math.random());
        return { data: g, cols };
      };
      const lerp = (a, b, t) => a + (b - a) * t;
      const smoothstep = (t) => t * t * (3 - 2 * t);
      const sampleGrid = (grid, s, px, py) => {
        const gx = px / s; const gy = py / s;
        const ix = Math.floor(gx); const iy = Math.floor(gy);
        const fx = smoothstep(gx - ix); const fy = smoothstep(gy - iy);
        const { data: g, cols } = grid;
        return lerp(lerp(g[iy * cols + ix] || 0, g[iy * cols + ix + 1] || 0, fx), lerp(g[(iy + 1) * cols + ix] || 0, g[(iy + 1) * cols + ix + 1] || 0, fx), fy);
      };
      const g1 = makeGrid(16); const g2 = makeGrid(32); const g3 = makeGrid(64);
      for (let py = 0; py < size; py++) {
        for (let px = 0; px < size; px++) {
          const i = (py * size + px) * 4;
          if (d[i] === bgR && d[i + 1] === bgG && d[i + 2] === bgB) continue;
          const n = sampleGrid(g1, 16, px, py) * 0.5 + sampleGrid(g2, 32, px, py) * 0.3 + sampleGrid(g3, 64, px, py) * 0.2;
          if (n < distress) {
            const fade = n / distress;
            d[i]     = Math.round(lerp(bgR, d[i], fade));
            d[i + 1] = Math.round(lerp(bgG, d[i + 1], fade));
            d[i + 2] = Math.round(lerp(bgB, d[i + 2], fade));
          }
        }
      }
      ctx.putImageData(imageData, 0, 0);
    }

    // 5. Grain
    if (grain > 0) {
      ctx.globalCompositeOperation = 'multiply';
      const bgR = parseInt(bgColor.slice(1, 3), 16);
      const bgG = parseInt(bgColor.slice(3, 5), 16);
      const bgB = parseInt(bgColor.slice(5, 7), 16);
      const imageData = ctx.getImageData(0, 0, size, size);
      const d = imageData.data;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] === bgR && d[i + 1] === bgG && d[i + 2] === bgB) continue;
        if (Math.random() > 0.4) continue;
        const noise = (Math.random() - 0.5) * grain;
        d[i] += noise; d[i + 1] += noise; d[i + 2] += noise;
      }
      ctx.putImageData(imageData, 0, 0);
    }
  }, [placedShapes, cellSize, resolvedSize, grain, bleed, bleedOpacity, distress, bgColor, blockColors]);

  useEffect(() => {
    const timer = setTimeout(renderCanvas, 80);
    return () => clearTimeout(timer);
  }, [renderCanvas]);

  const size = thumbSize || '100%';

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'relative',
        width: size,
        aspectRatio: '1 / 1',
        height: thumbSize || undefined,
        borderRadius: 8,
        overflow: 'hidden',
        border: '1.5px solid var(--border-light)',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
}

export default DrawingThumbnail;

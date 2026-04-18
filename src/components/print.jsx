import React, { useState, useRef, useCallback, useEffect } from "react";
import Shapes from "./shapes";

function Print({ placedShapes, cellSize }) {
  const [showPreview, setShowPreview] = useState(false);
  const [grain, setGrain] = useState(50);
  const [bleed, setBleed] = useState(1.5);
  const [bleedOpacity, setBleedOpacity] = useState(0.15);
  const [bgColor, setBgColor] = useState("#ffd7d7");
  const [blockColors, setBlockColors] = useState("#667eea");
  const canvasRef = useRef(null);
  const colorRef = useRef(null);
  const blockColorRef = useRef(null);

  // Renders the design onto the canvas with current effect settings
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const size = 512;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const CELL = size / 16;
    const shapes = Shapes(cellSize);

    // 1. Draw background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);

    //define the shapes parameters
    function drawShapes(shape) {
        const shapeInfo = shapes[shape.type];
        ctx.fillStyle = blockColors;
        const x = (shape.x / cellSize) * CELL;
        const y = (shape.y / cellSize) * CELL;
        const w = (shapeInfo.width / cellSize) * CELL;
        const h = (shapeInfo.height / cellSize) * CELL;
        const radius = shapeInfo.borderRadius;
        const rotation = shape.rotation || 0;
        const shapeType = shapeInfo.type; //fix the shape type issue
        return { x, y, w, h, radius, rotation, shapeType };
      };

    // draw the shape path based on its type and parameters
    function drawShapePath(params) {
      const { x, y, w, h, radius, rotation, shapeType, originalW, originalH } = params;

      ctx.save();

      // Always rotate around the ORIGINAL shape's center
      // so bleed and shape share the same pivot
      const pivotX = x + (originalW || w) / 2;
      const pivotY = y + (originalH || h) / 2;

      ctx.translate(pivotX, pivotY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-pivotX, -pivotY);

      ctx.beginPath();
      if (shapeType === "QuarterCircle") {
        const r = w;
        ctx.moveTo(x, y);
        ctx.arc(x, y, r, 0, Math.PI / 2);
        ctx.lineTo(x, y);
        ctx.closePath();
        ctx.fill();
      } else if (shapeType === "Arc") {
        // Draw an arc stroke, not a filled shape
        const r = w / 2 + (params.strokeWidth || CELL) / 2; // radius plus half stroke for proper sizing
        const strokeW = (params.strokeWidth || CELL);
        ctx.arc(x, y, r, 0, Math.PI /2);
        ctx.lineWidth = strokeW;
        ctx.strokeStyle = ctx.fillStyle;
        ctx.stroke();
      } else if (shapeType === "stripedRect") {
        // 3 vertical stripes each w/5 wide, with w/5 gaps
        const stripeW = w / 5;
        for (let i = 0; i < 3; i++) {
          ctx.fillRect(x + stripeW * (i * 2), y, stripeW, h);
        }
      } else if (shapeType === "stripedRect_2") {
        // 3 horizontal stripes each h/5 tall, with h/5 gaps
        const stripeH = h / 5;
        for (let i = 0; i < 3; i++) {
          ctx.fillRect(x, y + stripeH * (i * 2), w, stripeH);
        }
      } else if (shapeInfo.type === "heart") {
        // Heart SVG path defined in a 24x24 viewBox — scale to target w × h
        const heartPath = new Path2D(
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
          "C14.1012 2.74766 13.4488 3.18453 12.8993 3.73386Z"
        );
        ctx.translate(x, y);
        ctx.scale(w / 24, h / 24);
        ctx.fill(heartPath);
      } else {
        //draw regular shapes (square, rectangle, large square)
        ctx.roundRect(x, y, w, h, radius);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }

    // 2. Draw ink bleed (slightly larger, low opacity)
    if (bleed > 0) {
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = bleedOpacity;
      placedShapes.forEach((shape) => {
        const params = drawShapes(shape);
        console.log("Drawing bleed for shape with params:", params);
        // offset for bleed
          drawShapePath({
            ...params,
            x: params.x,
            y: params.y,
            w: params.w + bleed * 2,
            h: params.h + bleed * 2,
            originalW: params.w,   // pass original size for pivot calc
            originalH: params.h,
          })
        });

      ctx.globalAlpha = 1.0;
    }

    // 3. Draw shapes with multiply blend for overlaps
    ctx.globalCompositeOperation = "multiply";
    placedShapes.forEach((shape) => {
      const params = drawShapes(shape);
      drawShapePath(params);
    });
    ctx.globalCompositeOperation = "source-over";

    // 4. Grain noise — only on shape pixels, not background
    if (grain > 0) {
      // Parse background color to RGB
      ctx.globalCompositeOperation = "multiply";
      const bgR = parseInt(bgColor.slice(1, 3), 16);
      const bgG = parseInt(bgColor.slice(3, 5), 16);
      const bgB = parseInt(bgColor.slice(5, 7), 16);

      const imageData = ctx.getImageData(0, 0, size, size);
      const d = imageData.data;
      for (let i = 0; i < d.length; i += 4) {
        // Skip if this pixel matches the background color
        if (d[i] === bgR && d[i + 1] === bgG && d[i + 2] === bgB) continue;
        if (Math.random() > 0.4) continue;
        const noise = (Math.random()-0.5) * grain;
        d[i] += noise;
        d[i + 1] += noise;
        d[i + 2] += noise;
      }
      ctx.putImageData(imageData, 0, 0);
    }
  }, [placedShapes, cellSize, grain, bleed, bleedOpacity, bgColor, blockColors]);

  // Re-render whenever settings change
  useEffect(() => {
    if (showPreview) renderCanvas();
  }, [showPreview, renderCanvas]);

  // Native 'change' event for background color
  useEffect(() => {
    const el = colorRef.current;
    if (!el) return;
    const handleChange = (e) => setBgColor(e.target.value);
    el.addEventListener("change", handleChange);
    return () => el.removeEventListener("change", handleChange);
  }, [showPreview]);

  // Native 'change' event for block color
  useEffect(() => {
    const el = blockColorRef.current;
    if (!el) return;
    const handleChange = (e) => setBlockColors(e.target.value);
    el.addEventListener("change", handleChange);
    return () => el.removeEventListener("change", handleChange);
  }, [showPreview]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "my-lego-design.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <>
      <button className="button" onClick={() => setShowPreview(true)}>
        Finish
      </button>

      {showPreview && (
        <div className="preview-overlay" onClick={() => setShowPreview(false)}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 12px" }}>Preview &amp; Adjust</h3>

            <canvas
              ref={canvasRef}
              style={{ width: 600, height: 600, borderRadius: 8, border: "1px solid #444" }}
            />

            <div className="preview-controls">
              <label>
                Grain: {grain}
                <input
                  type="range" min="0" max="150" value={grain}
                  onChange={(e) => setGrain(Number(e.target.value))}
                />
              </label>

              <label>
                Ink Bleed: {bleed.toFixed(1)}px
                <input
                  type="range" min="0" max="6" step="0.5" value={bleed}
                  onChange={(e) => setBleed(Number(e.target.value))}
                />
              </label>

              <label>
                Bleed Opacity: {(bleedOpacity * 100).toFixed(0)}%
                <input
                  type="range" min="0" max="0.5" step="0.05" value={bleedOpacity}
                  onChange={(e) => setBleedOpacity(Number(e.target.value))}
                />
              </label>

                <label>
                background color
                <input
                  type="color" value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  style={{ marginLeft: 8, width: 40, height: 30, cursor: "pointer", border: "none" }}
                />
              </label>

                <label>
                Block color
                <input
                  type="color" value={blockColors}
                  onChange={(e) => setBlockColors(e.target.value)}
                  style={{ marginLeft: 8, width: 40, height: 30, cursor: "pointer", border: "none" }}
                />
              </label>

            </div>

            <div className="preview-buttons">
              <button className="button" onClick={handleDownload}>
                Download
              </button>
              <button className="button" onClick={() => setShowPreview(false)} style={{ backgroundColor: "#666" }}>
                Back
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Print;

import React, { useState, useRef, useCallback, useEffect } from "react";
import { renderDesign } from "./canvasRenderer";

function Print({ placedShapes, cellSize, numRow, printSettings, aspectRatio, onSettingsChange}) {
  const [grain, setGrain] = useState(printSettings?.grain ?? 50);
  const [bleed, setBleed] = useState(printSettings?.bleed ?? 1.5);
  const [bleedOpacity, setBleedOpacity] = useState(printSettings?.bleedOpacity ?? 0.15);
  const [distress, setDistress] = useState(printSettings?.distress ?? 0.3);
  const [bgColor, setBgColor] = useState(printSettings?.bgColor ?? "#f5f2eb");
  const [blockColors, setBlockColors] = useState(printSettings?.blockColors ?? "#c9a84e");

  // Notify parent whenever any setting changes
  useEffect(() => {
    if (onSettingsChange) {
      onSettingsChange({ grain, bleed, bleedOpacity, distress, bgColor, blockColors });
    }
  }, [grain, bleed, bleedOpacity, distress, bgColor, blockColors]);
  const canvasRef = useRef(null);
  const renderTimeoutRef = useRef(null);

  // Renders the design onto the canvas with current effect settings
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const size = 1080;
    // aspectRatio.value is a string like "6 / 4" — parse it into "6" and "4"
    //const [arW, arH] = aspectRatio.value.split('/').map(Number); 
    const numCol = aspectRatio.value === "1 / 1" ? numRow : aspectRatio.value === "4 / 6" ? Math.floor(numRow / 6 * 4) : Math.floor(numRow / 4 * 6);
    let CELL;
    if (aspectRatio.value === "6 / 4" || aspectRatio.value === "1 / 1") {
      canvas.width = size;
      CELL = size / numCol;
      canvas.height = CELL * numRow; 
    } else {
      canvas.height = size;
      CELL = size / numRow;
      canvas.width = CELL * numCol; 
    }
    const ctx = canvas.getContext("2d");

    renderDesign(ctx, canvas.width, canvas.height, {
      CELL, cellSize, placedShapes,
      bgColor, blockColors,
      bleed, bleedOpacity, distress, grain,
    });
  }, [placedShapes, aspectRatio,cellSize, grain, bleed, bleedOpacity, distress, bgColor, blockColors]);

  // Debounced re-render: fires ~120ms after the last change to stay smooth during drags
  useEffect(() => {
    if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
    renderTimeoutRef.current = setTimeout(() => {
      renderCanvas();
    }, 120);
    return () => clearTimeout(renderTimeoutRef.current);
  }, [renderCanvas]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "my-brickpress-design.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="print-panel animate-in animate-in-delay-1">
      <h3 className="print-panel-title">Live Preview</h3>

      
      <canvas
        ref={canvasRef}
        className="print-canvas"
      />

      <div className="print-controls">
        <div className="control-section">
          <span className="control-section-label">Colors</span>
          <label>
            Background
            <input
              type="color" value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
            />
          </label>
          <label>
            Block Ink
            <input
              type="color" value={blockColors}
              onChange={(e) => setBlockColors(e.target.value)}
            />
          </label>
        </div>

        <div className="control-section">
          <span className="control-section-label">Print Effects</span>
          <label>
            <span className="control-label-text">Grain <span className="control-value">{grain}</span></span>
            <input
              type="range" min="0" max="150" value={grain}
              onChange={(e) => setGrain(Number(e.target.value))}
            />
          </label>

          <label>
            <span className="control-label-text">Ink Bleed <span className="control-value">{bleed.toFixed(1)}px</span></span>
            <input
              type="range" min="0" max="6" step="0.5" value={bleed}
              onChange={(e) => setBleed(Number(e.target.value))}
            />
          </label>

          <label>
            <span className="control-label-text">Bleed Opacity <span className="control-value">{(bleedOpacity * 100).toFixed(0)}%</span></span>
            <input
              type="range" min="0" max="0.5" step="0.05" value={bleedOpacity}
              onChange={(e) => setBleedOpacity(Number(e.target.value))}
            />
          </label>

          <label>
            <span className="control-label-text">Distress <span className="control-value">{(distress * 100).toFixed(0)}%</span></span>
            <input
              type="range" min="0" max="0.8" step="0.05" value={distress}
              onChange={(e) => setDistress(Number(e.target.value))}
            />
          </label>
        </div>
      </div>

      <button className="button download-btn" onClick={handleDownload}>
        ⬇ Download PNG
      </button>
    </div>
  );
}

export default Print;

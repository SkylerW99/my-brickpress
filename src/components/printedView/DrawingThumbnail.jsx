import React, { useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { renderDesign } from './canvasRenderer';

// Renders a small thumbnail preview of a drawing using canvas (with print effects)
function DrawingThumbnail({ placedShapes, cellSize, gridNumber, thumbSize, aspectRatio,printSettings }) {
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
    canvas.height = size // aspectRatio.value.split('/').map(Number).reduce((a, b) => a / b);
    const ctx = canvas.getContext('2d');
    const CELL = size / gridNumber;

    renderDesign(ctx, size, size, {
      CELL, cellSize, placedShapes,
      bgColor, blockColors,
      bleed, bleedOpacity, distress, grain,
    });
  }, [placedShapes, cellSize, resolvedSize, gridNumber, grain, bleed, bleedOpacity, distress, bgColor, blockColors]);

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
        aspectRatio: (aspectRatio?.value) || '1 / 1',
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

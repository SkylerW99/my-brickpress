import React from 'react';
import Shapes from './shapes';

// Renders a small thumbnail preview of a drawing
function DrawingThumbnail({ placedShapes, cellSize, thumbSize = 180 }) {
  const THUMB_CELL = thumbSize / 16;
  const scale = THUMB_CELL / cellSize;
  const shapes = Shapes(cellSize);

  const renderThumbShape = (pos, index) => {
    const shapeInfo = shapes[pos.type];
    if (!shapeInfo) return null;

    const x = pos.x * scale;
    const y = pos.y * scale;
    const w = shapeInfo.width * scale;
    const h = shapeInfo.height * scale;
    const rotation = pos.rotation || 0;

    const isSpecial = ["Arc", "heart", "stripedRect", "stripedRect_2"].includes(shapeInfo.type);

    return (
      <div
        key={index}
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: w,
          height: h,
          borderRadius: shapeInfo.type === "Arc" ? 0
            : shapeInfo.type === "QuarterCircle" ? "0 0% 100% 0%"
            : typeof shapeInfo.borderRadius === 'number' ? shapeInfo.borderRadius * scale : shapeInfo.borderRadius,
          backgroundColor: isSpecial ? 'transparent' : '#8898e2',
          transform: `rotate(${rotation}deg)`,
          transformOrigin: 'center center',
        }}
      >
        {shapeInfo.type === "Arc" && (() => {
          const strokeW = (shapeInfo.strokeWidth || cellSize) * scale;
          const r = w - strokeW / 2;
          return (
            <svg width={w} height={h} style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}>
              <path
                d={`M ${w - strokeW / 2} 0 A ${r} ${r} 0 0 1 0 ${h - strokeW / 2}`}
                fill="none"
                stroke="#8898e2"
                strokeWidth={strokeW}
              />
            </svg>
          );
        })()}
        {shapeInfo.type === "heart" && (
          <svg width={w} height={h} viewBox="0 0 24 24" style={{ background: 'transparent' }} fill="none">
            <path
              d="M12.8993 3.73386L11.9975 4.63704L11.0912 3.73167C9.98254 2.62417 8.4789 2.00205 6.91108 2.00215C5.34326 2.00226 3.8397 2.62458 2.73115 3.73221C1.62261 4.83985 0.999897 6.34207 1 7.9084C1.0001 9.47474 1.62302 10.9769 2.7317 12.0844L11.4146 20.759C11.5692 20.9133 11.7789 21 11.9975 21C12.216 21 12.4257 20.9133 12.5804 20.759L21.2709 12.0822C22.3783 10.9744 23.0002 9.47282 23 7.90724C22.9998 6.34166 22.3775 4.8402 21.2698 3.73276C20.7203 3.18343 20.0679 2.74766 19.3498 2.45035C18.6316 2.15303 17.8619 2 17.0846 2C16.3072 2 15.5375 2.15303 14.8194 2.45035C14.1012 2.74766 13.4488 3.18453 12.8993 3.73386Z"
              fill="#8898e2"
            />
          </svg>
        )}
        {shapeInfo.type === "stripedRect" && (() => {
          const stripeW = w / 5;
          return (
            <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: 'absolute', top: 0, left: 0 }}>
              <rect x={0} y={0} width={stripeW} height={h} fill="#8898e2" />
              <rect x={stripeW * 2} y={0} width={stripeW} height={h} fill="#8898e2" />
              <rect x={stripeW * 4} y={0} width={stripeW} height={h} fill="#8898e2" />
            </svg>
          );
        })()}
        {shapeInfo.type === "stripedRect_2" && (() => {
          const stripeH = h / 5;
          return (
            <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: 'absolute', top: 0, left: 0 }}>
              <rect x={0} y={0} width={w} height={stripeH} fill="#8898e2" />
              <rect x={0} y={stripeH * 2} width={w} height={stripeH} fill="#8898e2" />
              <rect x={0} y={stripeH * 4} width={w} height={stripeH} fill="#8898e2" />
            </svg>
          );
        })()}
      </div>
    );
  };

  return (
    <div
      style={{
        position: 'relative',
        width: thumbSize,
        height: thumbSize,
        backgroundColor: 'var(--surface-canvas)',
        borderRadius: 8,
        overflow: 'hidden',
        border: '1.5px solid var(--border-light)',
        backgroundSize: `${THUMB_CELL}px ${THUMB_CELL}px`,
        backgroundImage:
          'linear-gradient(to right, rgba(58,37,20,0.06) 1px, transparent 1px),' +
          'linear-gradient(to bottom, rgba(58,37,20,0.06) 1px, transparent 1px)',
      }}
    >
      {placedShapes.map((pos, i) => renderThumbShape(pos, i))}
    </div>
  );
}

export default DrawingThumbnail;

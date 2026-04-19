import React, { useRef, useState, useEffect, useCallback } from "react";
import Shapes from "./shapes";

const ClickDrag = ({
  placedShapes,
  setPlacedShapes,
  cellSize,
  setCellSize,
  blockColor,
}) => {
  // --- Single shape drag state ---
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [shapeType, setShapeType] = useState(0);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [mouseMoved, setMouseMoved] = useState(false);
  const [showSettings, setShowSettings] = useState(null);

  // --- Multi-select / marquee state ---
  const [selectedIndices, setSelectedIndices] = useState(new Set());
  const [marquee, setMarquee] = useState(null); // { startX, startY, endX, endY } canvas-relative
  const [isGroupDragging, setIsGroupDragging] = useState(false);
  const [groupDragStart, setGroupDragStart] = useState({ x: 0, y: 0 });
  const [groupDragOriginals, setGroupDragOriginals] = useState([]);

  const spawnShapes = Shapes(20);
  const shapes = Shapes(cellSize);

  const canvasRef = useRef(null);
  const prevCellSizeRef = useRef(cellSize);

  // Recalculate cellSize whenever the canvas element resizes (window resize, layout shift, etc.)
  // and rescale all placed shapes so they stay snapped to the new grid
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const borderWidth = 2;
    const recalc = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0) {
        const newCellSize = (rect.width - borderWidth * 2) / 16;
        const oldCellSize = prevCellSizeRef.current;

        if (oldCellSize > 0 && Math.abs(newCellSize - oldCellSize) > 0.5) {
          const scale = newCellSize / oldCellSize;
          setPlacedShapes((prev) =>
            prev.map((s) => ({
              ...s,
              x: Math.round((s.x * scale) / newCellSize) * newCellSize,
              y: Math.round((s.y * scale) / newCellSize) * newCellSize,
            }))
          );
        }

        prevCellSizeRef.current = newCellSize;
        setCellSize(newCellSize);
      }
    };

    // Initial calculation
    recalc();

    const ro = new ResizeObserver(recalc);
    ro.observe(el);
    return () => ro.disconnect();
  }, [setCellSize, setPlacedShapes]);

  // --- Helper: check if two axis-aligned rects overlap ---
  const rectsOverlap = (a, b) =>
    a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

  // --- Normalise marquee coords (user can drag in any direction) ---
  const normaliseRect = (m) => ({
    left: Math.min(m.startX, m.endX),
    top: Math.min(m.startY, m.endY),
    right: Math.max(m.startX, m.endX),
    bottom: Math.max(m.startY, m.endY),
  });

  // --- Mouse-down on a shape (palette or placed) ---
  const handleMouseDown = (e, index, shapeTypeIndex) => {
    e.stopPropagation(); // don't trigger canvas marquee
    e.preventDefault();  // prevent text-select while dragging
    setMouseMoved(false);
    setShowSettings(null);

    // If the shape is part of the current multi-selection → start group drag
    if (index !== undefined && selectedIndices.has(index)) {
      setIsGroupDragging(true);
      setGroupDragStart({ x: e.clientX, y: e.clientY });
      // Snapshot the original positions of every selected shape
      setGroupDragOriginals(
        placedShapes.map((s, i) =>
          selectedIndices.has(i) ? { x: s.x, y: s.y } : null
        )
      );
      return;
    }

    // Otherwise clear multi-selection and do a normal single-shape drag
    setSelectedIndices(new Set());
    setIsDragging(true);
    setShapeType(shapeTypeIndex);

    if (index !== undefined) {
      setDraggingIndex(index);
      setOffset({
        x: e.clientX - placedShapes[index].x,
        y: e.clientY - placedShapes[index].y,
      });
    } else {
      setDraggingIndex(null);
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      const shapeInfo = shapes[shapeTypeIndex];
      if (canvasRect) {
        setOffset({
          x: canvasRect.left + shapeInfo.width / 2,
          y: canvasRect.top + shapeInfo.height / 2,
        });
      }
    }
  };

  // --- Mouse-down on the canvas background → start marquee ---
  const handleCanvasMouseDown = (e) => {
    // Only trigger on the canvas/inner background, not on shapes or buttons
    if (e.target.closest('.shapes') || e.target.closest('.shape-action-btn')) return;

    setShowSettings(null);
    // Don't clear selection here — it will be replaced by the new marquee result on mouseUp,
    // or cleared by a plain click via the wrapper onClick handler.

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMarquee({ startX: x, startY: y, endX: x, endY: y });
    setMouseMoved(false);
  };

  // --- Mouse move: handle marquee, group drag, or single drag ---
  const handleMouseMove = (e) => {
    setMouseMoved(true);

    // Marquee selection
    if (marquee && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setMarquee((prev) => ({
        ...prev,
        endX: e.clientX - rect.left,
        endY: e.clientY - rect.top,
      }));
      return;
    }

    // Group drag
    if (isGroupDragging && canvasRef.current) {
      const dx = e.clientX - groupDragStart.x;
      const dy = e.clientY - groupDragStart.y;
      // Snap delta to grid
      const snappedDx = Math.round(dx / cellSize) * cellSize;
      const snappedDy = Math.round(dy / cellSize) * cellSize;

      const rect = canvasRef.current.getBoundingClientRect();
      setPlacedShapes((prev) =>
        prev.map((s, i) => {
          if (!selectedIndices.has(i) || !groupDragOriginals[i]) return s;
          let newX = groupDragOriginals[i].x + snappedDx;
          let newY = groupDragOriginals[i].y + snappedDy;
          // Constrain within canvas
          newX = Math.max(0, Math.min(newX, rect.width - cellSize));
          newY = Math.max(0, Math.min(newY, rect.height - cellSize));
          return { ...s, x: newX, y: newY };
        })
      );
      return;
    }

    // Single shape drag (existing logic)
    if (isDragging && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const borderWidth = 2;
      setCellSize((rect.width - borderWidth * 2) / 16);

      let newX = e.clientX - offset.x;
      let newY = e.clientY - offset.y;
      newX = Math.round(newX / cellSize) * cellSize;
      newY = Math.round(newY / cellSize) * cellSize;
      newX = Math.max(0, Math.min(newX, rect.width - cellSize));
      newY = Math.max(0, Math.min(newY, rect.height - cellSize));

      if (draggingIndex === null) {
        setPlacedShapes((prev) => [
          ...prev,
          { x: newX, y: newY, type: shapeType, rotation: 0 },
        ]);
        setDraggingIndex(placedShapes.length);
      } else {
        setPlacedShapes((prev) =>
          prev.map((pos, index) =>
            index === draggingIndex ? { ...pos, x: newX, y: newY } : pos
          )
        );
      }
    }
  };

  // --- Mouse up: finalise marquee selection, or end drags ---
  const handleMouseUp = () => {
    // Finalise marquee → compute which shapes fall inside the rect
    if (marquee && canvasRef.current) {
      const sel = normaliseRect(marquee);
      const marqueW = Math.abs(sel.right - sel.left);
      const marqueH = Math.abs(sel.bottom - sel.top);

      // Only select if the user actually dragged a meaningful area (> 4px)
      if (marqueW > 4 || marqueH > 4) {
        const hits = new Set();
        placedShapes.forEach((pos, i) => {
          const info = shapes[pos.type];
          const shapeRect = {
            left: pos.x,
            top: pos.y,
            right: pos.x + info.width,
            bottom: pos.y + info.height,
          };
          if (rectsOverlap(sel, shapeRect)) hits.add(i);
        });
        setSelectedIndices(hits);
      } else {
        // Tiny marquee = plain click on empty space → clear selection
        setSelectedIndices(new Set());
        setShowSettings(null);
      }
      setMarquee(null);
      return;
    }

    setIsDragging(false);
    setIsGroupDragging(false);
  };

  const handleClick = () => {
    if (!mouseMoved && draggingIndex !== null) {
      setShowSettings(draggingIndex);
    } else {
      setShowSettings(null);
    }
  };

  // Remove shape — works for single or deletes all selected
  const removeShape = () => {
    if (selectedIndices.size > 0) {
      setPlacedShapes((prev) => prev.filter((_, i) => !selectedIndices.has(i)));
      setSelectedIndices(new Set());
    } else {
      setPlacedShapes((prev) => prev.filter((_, i) => i !== showSettings));
    }
    setShowSettings(null);
  };

  // Duplicate all selected shapes, placed to the right of the selection
  const duplicateSelected = () => {
    if (selectedIndices.size === 0) return;

    // Find the bounding box of the selection
    let minX = Infinity, maxRight = -Infinity;
    placedShapes.forEach((s, i) => {
      if (!selectedIndices.has(i)) return;
      const info = shapes[s.type];
      if (s.x < minX) minX = s.x;
      if (s.x + info.width > maxRight) maxRight = s.x + info.width;
    });
    // Offset = place copies so their left edge starts one cell after the selection's right edge
    const offsetX = maxRight - minX + cellSize;

    const copies = [];
    placedShapes.forEach((s, i) => {
      if (selectedIndices.has(i)) {
        copies.push({ ...s, x: s.x + offsetX });
      }
    });
    setPlacedShapes((prev) => {
      const next = [...prev, ...copies];
      const newIndices = new Set();
      for (let j = prev.length; j < next.length; j++) newIndices.add(j);
      setTimeout(() => setSelectedIndices(newIndices), 0);
      return next;
    });
  };

  //rotate shape — use showSettings so we rotate the shape whose menu is open
  const rotateShape = () => {
    setPlacedShapes((prev) =>
      prev.map((pos, index) =>
        index === showSettings
          ? { ...pos, rotation: ((pos.rotation || 0) + 90) % 360 }
          : pos,
      ),
    );
  };

    // Helper component for rendering the SVG content of special shapes like Arc and heart
  const renderShapeContent = (shapeInfo, size) => {
    // For Arc type
    if (shapeInfo.type === "Arc") {
      // Replace fill="#8898e2" and stroke="#8898e2" with:
      // fill={blockColor} and stroke={blockColor}
      return (
        <svg width={size.width} height={size.height} viewBox={`0 0 ${size.width} ${size.height}`} style={{ position: 'absolute', top: 0, left: 0 }}>
          <path
            d={`M 0 ${size.height} A ${size.width / 2} ${size.height / 2} 0 0 1 ${size.width} ${size.height}`}
            fill="none"
            stroke={blockColor}
            strokeWidth={shapeInfo.strokeWidth}
          />
        </svg>
      );
    }
    if (shapeInfo.type === "heart") {
      return (
        <svg viewBox="0 0 100 100" width={size.width} height={size.height} style={{ position: 'absolute', top: 0, left: 0 }}>
          <path
            d="M50 88 C25 65, 0 50, 0 30 A25 25 0 0 1 50 18 A25 25 0 0 1 100 30 C100 50, 75 65, 50 88Z"
            fill={blockColor}
          />
        </svg>
      );
    }
    if (shapeInfo.type === "stripedRect" || shapeInfo.type === "stripedRect_2") {
      const stripeCount = shapeInfo.type === "stripedRect" ? Math.floor(size.height / (size.width / 4)) : Math.floor(size.width / (size.height / 4));
      const stripes = [];
      if (shapeInfo.type === "stripedRect") {
        const stripeH = size.height / stripeCount;
        for (let i = 0; i < stripeCount; i++) {
          if (i % 2 === 0) stripes.push(<rect key={i} x={0} y={i * stripeH} width={size.width} height={stripeH} fill={blockColor} />);
        }
      } else {
        const stripeW = size.width / stripeCount;
        for (let i = 0; i < stripeCount; i++) {
          if (i % 2 === 0) stripes.push(<rect key={i} x={i * stripeW} y={0} width={stripeW} height={size.height} fill={blockColor} />);
        }
      }
      return (
        <svg width={size.width} height={size.height} style={{ position: 'absolute', top: 0, left: 0 }}>
          {stripes}
        </svg>
      );
    }
    return null;
  };

  return (
    <div
      className="canvas-wrapper"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={(e) => {
        // Only clear selection on a genuine click (no drag), and not when
        // clicking on shapes or action buttons (those stopPropagation).
        setShowSettings(null);
        if (!mouseMoved) setSelectedIndices(new Set());
      }}
    >
      {/* Shape palette tray */}
      <div className="shape-palette">
        <span className="shape-palette-label">Blocks</span>
        <div className="shape-palette-items">
          {spawnShapes.map((shape, index) => (
            <div
              key={index}
              className="palette-item"
              onMouseDown={(e) => handleMouseDown(e, undefined, index)}
            >
              <div
                className="shapes palette-shape"
                style={{
                  position: "relative",
                  width: `${shape.width}px`,
                  height: `${shape.height}px`,
                  borderRadius: shape.type === "Arc" ? 0 : shape.borderRadius,
                  backgroundColor: shape.type === "Arc" || shape.type === "heart" || shape.type === "stripedRect" || shape.type === "stripedRect_2" ? "transparent" : undefined,
                }}
              >
                {(shape.type === "Arc" || shape.type === "heart" || shape.type === "stripedRect" || shape.type === "stripedRect_2") &&
                  renderShapeContent(shape, {
                    width: shape.width,
                    height: shape.height,
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Drawing canvas */}
      <div
        ref={canvasRef}
        className="canvas"
        onMouseDown={handleCanvasMouseDown}
      >
        <div className="canvas-inner">

        {/* render all the placed shapes */}
        {placedShapes.map((pos, index) => (
          <div
            key={index}
            index={index}
            className={`shapes${selectedIndices.has(index) ? ' selected' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            onMouseDown={(e) => handleMouseDown(e, index, pos.type)}
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              width: `${shapes[pos.type].width}px`,
              height: `${shapes[pos.type].height}px`,
              borderRadius:
                shapes[pos.type].type === "Arc"
                  ? 0
                  : shapes[pos.type].borderRadius,
              backgroundColor:
                shapes[pos.type].type === "Arc" || shapes[pos.type].type === "heart" || shapes[pos.type].type === "stripedRect" || shapes[pos.type].type === "stripedRect_2" ? "transparent" : undefined,
              transform: `rotate(${pos.rotation || 0}deg)`,
              transformOrigin: "center center",
            }}
          >
            {(shapes[pos.type].type === "Arc" || shapes[pos.type].type === "heart" || shapes[pos.type].type === "stripedRect" || shapes[pos.type].type === "stripedRect_2") &&
              renderShapeContent(shapes[pos.type], {
                width: shapes[pos.type].width,
                height: shapes[pos.type].height,
              })}
          </div>
        ))}

        {/* Marquee selection rectangle */}
        {marquee && (
          <div
            className="marquee-rect"
            style={{
              left: `${Math.min(marquee.startX, marquee.endX)}px`,
              top: `${Math.min(marquee.startY, marquee.endY)}px`,
              width: `${Math.abs(marquee.endX - marquee.startX)}px`,
              height: `${Math.abs(marquee.endY - marquee.startY)}px`,
            }}
          />
        )}

        {/* Multi-selection action bar */}
        {selectedIndices.size > 1 && !isGroupDragging && (
          <div className="multi-select-bar" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
            <span className="multi-select-count">{selectedIndices.size} selected</span>
            <button className="shape-action-btn" onClick={duplicateSelected} style={{ position: 'relative' }}>
              ⧉ Duplicate
            </button>
            <button className="shape-action-btn delete" onClick={removeShape} style={{ position: 'relative' }}>
              ✕ Delete all
            </button>
          </div>
        )}

        {/*show the setting menu for the selected shape */}
        {showSettings !== null && placedShapes[showSettings] && (
          <div
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              className="shape-action-btn delete"
              onClick={removeShape}
              style={{
                position: "absolute",
                left: `${placedShapes[showSettings].x + shapes[placedShapes[showSettings].type].width}px`,
                top: `${placedShapes[showSettings].y}px`,
                zIndex: 1000,
              }}
            >
              ✕ Delete
            </button>

            {(shapes[placedShapes[showSettings].type].type === "Arc" || shapes[placedShapes[showSettings].type].type === "heart" || shapes[placedShapes[showSettings].type].type === "QuarterCircle") && (
              <button
                className="shape-action-btn"
                onClick={rotateShape}
                style={{
                  position: "absolute",
                  left: `${placedShapes[showSettings].x + shapes[placedShapes[showSettings].type].width}px`,
                  top: `${placedShapes[showSettings].y + 34}px`,
                  zIndex: 1000,
                }}
              >
                ↻ Rotate
              </button>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default ClickDrag;

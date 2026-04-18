import React, { useRef, useState } from "react";
import Shapes from "./shapes";

const ClickDrag = ({
  placedShapes,
  setPlacedShapes,
  cellSize,
  setCellSize,
}) => {
  // remove the local useState for these
  // use the props instead
  const [isDragging, setIsDragging] = useState(false);
  // State to track the offset of the mouse from the top-left corner of the square
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [shapeType, setShapeType] = useState(0); //track which shape we are dragging
  const [draggingIndex, setDraggingIndex] = useState(null); //track which square is active
  const [mouseMoved, setMouseMoved] = useState(false);
  const [showSettings, setShowSettings] = useState(null);

  //spawn positions for each shape type — always use rotation 0 for base definitions
  const spawnPositions = Shapes(cellSize).map((shape) => ({
    x: shape.x,
    y: shape.y,
  }));
  const spawnShapes = Shapes(20);
  const shapes = Shapes(cellSize);

  //ref for the canvas div to get its position and dimensions
  const canvasRef = useRef(null);

  // Handle mouse down event to start dragging on the currently
  const handleMouseDown = (e, index, shapeTypeIndex) => {
    setMouseMoved(false);
    setIsDragging(true);
    setShapeType(shapeTypeIndex);

    console.log("shape type index", shapeTypeIndex);
    //if index is not undefined, then we are dragging an existing square, otherwise we are dragging the starting copy square
    if (index !== undefined) {
      setDraggingIndex(index);
      setOffset({
        x: e.clientX - placedShapes[index].x,
        y: e.clientY - placedShapes[index].y,
      });
    } else {
      setDraggingIndex(null);
      setOffset({
        x: e.clientX - spawnPositions[shapeTypeIndex].x,
        y: e.clientY - spawnPositions[shapeTypeIndex].y,
      });
    }
    console.log("mouse down fired", index);
    console.log(shapes[shapeTypeIndex]);
  };

  const handleMouseMove = (e) => {
    setMouseMoved(true);
    if (isDragging && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const borderWidth = 2;
      setCellSize((rect.width - borderWidth * 2) / 16);

      // Calculate the new position
      let newX = e.clientX - offset.x;
      let newY = e.clientY - offset.y;

      //snap to grid
      newX = Math.round(newX / cellSize) * cellSize;
      newY = Math.round(newY / cellSize) * cellSize;

      // Constrain the square within the canvas
      newX = Math.max(0, Math.min(newX, rect.width - cellSize));
      newY = Math.max(0, Math.min(newY, rect.height - cellSize));

      if (draggingIndex === null) {
        // Update the position of the starting copy square
        setPlacedShapes((prev) => [
          ...prev,
          { x: newX, y: newY, type: shapeType, rotation: 0 },
        ]);
        setDraggingIndex(placedShapes.length);
      } else {
        // Update the position of the currently dragged square in the placedSquares array
        setPlacedShapes((prev) =>
          prev.map((pos, index) =>
            index === draggingIndex ? { ...pos, x: newX, y: newY } : pos,
          ),
        );
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    if (!mouseMoved && draggingIndex !== null) {
      //do something when a shape is clicked without dragging, like open a settings menu for that shape
      setShowSettings(draggingIndex);
      console.log("clicked!");
    } else {
      setShowSettings(null);
    }
  };

  //remove shape if delete button is clicked in the settings menu
  const removeShape = () => {
    setPlacedShapes((prev) =>
      prev.filter((_, index) => index !== showSettings),
    );
    //after deleting, close the settings menu
    setShowSettings(null);
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
    const w = size?.width || shapeInfo.width;
    const h = size?.height || shapeInfo.height;
    if (shapeInfo.type === "Arc") {
      const strokeW = shapeInfo.strokeWidth || cellSize;
      const r = w - strokeW / 2; // shrink radius so stroke fits inside
      return (
        <svg
          width={w}
          height={h}
          style={{ position: "absolute", top: 0, left: 0, overflow: "visible" }}
        >
          <path
            d={`M ${w - strokeW / 2} ${0} A ${r} ${r} 0 0 1 ${0} ${h - strokeW / 2}`}
            fill="none"
            stroke="#8898e2"
            strokeWidth={strokeW}
          />
        </svg>
      );
    } else if (shapeInfo.type === "stripedRect") {
      const stripeW = w / 5;
      return (
        <svg
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          style={{ position: "absolute", top: 0, left: 0 }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x={0}           y={0} width={stripeW} height={h} fill="#8898e2" />
          <rect x={stripeW * 2}  y={0} width={stripeW} height={h} fill="#8898e2" />
          <rect x={stripeW * 4}  y={0} width={stripeW} height={h} fill="#8898e2" />
        </svg>
      );
    } else if (shapeInfo.type === "stripedRect_2") {
      const stripeH = h / 5;
      return (
        <svg
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          style={{ position: "absolute", top: 0, left: 0 }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x={0}  y={0} width={w} height={stripeH} fill="#8898e2" />
          <rect x={0}  y={stripeH *2} width={w} height={stripeH} fill="#8898e2" />
          <rect x={0}  y={stripeH *4} width={w} height={stripeH} fill="#8898e2" />
        </svg>
      );}
      else if (shapeInfo.type === "heart") {
      return (
        <svg
          width={w}
          height={h}
          viewBox="0 0 24 24"
          style={{ background: "transparent" }}
          fill="none"

          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12.8993 3.73386L11.9975 4.63704L11.0912 3.73167C9.98254 2.62417 8.4789 2.00205 6.91108 2.00215C5.34326 2.00226 3.8397 2.62458 2.73115 3.73221C1.62261 4.83985 0.999897 6.34207 1 7.9084C1.0001 9.47474 1.62302 10.9769 2.7317 12.0844L11.4146 20.759C11.5692 20.9133 11.7789 21 11.9975 21C12.216 21 12.4257 20.9133 12.5804 20.759L21.2709 12.0822C22.3783 10.9744 23.0002 9.47282 23 7.90724C22.9998 6.34166 22.3775 4.8402 21.2698 3.73276C20.7203 3.18343 20.0679 2.74766 19.3498 2.45035C18.6316 2.15303 17.8619 2 17.0846 2C16.3072 2 15.5375 2.15303 14.8194 2.45035C14.1012 2.74766 13.4488 3.18453 12.8993 3.73386Z"
            fill="#8898e2"
          />
        </svg>
      );
    }
  };

  return (
    <div
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={() => setShowSettings(null)} // click anywhere to dismiss
      className="canvas"
    >
      <div>
        {/* Render the static copy of shapes */}
        {spawnShapes.map((shape, index) => (
          <div
            key={index}
            index={index}
            className="shapes"
            onClick={handleClick}
            onMouseDown={(e) => handleMouseDown(e, undefined, index)}
            style={{
              left: `${shape.x}px`,
              top: `${shape.y}px`,
              width: `${shape.width}px`,
              height: `${shape.height}px`,
              borderRadius: shape.type === "Arc" ? 0 : shape.borderRadius,
              backgroundColor: shape.type === "Arc" || shape.type === "heart" || shape.type === "stripedRect" || shape.type === "stripedRect_2" ? "transparent" : undefined,
              pointerEvents: "auto",
            }}
          >
            {(shape.type === "Arc" || shape.type === "heart" || shape.type === "stripedRect" || shape.type === "stripedRect_2") &&
              renderShapeContent(shape, {
                width: shape.width,
                height: shape.height,
              })}
          </div>
        ))}

        {/* render all the placed shapes */}
        {placedShapes.map((pos, index) => (
          <div
            key={index}
            index={index}
            className="shapes"
            onClick={(e) => {
              e.stopPropagation(); // don't dismiss menu when clicking a shape
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

        {/*show the setting menu for the selected shape */}
        {showSettings !== null && placedShapes[showSettings] && (
          <div
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              onClick={removeShape}
              style={{
                position: "absolute",
                left: `${placedShapes[showSettings].x + shapes[placedShapes[showSettings].type].width}px`,
                top: `${placedShapes[showSettings].y}px`,
                zIndex: 1000,
              }}
            >
              Delete
            </button>

            {(shapes[placedShapes[showSettings].type].type === "Arc" || shapes[placedShapes[showSettings].type].type === "heart" || shapes[placedShapes[showSettings].type].type === "QuarterCircle") && (
              <button
                onClick={rotateShape}
                style={{
                  position: "absolute",
                  left: `${placedShapes[showSettings].x + shapes[placedShapes[showSettings].type].width}px`,
                  top: `${placedShapes[showSettings].y + 30}px`,
                  zIndex: 1000,
                }}
              >
                Rotate
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClickDrag;

//shapes properties
//size: height, width
//type: square, circle, rectangle
//color
//initial position: x, y

function Shapes(cellSize) {


    return [
      { type: "square", height: cellSize, width: cellSize, x: 0, y: -50, borderRadius: 0, rotation: 0},
      { type: "circle", height: cellSize, width: cellSize, x: 50, y: -50, borderRadius: "50%", rotation: 0},
      { type: "rectangle", height: cellSize * 2, width: cellSize, x: 100, y: -50 , borderRadius: 0, rotation: 0},
      { type: "rectangle_2", height: cellSize, width: cellSize * 2, x: 150, y: -50 , borderRadius: 0, rotation: 0},
      { type: "LargeSquare", height: cellSize * 2, width: cellSize*2, x: 200, y: -50, borderRadius: 0, rotation: 0},
      { type: "QuarterCircle", height: cellSize, width: cellSize, x: 250, y: -50, borderRadius: "0 0% 100% 0%", rotation: 0},
      { type: "Arc", height: cellSize * 2, width: cellSize * 2, x: 300, y: -50, borderRadius: 0, strokeWidth: cellSize, rotation: 0},
      { type: "heart", height: cellSize, width: cellSize, x: 350, y: -50, borderRadius: 0, rotation: 0}, 
      { type: "stripedRect", height: cellSize * 2, width: cellSize, x: 400, y: -50 , borderRadius: 0, rotation: 0},
      { type: "stripedRect_2", height: cellSize, width: cellSize*2, x: 450, y: -50 , borderRadius: 0, rotation: 0},

    ];
}

export default Shapes;

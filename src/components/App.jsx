import React, { useState } from 'react'
import "../styles/index.css"
import ClickDrag from './clickDrag'
import Shapes from './shapes'
import Print from './print'

function App() {

  const [placedShapes, setPlacedShapes] = useState([]);
  const [cellSize, setCellSize] = useState(20);

  return (
    <div className="App">
      <div className="title">
      <h2 className="title">Lego Builder</h2>
      </div>
      <ClickDrag 
        placedShapes={placedShapes} 
        setPlacedShapes={setPlacedShapes}
        cellSize={cellSize}
        setCellSize={setCellSize}
      />
      <Print placedShapes={placedShapes} cellSize={cellSize} />
    </div>
  )
}

export default App

import React, { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import "../styles/index.css"
import ClickDrag from './clickDrag'
import Shapes from './shapes'
import Print from './print'
import SaveButton from './SaveButton'
import Gallery from './Gallery'
import Login from './Login'
import { onAuthChange, logOut } from '../auth'

function App() {

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [placedShapes, setPlacedShapes] = useState([]);
  const [cellSize, setCellSize] = useState(20);
  const [currentDrawingId, setCurrentDrawingId] = useState(null);
  const [currentDrawingName, setCurrentDrawingName] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const navigate = useNavigate();

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleSignOut = async () => {
    await logOut();
    setPlacedShapes([]);
    setCurrentDrawingId(null);
    setCurrentDrawingName(null);
  };

  // Load a saved drawing into the editor
  const handleLoadDrawing = (id, name, shapes, savedCellSize) => {
    setCurrentDrawingId(id);
    setCurrentDrawingName(name);
    setPlacedShapes(shapes);
    setCellSize(savedCellSize);
  };

  // Start a new blank drawing
  const handleNewDrawing = () => {
    setCurrentDrawingId(null);
    setCurrentDrawingName(null);
    setPlacedShapes([]);
    setCellSize(20);
  };

  if (authLoading) {
    return <div className="App"><p>Loading...</p></div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Routes>
      <Route path="/" element={
        <div className="App">
          <div className="top-bar animate-in">
            <div className="top-bar-left">
              <h2 className="brand-title">Brickpress</h2>
              <span className="badge">
                {user.displayName || user.email}
              </span>
            </div>
            <div className="top-bar-right">
              <p className="editing-label">
                {currentDrawingName ? `Editing: ${currentDrawingName}` : 'New Drawing'}
              </p>
              <div className="toolbar-compact">
                <SaveButton
                  placedShapes={placedShapes}
                  cellSize={cellSize}
                  drawingId={currentDrawingId}
                  drawingName={currentDrawingName}
                  userId={user.uid}
                  onSaved={(id, name) => { setCurrentDrawingId(id); setCurrentDrawingName(name); }}
                />
                <button className="button-secondary" onClick={handleNewDrawing}>
                  New
                </button>
                <button className="button-secondary" onClick={() => navigate('/gallery')}>
                  Gallery
                </button>
                <button
                  className="button-secondary"
                  onClick={handleSignOut}
                  style={{ fontSize: '11px', padding: '4px 12px' }}
                >
                  Sign out
                </button>
                <button
                  className="button preview-modal-toggle"
                  onClick={() => setPreviewOpen(true)}
                >
                  Preview
                </button>
              </div>
            </div>
          </div>

          <div className="editor-layout">
            <div className="editor-left">
              <ClickDrag
                placedShapes={placedShapes}
                setPlacedShapes={setPlacedShapes}
                cellSize={cellSize}
                setCellSize={setCellSize}
                blockColor={blockColor}
              />
            </div>
            <div className="editor-right">
              <Print placedShapes={placedShapes} cellSize={cellSize} />
            </div>
          </div>

          {previewOpen && (
            <div className="preview-modal-backdrop" onClick={() => setPreviewOpen(false)}>
              <div className="preview-modal" onClick={e => e.stopPropagation()}>
                <div className="preview-modal-header">
                  <h3>Preview</h3>
                  <button className="preview-modal-close" onClick={() => setPreviewOpen(false)}>
                    ×
                  </button>
                </div>
                <div className="preview-modal-body">
                  <Print placedShapes={placedShapes} cellSize={cellSize} />
                </div>
              </div>
            </div>
          )}
        </div>
      } />
      <Route path="/gallery" element={<Gallery onLoad={handleLoadDrawing} userId={user.uid} />} />
    </Routes>
  )
}

export default App

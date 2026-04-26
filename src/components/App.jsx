import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import "../styles/index.css"
import ClickDrag from './clickDrag'
import Print from './print'
import Gallery from './Gallery'
import Login from './Login'
import { onAuthChange, logOut } from '../auth'
import { db } from '../firebase'
import { collection, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore'

function App() {

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [placedShapes, setPlacedShapes] = useState([]);
  const [cellSize, setCellSize] = useState(20);
  const [currentDrawingId, setCurrentDrawingId] = useState(null);
  const [currentDrawingName, setCurrentDrawingName] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [printSettings, setPrintSettings] = useState(null);
  const savingRef = useRef(false);
  const navigate = useNavigate();

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  const autoSaveDrawing = useCallback(async () => {
    if (!user || placedShapes.length === 0 || savingRef.current) return;

    savingRef.current = true;
    try {
      if (currentDrawingId) {
        await setDoc(doc(db, 'drawings', currentDrawingId), {
          placedShapes,
          cellSize,
          printSettings: printSettings || {},
          updatedAt: serverTimestamp(),
          userId: user.uid,
          name: currentDrawingName || `Drawing ${new Date().toLocaleDateString()}`,
        }, { merge: true });
      } else {
        const name = currentDrawingName || `Drawing ${new Date().toLocaleDateString()}`;
        const docRef = await addDoc(collection(db, 'drawings'), {
          placedShapes,
          cellSize,
          printSettings: printSettings || {},
          createdAt: serverTimestamp(),
          userId: user.uid,
          name,
        });
        setCurrentDrawingId(docRef.id);
        setCurrentDrawingName(name);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      savingRef.current = false;
    }
  }, [user, placedShapes, cellSize, printSettings, currentDrawingId, currentDrawingName]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      autoSaveDrawing();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [autoSaveDrawing]);

  // Debounced auto-save whenever print settings change
  useEffect(() => {
    if (!printSettings || !currentDrawingId) return;
    const timer = setTimeout(() => {
      autoSaveDrawing();
    }, 1000);
    return () => clearTimeout(timer);
  }, [printSettings]);

  const handleSignOut = async () => {
    await autoSaveDrawing();
    await logOut();
    setPlacedShapes([]);
    setCurrentDrawingId(null);
    setCurrentDrawingName(null);
  };

  // Load a saved drawing into the editor
  const handleLoadDrawing = (id, name, shapes, savedCellSize, savedPrintSettings) => {
    setCurrentDrawingId(id);
    setCurrentDrawingName(name);
    // Migrate old format (x/y in pixels) to new format (cellX/cellY in grid units)
    const migratedShapes = shapes.map((s) =>
      s.cellX !== undefined
        ? s
        : { ...s, cellX: Math.round(s.x / savedCellSize), cellY: Math.round(s.y / savedCellSize) }
    );
    setPlacedShapes(migratedShapes);
    setCellSize(savedCellSize);
    if (savedPrintSettings) setPrintSettings(savedPrintSettings);
  };

  // Start a new blank drawing
  const handleNewDrawing = async () => {
    await autoSaveDrawing();
    setCurrentDrawingId(null);
    setCurrentDrawingName(null);
    setPlacedShapes([]);
    setCellSize(20);
  };

  const handleOpenGallery = async () => {
    await autoSaveDrawing();
    navigate('/gallery');
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
                <button className="button-secondary" onClick={handleNewDrawing}>
                  New
                </button>
                <button className="button-secondary" onClick={handleOpenGallery}>
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
                blockColor={printSettings?.blockColors ?? '#c98a4f'}
              />
            </div>
            <div className="editor-right">
              <Print
                placedShapes={placedShapes}
                cellSize={cellSize}
                printSettings={printSettings}
                onSettingsChange={setPrintSettings}
              />
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
                  <Print
                    placedShapes={placedShapes}
                    cellSize={cellSize}
                    printSettings={printSettings}
                    onSettingsChange={setPrintSettings}
                  />
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

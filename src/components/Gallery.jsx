import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc, orderBy, query, where, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import DrawingThumbnail from './DrawingThumbnail';

// Inline-editable name field for a gallery card
function EditableName({ id, name, onRename }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = async () => {
    const trimmed = draft.trim() || name;
    setDraft(trimmed);
    setEditing(false);
    if (trimmed !== name) await onRename(id, trimmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') { setDraft(name); setEditing(false); }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        style={{
          margin: 0,
          fontWeight: 700,
          fontSize: '14px',
          color: 'var(--text-dark)',
          border: '1.5px solid var(--ink-red)',
          borderRadius: 'var(--radius-sm)',
          padding: '2px 6px',
          width: '100%',
          boxSizing: 'border-box',
          fontFamily: 'inherit',
          background: 'var(--surface-canvas)',
          outline: 'none',
        }}
      />
    );
  }

  return (
    <p
      title="Click to rename"
      onClick={() => setEditing(true)}
      style={{
        margin: 0,
        fontWeight: 700,
        fontSize: '14px',
        color: 'var(--text-dark)',
        cursor: 'text',
        padding: '2px 2px',
        borderRadius: 'var(--radius-sm)',
        transition: 'background 0.15s',
        wordBreak: 'break-word',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-panel)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {draft}
      <span style={{ marginLeft: 5, opacity: 0.35, fontSize: '11px' }}>✏️</span>
    </p>
  );
}

function Gallery({ onLoad, userId }) {
  const [drawings, setDrawings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch only this user's drawings from Firestore
  useEffect(() => {
    const fetchDrawings = async () => {
      try {
        const q = query(
          collection(db, 'drawings'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setDrawings(docs);
      } catch (error) {
        console.error('Error fetching drawings:', error);
      }
      setLoading(false);
    };
    fetchDrawings();
  }, []);

  // Rename a drawing in Firestore and update local state
  const handleRename = async (id, newName) => {
    try {
      await updateDoc(doc(db, 'drawings', id), { name: newName });
      setDrawings((prev) => prev.map((d) => d.id === id ? { ...d, name: newName } : d));
    } catch (error) {
      console.error('Error renaming:', error);
    }
  };

  // Delete a drawing from Firestore
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this drawing?')) return;
    try {
      await deleteDoc(doc(db, 'drawings', id));
      setDrawings((prev) => prev.filter((d) => d.id !== id));
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  // Load a drawing into the editor
  const handleLoad = (drawing) => {
    onLoad(drawing.id, drawing.name, drawing.placedShapes, drawing.cellSize, drawing.printSettings ?? null);
    navigate('/');
  };

  if (loading) {
    return <div className="App"><p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Loading gallery...</p></div>;
  }

  return (
    <div className="App">
      <div className="title animate-in">
        <h2 className="title">Gallery</h2>
      </div>

      <div className="gallery-container">
        <button className="button-secondary gallery-back-btn animate-in animate-in-delay-1" onClick={() => navigate('/')}>
          ← Back to Editor
        </button>

        {drawings.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>No saved drawings yet.</p>
        ) : (
          <div className="gallery-grid">
            {drawings.map((drawing, idx) => (
              <div
                key={drawing.id}
                className="gallery-card animate-in"
                style={{ animationDelay: `${idx * 0.06}s` }}
              >
                <DrawingThumbnail
                  placedShapes={drawing.placedShapes ?? []}
                  cellSize={drawing.cellSize ?? 20}
                  printSettings={drawing.printSettings ?? undefined}
                />
                <EditableName
                  id={drawing.id}
                  name={drawing.name || 'Untitled'}
                  onRename={handleRename}
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button
                    className="button"
                    onClick={() => handleLoad(drawing)}
                    style={{ flex: 1, fontSize: '12px', padding: '6px' }}
                  >
                    Open
                  </button>
                  <button
                    className="button-danger"
                    onClick={() => handleDelete(drawing.id)}
                    style={{ flex: 1, fontSize: '12px', padding: '6px' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Gallery;

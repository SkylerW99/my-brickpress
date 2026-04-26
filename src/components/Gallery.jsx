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
          background: 'var(--surface-card)',
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
      <span style={{ marginLeft: 5, opacity: 0.5, display: 'inline-flex', verticalAlign: 'middle' }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </span>
    </p>
  );
}

function DeleteConfirmModal({ onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.62)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
      onClick={onCancel}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface-card)',
          border: '1.5px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          padding: '32px 28px 24px',
          width: 320,
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          fontFamily: 'inherit',
        }}
      >
        {/* Icon */}
        <div style={{
          width: 44, height: 44,
          borderRadius: '50%',
          background: 'oklch(0.20 0.02 60)',
          border: '1.5px solid var(--border-medium)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink-red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </div>

        <p style={{
          margin: '0 0 6px',
          fontSize: '15px',
          fontWeight: 700,
          color: 'var(--text-dark)',
          letterSpacing: '0.01em',
        }}>
          Delete drawing?
        </p>
        <p style={{
          margin: '0 0 24px',
          fontSize: '13px',
          color: 'var(--text-muted)',
          lineHeight: 1.5,
        }}>
          This can't be undone. The drawing will be permanently removed from your gallery.
        </p>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '9px 0',
              borderRadius: 'var(--radius-sm)',
              border: '1.5px solid var(--border-medium)',
              background: 'transparent',
              color: 'var(--text-mid)',
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-panel)'; e.currentTarget.style.color = 'var(--text-dark)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-mid)'; }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '9px 0',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: 'var(--ink-red)',
              color: 'oklch(0.11 0.01 60)',
              fontSize: '13px',
              fontWeight: 700,
              fontFamily: 'inherit',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--ink-red-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--ink-red)'}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function Gallery({ onLoad, userId }) {
  const [drawings, setDrawings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
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
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    const id = deleteTarget;
    setDeleteTarget(null);
    try {
      await deleteDoc(doc(db, 'drawings', id));
      setDrawings((prev) => prev.filter((d) => d.id !== id));
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const cancelDelete = () => setDeleteTarget(null);

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
      {deleteTarget && (
        <DeleteConfirmModal onConfirm={confirmDelete} onCancel={cancelDelete} />
      )}
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

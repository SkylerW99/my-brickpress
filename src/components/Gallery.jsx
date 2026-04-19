import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc, orderBy, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import DrawingThumbnail from './DrawingThumbnail';

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
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDrawings(docs);
      } catch (error) {
        console.error('Error fetching drawings:', error);
      }
      setLoading(false);
    };
    fetchDrawings();
  }, []);

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
    onLoad(drawing.id, drawing.name, drawing.placedShapes, drawing.cellSize);
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

      <button className="button-secondary animate-in animate-in-delay-1" onClick={() => navigate('/')} style={{ marginBottom: '8px' }}>
        ← Back to Editor
      </button>

      {drawings.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>No saved drawings yet.</p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
          gap: '20px',
          width: '80%',
          maxWidth: '800px',
          padding: '4px',
        }}>
          {drawings.map((drawing, idx) => (
            <div
              key={drawing.id}
              className="gallery-card animate-in"
              style={{ animationDelay: `${idx * 0.06}s` }}
            >
              <DrawingThumbnail
                placedShapes={drawing.placedShapes || []}
                cellSize={drawing.cellSize || 20}
                thumbSize={180}
              />
              <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: 'var(--text-dark)' }}>
                {drawing.name || 'Untitled'}
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                {drawing.placedShapes?.length || 0} shapes
              </p>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
                {drawing.createdAt?.toDate
                  ? drawing.createdAt.toDate().toLocaleString()
                  : 'Unknown date'}
              </p>
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
  );
}

export default Gallery;

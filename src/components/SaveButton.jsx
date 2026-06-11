import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';

function SaveButton({ placedShapes, cellSize, numRow, aspectRatio, printSettings, drawingId, drawingName, userId, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const sanitize = (obj) =>
    JSON.parse(JSON.stringify(obj, (_, v) => (v === undefined ? null : v)));

  const handleSave = async () => {
    if (placedShapes.length === 0) {
      setSaveMessage('Nothing to save!');
      setTimeout(() => setSaveMessage(''), 2000);
      return;
    }

    setSaving(true);
    setSaveMessage('');
    try {
      if (drawingId) {
        // Update existing drawing
        await setDoc(doc(db, 'drawings', drawingId), {
          ...sanitize({ placedShapes, cellSize, numRow, aspectRatio, printSettings: printSettings || {} }),
          updatedAt: serverTimestamp(),
          userId,
          name: drawingName || `Drawing ${new Date().toLocaleDateString()}`,
        }, { merge: true });
        setSaveMessage('Updated!');
      } else {
        // Create new drawing
        const name = `Drawing ${new Date().toLocaleDateString()}`;
        const docRef = await addDoc(collection(db, 'drawings'), {
          ...sanitize({ placedShapes, cellSize, numRow, aspectRatio, printSettings: printSettings || {} }),
          createdAt: serverTimestamp(),
          userId,
          name,
        });
        onSaved(docRef.id, name);
        setSaveMessage(`Saved!`);
      }
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving:', error);
      setSaveMessage('Failed to save. Try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    }
    setSaving(false);
  };

  return (
    <>
      {saveMessage && (
        <p className={`save-msg ${saveMessage.includes('Failed') ? 'error' : 'success'}`}>
          {saveMessage}
        </p>
      )}
    </>
  );
}

export default SaveButton;

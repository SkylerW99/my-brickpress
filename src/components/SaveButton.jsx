import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

function SaveButton({ placedShapes, cellSize }) {
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleSave = async () => {
    if (placedShapes.length === 0) {
      setSaveMessage('Nothing to save!');
      setTimeout(() => setSaveMessage(''), 2000);
      return;
    }

    setSaving(true);
    setSaveMessage('');
    try {
      const docRef = await addDoc(collection(db, 'drawings'), {
        placedShapes,
        cellSize,
        createdAt: serverTimestamp(),
        name: `Drawing ${new Date().toLocaleDateString()}`,
      });
      setSaveMessage(`Saved! (ID: ${docRef.id})`);
      setTimeout(() => setSaveMessage(''), 3000);
      console.log(saveMessage);
    } catch (error) {
      console.error('Error saving:', error);
      setSaveMessage('Failed to save. Try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    }
    setSaving(false);
  };

  return (
    <>
      <button className="button" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save'}
      </button>
      {saveMessage && (
        <p style={{ color: saveMessage.includes('Failed') ? '#ff6b6b' : '#69db7c', margin: '8px 0' }}>
          {saveMessage}
        </p>
      )}
    </>
  );
}

export default SaveButton;

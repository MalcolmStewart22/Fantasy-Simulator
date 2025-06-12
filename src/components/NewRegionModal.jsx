import React, { useState } from 'react';

export default function NewRegionModal({ initialName = '', initialType = 'Region', onSave, onCancel }) {
  const [name, setName] = useState(initialName);
  const [type, setType] = useState(initialType);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim() === '') return;
    onSave(name, type);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 3000,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: 'white',
          padding: 20,
          borderRadius: 8,
          width: 300,
          boxSizing: 'border-box',
        }}
      >
        <h3>Create New Region</h3>

        <label>
          Name:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            style={{ width: '100%', marginBottom: 10 }}
          />
        </label>

        <label>
          Type:
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={{ width: '100%', marginBottom: 10 }}
          >
            <option value="Continent">Continent</option>
            <option value="Region">Region</option>
            <option value="Country">Country</option>
            <option value="Province">Province</option>
            <option value="Ocean">Ocean</option>
            {/* Add your region types here */}
          </select>
        </label>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} style={{ marginRight: 10 }}>
            Cancel
          </button>
          <button type="submit">Create</button>
        </div>
      </form>
    </div>
  );
}

import React, { useState, useEffect } from 'react';

export default function LocationEditor({ 
  location,
  onSave,   
  onCancel, 
tempMarkerId, 
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState('City');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (location) {
      setName(location.name || '');
      setType(location.type || 'City');
      setDescription(location.description || '');
    } else {
      setName('');
      setType('City');
      setDescription('');
    }
  }, [location]);

const handleSubmit = () => {
  const newLocation = {
    id: location?.id || null,
    tempMarkerId, 
    name,
    type,
    description,
  };
  onSave(newLocation);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 1000,
    }}>
      <form onSubmit={handleSubmit} style={{
        backgroundColor: '#fff', padding: 20, borderRadius: 8, width: 300,
      }}>
        <h3>{location ? 'Edit Location' : 'New Location'}</h3>
        <label>
          Name<br/>
          <input value={name} onChange={e => setName(e.target.value)} required />
        </label>
        <br />
        <label>
          Type<br/>
          <select value={type} onChange={e => setType(e.target.value)}>
            <option>City</option>
            <option>Town</option>
            <option>Village</option>
            <option>Ruins</option>
            <option>Dungeon</option>
            <option>Landmark</option>
          </select>
        </label>
        <br />
        <label>
          Description<br/>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} />
        </label>
        <br />
        <button type="submit">Save</button>
        <button type="button" onClick={onCancel} style={{ marginLeft: 10 }}>Cancel</button>
      </form>
    </div>
  );
}

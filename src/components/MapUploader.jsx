import React, { useState } from 'react';

export default function MapUploader({ onImageUpload }) {
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PNG or JPG image.');
      onImageUpload(null);
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      onImageUpload(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <input type="file" accept="image/png, image/jpeg" onChange={handleFileChange} />
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

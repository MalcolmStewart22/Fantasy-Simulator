export default function MapToolbar({ toolMode, setToolMode }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      left: 20,
      display: 'flex',
      gap: '10px',
      backgroundColor: '#fff',
      border: '1px solid #ccc',
      borderRadius: '8px',
      padding: '10px',
      zIndex: 1000,
    }}>
      {['location', 'region'].map((mode) => (
        <button
          key={mode}
          onClick={() => setToolMode(mode)}
          style={{
            backgroundColor: toolMode === mode ? '#007bff' : '#eee',
            color: toolMode === mode ? '#fff' : '#000',
            padding: '6px 12px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {mode[0].toUpperCase() + mode.slice(1)} Tool
        </button>
      ))}
    </div>
  );
}
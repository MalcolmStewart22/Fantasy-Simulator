import React, { useCallback } from 'react';

export default function LocationMarker({
  marker,
  selected,
  locked,
  mapRef,
  onSelect,
  onDragUpdate,
}) {
  const { id, x, y } = marker;

  const handleClick = (e) => {
    e.stopPropagation();
    onSelect(id);
  };

  const handleMouseDown = (e) => {
    if (locked) return;
    e.stopPropagation();
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = useCallback((e) => {
    if (locked || !mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const newX = Math.min(Math.max((e.clientX - rect.left) / rect.width * 100, 0), 100);
    const newY = Math.min(Math.max((e.clientY - rect.top) / rect.height * 100, 0), 100);
    onDragUpdate(id, newX, newY);
  }, [id, locked, mapRef, onDragUpdate]);

  const handleMouseUp = useCallback(() => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  return (
    <div
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      style={{
        position: 'absolute',
        top: `${y}%`,
        left: `${x}%`,
        width: 20,
        height: 20,
        backgroundColor: selected ? 'blue' : 'red',
        borderRadius: '50%',
        cursor: locked ? 'default' : 'move',
        transform: 'translate(-50%, -50%)',
        userSelect: 'none',
        zIndex: selected ? 10 : 5,
      }}
    />
  );
}

import React from 'react';

export default function Sidebar({
    selectedLocation,
    selectedRegion,
    regions,
    onEditLocation,
    onDeleteMarker,
    onDeleteRegion
}) {
    let childRegions = [];

    if (selectedRegion) {
        childRegions = regions.filter(r => r.parentId === selectedRegion.id);
    }
    return (
        <div style={{ width: '20%', borderLeft: '1px solid #ccc', paddingLeft: 10 }}>
        {selectedLocation ? (
            <div style={{ border: '1px solid #ccc', padding: 10 }}>
                <h2>{selectedLocation.name}</h2>
                <h4>
                {selectedLocation.type}
                {selectedLocation.regionId && (
                    <>
                    {' '}in{' '}
                    {regions.find(r => r.id === selectedLocation.regionId)?.name || 'Unknown Region'}
                    </>
                )}
                </h4>
                <p>{selectedLocation.description || 'No description'}</p>
                <button onClick={() => onEditLocation(selectedLocation)}>Edit</button>
                <button style={{ marginTop: 10, color: 'red' }} onClick={() => onDeleteMarker(selectedLocation)}>Delete Marker</button>
            </div>
            ) : selectedRegion ? (
            <div style={{ border: '1px solid #ccc', padding: 10 }}>
            <h2>{selectedRegion.name}</h2>
            <h4>Type: {selectedRegion.type}</h4>
            {selectedRegion.parentId && (
                <p>
                Parent:{' '}
                {regions.find(r => r.id === selectedRegion.parentId)?.name || 'Unknown'}
                </p>
            )}
            <p>
                Points: {selectedRegion.points.length}
            </p>
            {childRegions.length > 0 && (
                <div>
                    <h3>Subregions:</h3>
                    <ul>
                        {childRegions.map(child => (
                        <li key={child.id}>
                            {child.name} ({child.type})
                        </li>
                        ))}
                    </ul>
                </div>
            )}
            <button>Edit</button>
            <button onClick={() => onDeleteRegion(selectedRegion)} style={{ marginTop: 10, color: 'red' }}>Delete Region</button>
            </div>
        ) : (
            <div style={{ fontStyle: 'italic', color: '#666' }}>
            Click a marker or region to view details
            </div>
        )}
        </div>
    );
};

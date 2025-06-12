import React, { useState, useRef, useCallback, useEffect } from 'react';
import MapUploader from './MapUploader';
import LocationMarker from './LocationMarker';
import LocationEditor from './LocationEditor';
import MapToolbar from './MapToolbar';
import RegionOverlay from './RegionOverlay';
import RegionEditor from './RegionEditor';
import { doesSelfIntersect, linesIntersect, doesClosingEdgeIntersect, pointInPolygon, polygonFullyInsidePolygon } from '../utils/PolygonUtils';

export default function MapViewer() {
    const [mapImage, setMapImage] = useState(null);
    const [locations, setLocations] = useState([]);
    const [regions, setRegions] = useState([]);
    const [markers, setMarkers] = useState([]);
    const [locked, setLocked] = useState(false);
    const [selectedMarkerId, setSelectedMarkerId] = useState(null);
    const [editingLocation, setEditingLocation] = useState(null);
    const [toolMode, setToolMode] = useState('location');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [drawingRegion, setDrawingRegion] = useState(null);
    const [showRegionEditor, setShowRegionEditor] = useState(false);
    const [pendingClick, setPendingClick] = useState(null);
    const [hoverPoint, setHoverPoint] = useState(null);
    const [confirmRegionModalOpen, setConfirmRegionModalOpen] = useState(false);

    const mapRef = useRef(null);
    const selectedMarker = markers.find((m) => m.id === selectedMarkerId);
    const selectedLocation = selectedMarker
        ? locations.find((l) => l.id === selectedMarker.locationId)
        : null;
    const REGION_HIERARCHY = {
        World: [],
        Continent: ['World'],
        Country: ['Continent'],
        Province: ['Country'],
        Region: ['Continent', 'Country', 'Province'],
    };


    const handleMouseMove = useCallback(
    (e) => {
        if (!drawingRegion || !mapRef.current) return;

        const rect = mapRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const posX = (x / rect.width) * 100;
        const posY = (y / rect.height) * 100;
        setHoverPoint({ x: posX, y: posY });
    },
    [drawingRegion]
    );

  const handleMapClick = useCallback(
    (e) => {
      if (locked) return;

      if (!mapRef.current) return;

      const rect = mapRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const posX = (x / rect.width) * 100;
      const posY = (y / rect.height) * 100;

      if (toolMode === 'location') {
        const markerId = Date.now();
        const newPoint = { x: posX, y: posY };
        const containingRegion = findDeepestContainingRegion(newPoint, regions);
        const regionId = containingRegion?.id || null;

        setMarkers((prev) => [...prev, { id: markerId, x: posX, y: posY, locationId: null, regionId}]);
        setEditingLocation({ id: null, tempMarkerId: markerId, name: '', type: 'City', description: '', regionId});
        setSelectedMarkerId(null);
      } else if (toolMode === 'region') {
            if (e.button === 2) {
                if (drawingRegion && drawingRegion.points.length > 0) {
                setDrawingRegion(prev => ({
                    ...prev,
                    points: prev.points.slice(0, -1)
                }));
                }
                return;
            }    
        
            if (!drawingRegion) {
                setPendingClick({ x: posX, y: posY });
                setShowRegionEditor(true);
            } else {
                const newPoints = [...drawingRegion.points, { x: posX, y: posY }];

                if (doesSelfIntersect(newPoints)) {
                    return;
                }

                const newPoint = { x: posX, y: posY };
                const parentRegion = regions.find(r => r.id === drawingRegion.parentId);

                if(!pointInPolygon(newPoint, parentRegion.points) && drawingRegion.type != 'Region'){
                    alert("no no no"); // change once the line color change is implemented.
                    return;
                }
                
                if (drawingRegion?.points.length >= 3) {
                    const firstPoint = drawingRegion.points[0];
                    if (isNearFirstPoint(posX, posY, firstPoint)) {
                        setConfirmRegionModalOpen(true);
                        return;
                    }
                }

                setDrawingRegion((prev) => ({
                    ...prev,
                    points: newPoints,
                }));
            }
        }
    },
    [locked, toolMode, drawingRegion]
  );

  const handleSaveLocation = useCallback(
    (loc) => {
      if (loc.id) {
        setLocations((prev) => prev.map((l) => (l.id === loc.id ? loc : l)));
      } else {
        const newId = Date.now().toString();
        const marker = markers.find((m) => m.id === loc.tempMarkerId);
        const newLocation = {
            ...loc,
            id: newId,
            regionId: marker?.regionId || null,
        };
        setLocations((prev) => [...prev, newLocation]);
        setMarkers((prev) =>
          prev.map((m) => (m.id === loc.tempMarkerId ? { ...m, locationId: newId } : m))
        );
      }
      setEditingLocation(null);
    },
    [markers]
  );

  const handleCancelEdit = useCallback(() => {
    if (editingLocation && !editingLocation.id) {
      setMarkers((prev) => prev.filter((m) => m.id !== editingLocation.tempMarkerId));
    }
    setEditingLocation(null);
  }, [editingLocation]);

  const handleDeleteMarker = useCallback(() => {
    const marker = markers.find((m) => m.id === selectedMarkerId);
    if (marker) {
      setMarkers((prev) => prev.filter((m) => m.id !== marker.id));
      if (marker.locationId) {
        setLocations((prev) => prev.filter((l) => l.id !== marker.locationId));
      }
    }
    setSelectedMarkerId(null);
    setShowDeleteModal(false);
  }, [markers, selectedMarkerId]);

const handleSaveRegion = (name, type) => {
    if (!pendingClick) return;

    const validParentTypes = REGION_HIERARCHY[type] || [];
    const validParentRegions = regions.filter(
        (r) =>
        validParentTypes.includes(r.type) &&
        pointInPolygon(pendingClick, r.points)
    );

    if (validParentRegions.length == 0){
        alert("This region is missing a proper parent region. Please place it in a region of type: "  +
    validParentTypes.join(", "));
        return;
    }

    const parentRegion = findDeepestContainingRegion(pendingClick, validParentRegions);
    const parentRegionId = parentRegion.id;
    console.log(parentRegion.name);

    const newRegion = {
        id: Date.now().toString(),
        name,
        type,
        parentId: parentRegionId,
        points: [pendingClick],
    };

    setDrawingRegion(newRegion);
    setShowRegionEditor(false);
    setPendingClick(null);
};

const handleCancelNewRegion = () => {
  setPendingClick(null);
  setShowRegionEditor(false);
};

const handleFinishRegion = () => {
  if (!drawingRegion || drawingRegion.points.length < 3) return;

  const points = drawingRegion.points;

  if (doesClosingEdgeIntersect(points)) {
    alert("Closing the polygon would cause a self-intersection.");
    return;
  }

  if (drawingRegion.type == 'Region'){
    const parentRegion = findDeepestFullyContainingRegion()
  }

  setRegions((prev) => [...prev, drawingRegion]);
  setDrawingRegion(null);
};

function isNearFirstPoint(clickX, clickY, firstPoint, threshold = 1) {
  const dx = clickX - firstPoint.x;
  const dy = clickY - firstPoint.y;
  return Math.sqrt(dx * dx + dy * dy) <= threshold;
}

function findDeepestContainingRegion(point, regions) {
    console.log("Finding Deepest Region");
    
    const regionMap = Object.fromEntries(regions.map(r => [r.id, r]));
    const childrenMap = {};

    regions.forEach(region => {
        if (region.parentId) {
        if (!childrenMap[region.parentId]) {
            childrenMap[region.parentId] = [];
        }
        childrenMap[region.parentId].push(region);
        }
    });

    function recurse(currentRegion) {
        const children = childrenMap[currentRegion.id] || [];
        for (const child of children) {
        if (pointInPolygon(point, child.points)) {
            return recurse(child);
        }
        }

        return currentRegion;
    }

    const candidates = regions.filter(r => pointInPolygon(point, r.points));
    if (candidates.length === 0) return null;

    let deepest = candidates[0];
    let changed = true;

    while (changed) {
    changed = false;
    const children = regions.filter(r => r.parentId === deepest.id && pointInPolygon(point, r.points));
    if (children.length > 0) {
        deepest = children[0]; // Assumes no overlapping siblings
        changed = true;
    }
    }

    return deepest;
}

function findDeepestFullyContainingRegion(childPoints, regions, allowedParentTypes) {
  const regionMap = Object.fromEntries(regions.map(r => [r.id, r]));
  const childrenMap = {};

  regions.forEach(region => {
    if (region.parentId) {
      if (!childrenMap[region.parentId]) {
        childrenMap[region.parentId] = [];
      }
      childrenMap[region.parentId].push(region);
    }
  });

  function recurse(currentRegion) {
    const children = childrenMap[currentRegion.id] || [];

    for (const child of children) {
      if (
        allowedParentTypes.includes(child.type) &&
        polygonFullyInsidePolygon(childPoints, child)
      ) {
        return recurse(child);
      }
    }

    return currentRegion;
  }

  const candidates = regions.filter(
    r =>
      allowedParentTypes.includes(r.type) &&
      polygonFullyInsidePolygon(childPoints, r)
  );

  if (candidates.length === 0) return null;

  return recurse(candidates[0]);
}
function getDepth(region, regionMap) {
  let depth = 0;
  let current = region;
  while (current?.parentId) {
    current = regionMap[current.parentId];
    depth++;
  }
  return depth;
}


useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && drawingRegion) {
      setDrawingRegion(null);
      setShowRegionEditor(false); // If it's open
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [drawingRegion]);

  const onImageUpload = useCallback((image) => {
    setMapImage(image);
    if (regions.length === 0) {
      setRegions([
        {
          id: 'root',
          name: 'World',
          type: 'World',
          parentId: null,
          points: [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 100 },
            { x: 0, y: 100 },
          ],
        },
      ]);
    }
  }, [regions.length]);

  return (
    <div>
      <MapUploader onImageUpload={onImageUpload} />
      <MapToolbar toolMode={toolMode} setToolMode={setToolMode} />

      {mapImage && (
        <div style={{ display: 'flex', width: '100%', marginTop: 20 }}>
            <div style={{ width: '80%', paddingRight: 10 }}>
                <button onClick={() => setLocked((prev) => !prev)}>
                {locked ? 'Unlock Markers' : 'Lock Markers'}
                </button>
                <div
                ref={mapRef}
                onMouseDown={handleMapClick}
                onMouseMove={handleMouseMove}
                onContextMenu={(e) => e.preventDefault()}
                style={{
                    position: 'relative',
                    display: 'inline-block',
                    border: '1px solid #ccc',
                    maxWidth: '100%',
                    userSelect: 'none',
                }}
                >
                <img
                    src={mapImage}
                    alt="Map"
                    style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
                    draggable={false}
                    />

                {regions.map((region) => (
                    <RegionOverlay key={region.id} region={region} mapRef={mapRef} isDrawing={region === drawingRegion} parentRegion={regions.find(r => r.id === region.parentId)}/>
                ))}

                {markers.map((marker) => (
                    <LocationMarker
                    key={marker.id}
                    marker={marker}
                    selected={selectedMarkerId === marker.id}
                    locked={locked}
                    mapRef={mapRef}
                    onSelect={(id) => {
                        setSelectedMarkerId(id);
                        setEditingLocation(null);
                    }}
                    onDragUpdate={(id, newX, newY) => {
                        setMarkers((prev) =>
                        prev.map((m) => (m.id === id ? { ...m, x: newX, y: newY } : m))
                        );
                    }}
                    />
                ))}

                {drawingRegion && (
                <RegionOverlay region={drawingRegion} mapRef={mapRef} isDrawing  hoverPoint={hoverPoint} parentRegion={regions.find(r => r.id === drawingRegion.parentId)}/>
                )}
                </div>                
            </div>
        
        <div style={{ width: '20%', borderLeft: '1px solid #ccc', paddingLeft: 10 }}>
                {editingLocation ? (
                <LocationEditor
                    location={editingLocation}
                    onSave={handleSaveLocation}
                    onCancel={handleCancelEdit}
                    tempMarkerId={editingLocation.tempMarkerId}
                />
                ) : selectedMarkerId ? (
                selectedLocation ? (
                    <div style={{ border: '1px solid #ccc', padding: 10 }}>
                    <h2>
                        {selectedLocation.name}
                    </h2>
                    <h4>{selectedLocation.type}
                        {selectedLocation.regionId && (
                            <>
                            {' '}in{' '}
                            {regions.find(r => r.id === selectedLocation.regionId)?.name || 'Unknown Region'}
                            </>
                        )}
                    </h4>
                    <p>{selectedLocation.description || 'No description'}</p>
                    <button onClick={() => setEditingLocation(selectedLocation)}>Edit</button>
                    <button
                        onClick={() => setSelectedMarkerId(null)}
                        style={{ marginLeft: 10 }}
                    >
                        Close
                    </button>
                    <button
                        style={{ marginTop: 10, color: 'red' }}
                        onClick={() => setShowDeleteModal(true)}
                    >
                        Delete Marker
                    </button>
                    </div>
                ) : (
                    <div style={{ fontStyle: 'italic', color: '#666' }}>
                    This marker has no location linked yet.
                    </div>
                )
                ) : (
                <div style={{ fontStyle: 'italic', color: '#666' }}>
                    Click a marker to view or edit location info
                </div>
                )}
        </div>

          {showDeleteModal && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 2000,
              }}
            >
              <div
                style={{
                  backgroundColor: '#fff',
                  padding: 20,
                  borderRadius: 8,
                  width: 300,
                  textAlign: 'center',
                }}
              >
                <p>Are you sure you want to delete this marker and its location? All deletions are permanent.</p>
                <button onClick={handleDeleteMarker} style={{ color: 'red', marginRight: 10 }}>
                  Delete
                </button>
                <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
        )}
        {showRegionEditor && (
            <RegionEditor
                initialName=""
                initialType="Region"
                onSave={handleSaveRegion}
                onCancel={handleCancelNewRegion}
            />
            )}
        {confirmRegionModalOpen && (
            <div
                style={{
                position: 'fixed',
                top: 0, left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
              }}
            >
                <div style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    minWidth: '300px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    }}
                >
                    <h3>Finish Region</h3>
                    <p>Do you want to finish this region?</p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button onClick={() => {
                            setConfirmRegionModalOpen(false);
                            handleFinishRegion();
                            }}>Confirm</button>
                        <button onClick={() => setConfirmRegionModalOpen(false)}>Cancel</button>
                    </div>
              </div>

            </div>
        )}
    </div>
  );
}

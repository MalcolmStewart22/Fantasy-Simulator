import React, { useState, useRef, useCallback, useEffect } from 'react';
import MapUploader from './MapUploader';
import LocationMarker from './LocationMarker';
import NewLocationModal from './NewLocationModal';
import MapToolbar from './MapToolbar';
import RegionOverlay from './RegionOverlay';
import NewRegionModal from './NewRegionModal';
import Sidebar from './Sidebar';
import { doesSelfIntersect, linesIntersect, doesClosingEdgeIntersect, pointInPolygon, polygonFullyInsidePolygon } from '../utils/PolygonUtils';

export default function MapViewer() {
    const [mapImage, setMapImage] = useState(null);
    const [locked, setLocked] = useState(false);
    const [toolMode, setToolMode] = useState('selection');

    const [pendingClick, setPendingClick] = useState(null);
    const [hoverPoint, setHoverPoint] = useState(null);

    const [locations, setLocations] = useState([]);
    const [regions, setRegions] = useState([]);
    const [markers, setMarkers] = useState([]);

    const [selectedMarkerId, setSelectedMarkerId] = useState(null);
    const [newLocation, setNewLocation] = useState(null);
    const [newRegion, setNewRegion] = useState(false);
    const [drawingRegion, setDrawingRegion] = useState(null);
    const [selectedRegion, setSelectedRegion] = useState(null);

    const REGION_HIERARCHY = {
        World: [],
        Continent: ['World'],
        Country: ['Continent'],
        Province: ['Country'],
        Region: ['World','Continent', 'Country', 'Province'],
    };

    const mapRef = useRef(null);
    const selectedMarker = markers.find((m) => m.id === selectedMarkerId);
    const selectedLocation = selectedMarker ? locations.find((l) => l.id === selectedMarker.locationId) : null;

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
                const tempId = Date.now();
                const newPoint = { x: posX, y: posY };
                const containingRegion = findDeepestContainingRegion(newPoint, regions);
                const regionId = containingRegion?.id || null;

                setMarkers((prev) => [...prev, { id: tempId, x: posX, y: posY, locationId: null, regionId}]);
                setNewLocation({ id: null, markerId: tempId, name: '', type: 'City', description: '', regionId});
                setSelectedMarkerId(null);            
            } else if (toolMode === 'region') {
                if (e.button === 2) { // fix right clicking away the first point but not cancelling the region
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
                    setNewRegion(true);
                } else {
                    const newPoints = [...drawingRegion.points, { x: posX, y: posY }];

                    if (doesSelfIntersect(newPoints)) {
                        return;
                    }

                    const newPoint = { x: posX, y: posY };
                    const parentRegion = regions.find(r => r.id === drawingRegion.parentId);

                    //Apparently the git issue broke this. Look into!
                    if(!pointInPolygon(newPoint, parentRegion.points) && !drawingRegion.type == 'Region'){
                        console.log("Point outside of parent!");
                        return;
                    }
                        
                    if (drawingRegion?.points.length >= 3) {
                        const firstPoint = drawingRegion.points[0];
                        if (isNearFirstPoint(posX, posY, firstPoint)) {
                            handleFinishRegion();
                            return;
                        }
                    }
                    setDrawingRegion((prev) => ({
                        ...prev,
                        points: newPoints,
                    }));
                }
            } else if (toolMode === 'selection') {
                const clickPoint = { x: posX, y: posY };
                const sortedRegions = [...regions].sort((a, b) => b.points.length - a.points.length);
                const clickedRegion = findDeepestContainingRegion(clickPoint, sortedRegions);
                setSelectedMarkerId(null);
                
                if (clickedRegion) {
                    
                    setSelectedRegion(clickedRegion);
                } else {
                    setSelectedRegion(null);
                }

                return;
            }
        },
        [locked, toolMode, drawingRegion]
    );

//#region Location Marker Functions
  const handleSaveLocation = useCallback(
    (loc) => {
      if (loc.id) {
        setLocations((prev) => prev.map((l) => (l.id === loc.id ? loc : l)));
      } else {
        const newId = Date.now().toString();
        const marker = markers.find((m) => m.id === loc.markerId);
        const newLocation = {
            ...loc,
            id: newId,
            regionId: marker?.regionId || null,
        };

        
        setLocations((prev) => [...prev, newLocation]);
        setMarkers((prev) =>
          prev.map((m) => (m.id === loc.markerId ? { ...m, locationId: newId } : m))
        );
      }
      setNewLocation(null);
    },
    [markers]
  );

  const handleCancelEdit = useCallback(() => {
    if (newLocation && !newLocation.id) {
      setMarkers((prev) => prev.filter((m) => m.id !== newLocation.markerId));
    }
    setNewLocation(null);
  }, [newLocation]);

  const handleDeleteMarker = (locationToDelete) => {
        const confirm = window.confirm(`Delete location "${locationToDelete.name}"? This cannot be undone.`);
        if (!confirm) {return;}

        console.log()
        setMarkers((prev) => prev.filter((m) => m.id !== locationToDelete.markerId));
        setLocations((prev) => prev.filter((l) => l.id !== locationToDelete.id));
 
        setSelectedMarkerId(null);
  };
//#endregion

//#region Region functions
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
            children: [],
            markers: [],
        };

        setDrawingRegion(newRegion);
        setNewRegion(false);
        setPendingClick(null);
    };

    const handleCancelNewRegion = () => {
    setPendingClick(null);
    setNewRegion(false);
    };

    const handleFinishRegion = () => {
        if (!drawingRegion || drawingRegion.points.length < 3) return;

        const points = drawingRegion.points;

        if (doesClosingEdgeIntersect(points)) {
            alert("Closing the polygon would cause a self-intersection.");
            return;
        }

        if (drawingRegion.type == 'Region'){
            const validParentTypes = REGION_HIERARCHY[drawingRegion.type] || [];
            const validParentRegions = regions.filter((r) => validParentTypes.includes(r.type));
            drawingRegion.parentId = findDeepestFullyContainingRegion(drawingRegion.points, validParentRegions).id

            console.log("Updated Parent region to: ", regions.find(r => r.id === drawingRegion.parentId).name)
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

    function findDeepestFullyContainingRegion(childPoints, regions) {
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
        if (polygonFullyInsidePolygon(childPoints, child)) {
            return recurse(child);
        }
        }

        return currentRegion;
    }

    const candidates = regions.filter(r => polygonFullyInsidePolygon(childPoints, r));

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

    const handleDeleteRegion = (regionToDelete) => {
        const confirm = window.confirm(`Delete region "${regionToDelete.name}"? This cannot be undone.`);
        if (!confirm) return;

        setRegions(prev =>
            prev.filter(region => region.id !== regionToDelete.id)
                .map(region => ({
                    ...region,
                    children: region.children?.filter(id => id !== regionToDelete.id) || []
                }))
        );

        setSelectedRegion(null);
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && drawingRegion) {
                setDrawingRegion(null);
                setNewRegion(false); // If it's open
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [drawingRegion]);

//#endregion

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
                            setNewLocation(null);
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
    
                <Sidebar
                    selectedLocation={selectedLocation}
                    selectedRegion={selectedRegion}
                    regions={regions}
                    onEditLocation={setNewLocation}
                    onDeleteMarker={handleDeleteMarker}
                    onDeleteRegion={handleDeleteRegion}
                />
            </div>
        )}

        {newLocation && (
            <NewLocationModal
                location={newLocation}
                onSave={handleSaveLocation}
                onCancel={handleCancelEdit}
                markerId={newLocation.markerId}
            />
        )}

        {newRegion && (
            <NewRegionModal
                initialName=""
                initialType="Region"
                onSave={handleSaveRegion}
                onCancel={handleCancelNewRegion}
            />
        )}
    </div>
  );
}

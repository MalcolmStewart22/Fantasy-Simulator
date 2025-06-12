import { doesSelfIntersect, linesIntersect, pointInPolygon } from '../utils/PolygonUtils';
import React, { useState }  from 'react';

export default function RegionOverlay({ region, mapRef, isDrawing = false, hoverPoint = null, parentRegion = null }) {
    const [tooltipVisible, setTooltipVisible] = useState(false);
    
    if (!region?.points?.length || !mapRef?.current) return null;

    const rect = mapRef.current.getBoundingClientRect();
    const scaleX = rect.width / 100;
    const scaleY = rect.height / 100;

    const scaledHoverPoint = hoverPoint
        ? { x: hoverPoint.x * scaleX, y: hoverPoint.y * scaleY }
        : null;
    const scaledPointsArr = region.points.map(p => ({ x: p.x * scaleX, y: p.y * scaleY }));
    

    const scaledPointsStr = [...scaledPointsArr, ...(scaledHoverPoint ? [scaledHoverPoint] : [])]
        .map(p => `${p.x},${p.y}`)
        .join(' ');


    const firstPoint = scaledPointsArr[0];
    const lastPoint = scaledPointsArr[scaledPointsArr.length - 1];

    const isRoot = region.type === 'World';

    const lineIntersectsPolygon = (start, end, points) => {
        const len = points.length;

        for (let i = 0; i < len - 1; i++) {
            const a1 = points[i];
            const a2 = points[i + 1];

            if ((start === a1 && end === a2) || (start === a2 && end === a1)) {
            continue;
            }

            if (linesIntersect(start, end, a1, a2)) {
            return true;
            }
        }

        return false;
    };

    let validCurrentLine = scaledHoverPoint
        ?  !lineIntersectsPolygon(lastPoint, scaledHoverPoint, scaledPointsArr)
    : false;

    const closingLineIntersects = scaledHoverPoint
        ? lineIntersectsPolygon(scaledHoverPoint, firstPoint, scaledPointsArr)
        : false;
        
    if (region.type != 'Continent' && region.type != 'World' && hoverPoint && region.type != 'Region'){
        const scaledParentsPoints = parentRegion.points.map(p => ({ x: p.x * scaleX, y: p.y * scaleY}));
        const selfIntersects = lineIntersectsPolygon(lastPoint, scaledHoverPoint, scaledPointsArr);
        const isInsideParent = pointInPolygon(scaledHoverPoint, scaledParentsPoints);

        if (!selfIntersects && isInsideParent){
            validCurrentLine = true;
        } else {
            validCurrentLine = false;
        }
    }

    return (
        <svg
            viewBox={`0 0 ${rect.width} ${rect.height}`}
            preserveAspectRatio="none"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
            }}
        >
            <polygon
                points={scaledPointsStr}
                fill={
                isRoot ? 'none' : isDrawing ? 'rgba(0, 123, 255, 0.3)' : 'rgba(0, 128, 255, 0.2)'
                }
                stroke={
                isRoot ? 'none' : isDrawing ? 'rgba(0, 123, 255, 0.8)' : 'blue'
                }
                strokeWidth={isRoot ? 0 : 2}
            />

            {hoverPoint && (
                <line
                x1={lastPoint.x}
                y1={lastPoint.y}
                x2={scaledHoverPoint.x}
                y2={scaledHoverPoint.y}
                stroke={validCurrentLine ? 'blue' :'red' }
                strokeWidth={2}
                />
            )}

            {hoverPoint && (
                <line
                x1={scaledHoverPoint.x}
                y1={scaledHoverPoint.y}
                x2={firstPoint.x}
                y2={firstPoint.y}
                stroke={closingLineIntersects ? 'yellow' : 'blue'}
                strokeWidth={2}
                />
            )}
            {isDrawing && scaledPointsArr.length > 0 && (
                <circle
                    cx={scaledPointsArr[0].x}
                    cy={scaledPointsArr[0].y}
                    r={6}
                    fill="white"
                    stroke="blue"
                    strokeWidth={2}
                    style={{ pointerEvents: 'auto' }}
                    onMouseEnter={() => setTooltipVisible(true)}
                    onMouseLeave={() => setTooltipVisible(false)}
                />
            )}
            {tooltipVisible && (
                <foreignObject x={scaledPointsArr[0].x + 10} y={scaledPointsArr[0].y - 10} width={150} height={30} style={{ pointerEvents: 'auto' }}>
                    <div className="tooltip"
                    style={{
                        background: 'rgba(255, 254, 254, 0.8)',
                        color: 'black',
                        padding: '4px 10px',
                        fontSize: '12px',
                        display: 'inline-block',
                        borderRadius: '4px'}}
                    >Click to finish region</div>
                </foreignObject>
            )}
        </svg>
    );
}


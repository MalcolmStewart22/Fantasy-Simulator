export function linesIntersect(a, b, c, d) {

  const det = (b.x - a.x) * (d.y - c.y) - (d.x - c.x) * (b.y - a.y);
  if (det === 0) return false;

  const lambda = ((d.y - c.y) * (d.x - a.x) + (c.x - d.x) * (d.y - a.y)) / det;
  const gamma = ((a.y - b.y) * (d.x - a.x) + (b.x - a.x) * (d.y - a.y)) / det;

  return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
}

export function doesSelfIntersect(points) {
  const len = points.length;
  if (len < 4) return false;

  for (let i = 0; i < len - 1; i++) {
    const a1 = points[i];
    const a2 = points[i + 1];

    for (let j = 0; j < len - 1; j++) {
      if (
        Math.abs(i - j) <= 1 ||
        (i === 0 && j === len - 2)
      ) {
        continue;
      }

      const b1 = points[j];
      const b2 = points[j + 1];

      if (linesIntersect(a1, a2, b1, b2)) {
        return true;
      }
    }
  }

  return false;
}

export function doesClosingEdgeIntersect(points) {
  const len = points.length;
  if (len < 3) return false;

  const closingStart = points[len - 1];
  const closingEnd = points[0];

  for (let i = 0; i < len - 2; i++) {
    const segStart = points[i];
    const segEnd = points[i + 1];

    if (
      (segStart === closingStart && segEnd === closingEnd) ||
      (segEnd === closingStart && segStart === closingEnd)
    ) {
      continue;
    }

    if (linesIntersect(segStart, segEnd, closingStart, closingEnd)) {
      return true;
    }
  }

  return false;
}

export function pointInPolygon(point, polygon) {
  let inside = false;
  const { x, y } = point;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;

    const intersect = ((yi > y) !== (yj > y)) &&
                      (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
}

export function polygonFullyInsidePolygon(childPoints, parentPolygon) {
  return childPoints.every((pt) => pointInPolygon(pt, parentPolygon.points));
}
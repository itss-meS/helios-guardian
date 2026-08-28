import { CatmullRomCurve3, Vector3 } from 'three';

export function generateFlightPath(start, target, waypoints = 3, altitude = 50) {
  const points = [new Vector3(...start)];
  
  // Ascend vertically first
  points.push(new Vector3(start[0], altitude, start[2]));
  
  // Intermediate control points for curve
  for(let i=1; i<=waypoints; i++) {
    const t = i / (waypoints + 1);
    const x = start[0] + (target[0] - start[0]) * t + (Math.random()-0.5)*10;
    const z = start[2] + (target[2] - start[2]) * t + (Math.random()-0.5)*10;
    points.push(new Vector3(x, altitude + Math.sin(t*Math.PI)*5, z));
  }
  
  // Descend to target (hover 5m above panel)
  points.push(new Vector3(target[0], 8, target[2]));
  points.push(new Vector3(target[0], 5, target[2])); // Inspection hover point

  return new CatmullRomCurve3(points);
}

export function getPointOnCurve(curve, t) {
  const pt = curve.getPointAt(t);
  return [pt.x, pt.y, pt.z];
}

export function getTangentOnCurve(curve, t) {
  const tan = curve.getTangentAt(t);
  return [tan.x, tan.y, tan.z];
}

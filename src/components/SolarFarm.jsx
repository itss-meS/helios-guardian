import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Matrix4, Color, Vector3, BoxGeometry, MeshStandardMaterial, BufferAttribute } from 'three';
import { useStore } from '../stores/useStore';
import { FARM_CONFIG } from '../utils/panelGenerator';

export function SolarFarm({ viewMode }) {
  const panelsMap = useStore(s => s.panels);
  const panelsArray = useMemo(() => Array.from(panelsMap.values()), [panelsMap.size]); // Recompute only on count change
  const count = panelsArray.length;
  
  const dummy = useRef(new Matrix4()).current;
  const color = useRef(new Color()).current;
  const meshRef = useRef(null);
  const colorsRef = useRef(null);
  const matricesRef = useRef(null);

  // 1. Initialize Geometry & Material (Once)
  const geometry = useMemo(() => {
    const geo = new BoxGeometry(FARM_CONFIG.panelWidth, 0.05, FARM_CONFIG.panelHeight);
    // Rotate geometry locally so instance matrix only handles position
    geo.rotateX(-FARM_CONFIG.tilt); 
    return geo;
  }, []);
  
  const material = useMemo(() => new MeshStandardMaterial({
    color: 0x1a1a2e, // Base dark color
    metalness: 0.8,
    roughness: 0.2,
    vertexColors: true, // CRITICAL: Allows per-instance color via attribute
    side: 2 // DoubleSide
  }), []);

  // 2. Setup InstancedMesh Ref
  useEffect(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;
    mesh.count = count;
    mesh.instanceMatrix.setUsage(35048); // DynamicDraw
    mesh.instanceColor = new BufferAttribute(new Float32Array(count * 3), 3); // RGB per instance
    mesh.instanceColor.setUsage(35048);
    colorsRef.current = mesh.instanceColor.array;
    matricesRef.current = mesh.instanceMatrix.array;
  }, [count]);

  // 3. Update Matrices & Colors (Run once on data change, or per frame if animating)
  // We use useFrame but only write when data version changes for performance
  const dataVersion = useStore(s => s.ai.lastCycle);
  
  useFrame(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;
    let needsMatrixUpdate = false; // Matrices static unless layout changes
    let needsColorUpdate = true;   // Colors change every AI cycle
    
    if (needsColorUpdate) {
      const arr = colorsRef.current;
      let i = 0;
      panelsArray.forEach(p => {
        let r=0, g=0, b=0;
        const h = p.health;
        
        if (viewMode === 'HEALTH') {
          if (h > 0.75) { r=0.0; g=1.0; b=0.2; } // Green
          else if (h > 0.4) { r=1.0; g=0.8; b=0.0; } // Orange
          else { r=1.0; g=0.1; b=0.1; } // Red
        } else if (viewMode === 'TEMPERATURE') {
          const t = Math.min(1, p.temperature / 80);
          r = t; g = 1-t; b = 0.2;
        } else if (viewMode === 'ANOMALY') {
          const a = p.anomalyScore;
          r = a; g = 1-a; b = 0.5;
        } else { // IRRADIANCE
          const ir = Math.min(1, p.irradiance / 1200);
          r = 0.2; g = ir; b = 1-ir;
        }
        
        // Highlight Selected
        if (useStore.getState().selectedPanelId === p.id) { r=0; g=1; b=1; } // Cyan
        
        arr[i++] = r; arr[i++] = g; arr[i++] = b;
      });
      mesh.instanceColor.needsUpdate = true;
    }
  }, [panelsArray, viewMode, dataVersion]); // Dependencies

  // Raycasting Support (Drei handles this via onPointerOver on mesh)
  return (
    <InstancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={true}
      receiveShadow
      castShadow
      onPointerOver={e => { 
        const id = e.instanceId; 
        if(id !== undefined) useStore.getState().selectPanel(id); 
      }}
      onClick={e => { 
        const id = e.instanceId; 
        if(id !== undefined) useStore.getState().selectPanel(id); 
      }}
    />
  );
}

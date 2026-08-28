import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { SolarFarm } from './SolarFarm';
import { Drone } from './Drone';
import { ScanPulse } from './effects/ScanPulse';
import { useStore } from '../stores/useStore';
import { useFrame } from '@react-three/fiber';

export function Scene() {
  const viewMode = useStore(s => s.viewMode);
  
  // Camera Rig for "Satellite View" default
  return (
    <Canvas 
      camera={{ position: [0, 200, 200], fov: 30 }} 
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      style={{ touchAction: 'none' }}
    >
      <fog attach="fog" args={['#050812', 100, 500]} />
      
      <Environment 
        preset="city" 
        background={false} 
        files={['/textures/px.png', '/textures/nx.png', '/textures/py.png', '/textures/ny.png', '/textures/pz.png', '/textures/nz.png']} 
      />
      
      <PerspectiveCamera makeDefault position={[0, 200, 200]} fov={30} />
      <OrbitControls 
        enablePan={true} 
        minZoom={50} 
        maxZoom={500} 
        maxPolarAngle={Math.PI / 2.1} 
        target={[0, 0, 0]} 
      />
      
      {/* Lighting */}
      <directionalLight position={[100, 200, 100]} intensity={2.5} castShadow>
        <orthographicCamera attach="shadow" args={[-200, 200, 200, -200, 0.1, 500]} />
      </directionalLight>
      <ambientLight intensity={0.8} color="#ffffff" />
      <hemisphereLight groundColor="#1a1a2e" skyColor="#87ceeb" intensity={1.5} />
      
      {/* Ground Plane */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#0d1522" roughness={0.9} metalness={0.1} />
      </mesh>
      
      {/* Core Objects */}
      <SolarFarm viewMode={viewMode} />
      <Drone />
      <ScanPulse />
      
      {/* Frame Loop for Drone Animation */}
      <DroneAnimator />
    </Canvas>
  );
}

// Separate component for drone animation loop to avoid re-renders
function DroneAnimator() {
  const { drone, setDroneProgress, setDroneState, panels, addAlert, updatePanel } = useStore();
  const { state, path, progress, target, position } = drone;
  
  useFrame((_, delta) => {
    if (state === 'EN_ROUTE' && path) {
      const newProgress = Math.min(1, progress + delta * 0.15); // Speed factor
      const pos = getPointOnCurve(path, newProgress);
      const tangent = getTangentOnCurve(path, newProgress);
      
      setDroneProgress(newProgress, pos);
      
      // Rotate drone to face tangent (handled in Drone.jsx via lookAt)
      
      if (newProgress >= 1) {
        setDroneState('INSPECTING');
        // Trigger Inspection Logic
        setTimeout(() => {
          const panel = panels.get(target);
          if(panel) {
            // SIMULATE GROUND TRUTH: Drone finds reality is slightly worse or better
            const verifiedHealth = Math.max(0, panel.health - 0.05 + Math.random() * 0.1); 
            const damageType = panel.damageType || 'UNKNOWN';
            
            // Send to AI Worker
            window.aiWorker?.postMessage({ type: 'DRONE_REPORT', payload: { panelId: target, verifiedHealth, damageType } });
            
            addAlert({ id: Date.now(), panelId: target, type: 'INSPECTION_COMPLETE', message: `Inspection Complete: ${damageType}. Health: ${(verifiedHealth*100).toFixed(0)}%`, time: Date.now(), acknowledged: false });
          }
          setDroneState('RETURNING');
        }, 2000); // Hover 2s inspecting
      }
    } 
    else if (state === 'RETURNING' && path) {
      // Reverse path home
      const newProgress = Math.max(0, progress - delta * 0.2);
      const pos = getPointOnCurve(path, newProgress);
      setDroneProgress(newProgress, pos);
      if (newProgress <= 0) setDroneState('IDLE');
    }
  });
  
  return null;
}

// Helper imports for animator
import { getPointOnCurve, getTangentOnCurve } from '../utils/dronePath';

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh, BoxGeometry, CylinderGeometry, MeshStandardMaterial, Vector3, Quaternion, Euler } from 'three';
import { useStore } from '../stores/useStore';
import { getTangentOnCurve } from '../utils/dronePath';

export function Drone() {
  const { drone } = useStore();
  const { position, state, path, progress } = drone;
  const groupRef = useRef();
  const bodyRef = useRef();
  const propsRef = useRef([]); // 4 propellers
  
  // Build Drone Model Procedurally
  useEffect(() => {
    if (!groupRef.current) return;
    const g = groupRef.current;
    // Body
    const bodyMat = new MeshStandardMaterial({ color: 0x111827, metalness: 0.9, roughness: 0.1 });
    const armMat = new MeshStandardMaterial({ color: 0x374151, metalness: 0.8, roughness: 0.2 });
    const propMat = new MeshStandardMaterial({ color: 0x1f2937, metalness: 0.5, roughness: 0.5, transparent: true, opacity: 0.7 });
    const lightMat = new MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 5 });
    
    // Arms (X shape)
    for(let i=0; i<4; i++) {
      const angle = (i * Math.PI/2) + Math.PI/4;
      const arm = new Mesh(new BoxGeometry(0.15, 0.05, 1.2), armMat);
      arm.position.set(Math.cos(angle)*0.6, 0, Math.sin(angle)*0.6);
      arm.rotation.y = angle;
      arm.castShadow = true;
      g.add(arm);
      
      // Motor
      const motor = new Mesh(new CylinderGeometry(0.1, 0.1, 0.1, 8), bodyMat);
      motor.position.set(Math.cos(angle)*1.15, 0.05, Math.sin(angle)*1.15);
      motor.castShadow = true;
      g.add(motor);
      
      // Propeller
      const prop = new Mesh(new BoxGeometry(1.0, 0.01, 0.15), propMat);
      prop.position.set(Math.cos(angle)*1.15, 0.1, Math.sin(angle)*1.15);
      prop.rotation.y = angle;
      propsRef.current.push(prop);
      g.add(prop);
      
      // Lights
      const light = new Mesh(new BoxGeometry(0.1, 0.05, 0.1), i < 2 ? lightMat : new MeshStandardMaterial({color:0xff0000, emissive:0xff0000, emissiveIntensity:5}));
      light.position.set(Math.cos(angle)*1.15, -0.05, Math.sin(angle)*1.15);
      g.add(light);
    }
    
    // Center Body
    const body = new Mesh(new BoxGeometry(0.4, 0.2, 0.4), bodyMat);
    body.position.y = 0.1;
    body.castShadow = true;
    bodyRef.current = body;
    g.add(body);
    
    // Camera Gimbal (Front)
    const gimbal = new Mesh(new BoxGeometry(0.15, 0.15, 0.2), new MeshStandardMaterial({color:0x000, metalness:1, roughness:0}));
    gimbal.position.set(0, 0, -0.3);
    g.add(gimbal);
  }, []);

  // Animation Loop
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const g = groupRef.current;
    
    // 1. Position & Rotation (Follow Path)
    if (path && (state === 'EN_ROUTE' || state === 'RETURNING')) {
      const tangent = getTangentOnCurve(path, progress);
      // Look at tangent direction
      const targetQuat = new Quaternion().setFromUnitVectors(new Vector3(0,0,-1), new Vector3(tangent[0], tangent[1], tangent[2]).normalize());
      g.quaternion.slerp(targetQuat, 0.1);
      
      // Position is set by Store (DroneAnimator)
      g.position.set(...position);
    } else if (state === 'INSPECTING') {
      // Hover & Yaw scan
      g.position.lerp(new Vector3(...position), 0.05);
      g.rotation.y += delta * 0.5; // Slow spin for 360 scan
    } else { // IDLE
      g.position.lerp(new Vector3(...position), 0.05);
      // Gentle idle bob
      g.position.y += Math.sin(performance.now() * 0.001) * 0.01;
    }
    
    // 2. Propeller Spin
    const speed = state === 'IDLE' ? 10 : 50;
    propsRef.current.forEach((p, i) => {
      p.rotation.x += delta * speed * (i % 2 === 0 ? 1 : -1); // Counter rotating
    });
    
    // 3. Body Tilt (Banking)
    if(bodyRef.current) {
      // Simulate banking based on velocity change (simplified)
      bodyRef.current.rotation.z = Math.sin(progress * Math.PI * 4) * 0.1; 
    }
  });

  return <group ref={groupRef} position={position} />;
}

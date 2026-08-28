import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Color, RingGeometry, ShaderMaterial, AdditiveBlending } from 'three';
import { useStore } from '../../stores/useStore';

export function ScanPulse() {
  const { ai, panels } = useStore();
  const pulseRef = useRef();
  const timeRef = useRef(0);

  const material = useMemo(() => new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uColor: { value: new Color(0x00ffff) }, uRadius: { value: 1 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform float uTime; uniform vec3 uColor; varying vec2 vUv;
      void main(){ 
        float dist = length(vUv - 0.5); 
        float ring = smoothstep(0.48, 0.5, dist) - smoothstep(0.5, 0.52, dist);
        float pulse = sin(uTime * 5.0 - dist * 20.0) * 0.5 + 0.5;
        gl_FragColor = vec4(uColor, ring * pulse * 0.5);
      }
    `
  }), []);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if(pulseRef.current) pulseRef.current.material.uniforms.uTime.value = timeRef.current;
    
    // Trigger pulse on AI cycle
    if (ai.lastCycle > (pulseRef.current?.userData?.lastTrigger || 0)) {
      pulseRef.current.userData.lastTrigger = ai.lastCycle;
      // Could spawn expanding ring at drone position or center
    }
  });

  return (
    <mesh
      ref={pulseRef}
      geometry={new RingGeometry(50, 250, 64)}
      material={material}
      rotation={[-Math.PI/2, 0, 0]}
      position={[0, 0.2, 0]}
      scale={0.5}
    />
  );
}

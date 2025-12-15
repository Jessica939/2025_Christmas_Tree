import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '../context';
import { AppMode, COLORS } from '../types';

export const GlowingStar: React.FC = () => {
  const ref = useRef<THREE.Group>(null);
  const { mode } = useAppStore();
  const lerpScale = useRef(1);

  // Create a 5-pointed star shape
  const starShape = useMemo(() => {
    const shape = new THREE.Shape();
    const points = 5;
    const outerRadius = 0.5;
    const innerRadius = 0.22; // Slightly sharper inner angles

    for (let i = 0; i < points * 2; i++) {
      const r = (i % 2 === 0) ? outerRadius : innerRadius;
      // Angle offset to make it point upwards correctly
      const a = (i / (points * 2)) * Math.PI * 2; 
      // Rotate by -PI/2 to align top point with Y axis if drawing in XY
      const x = Math.cos(a + Math.PI / 2) * r;
      const y = Math.sin(a + Math.PI / 2) * r;
      
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    return shape;
  }, []);

  const extrudeSettings = useMemo(() => ({
    depth: 0.2,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 2
  }), []);

  useFrame((state, delta) => {
    if (!ref.current) return;

    // Bobbing motion 
    // Adjusted Height 3.6 for 0.6 scale tree
    ref.current.position.y = 3.6 + Math.sin(state.clock.elapsedTime) * 0.1;
    ref.current.rotation.y += delta * 0.5;

    // Hide/Explode Logic
    const targetScale = mode === AppMode.EXPLODE ? 0 : 1;
    lerpScale.current = THREE.MathUtils.lerp(lerpScale.current, targetScale, delta * 3);
    ref.current.scale.setScalar(lerpScale.current);
  });

  return (
    <group ref={ref} position={[0, 3.6, 0]}>
      {/* 3D Star Shape */}
      <mesh rotation={[0, 0, 0]}>
        <extrudeGeometry args={[starShape, extrudeSettings]} />
        <meshStandardMaterial 
            color={COLORS.gold} 
            emissive={COLORS.gold} 
            // Reduced intensity by 1/5 (from 2.0 to 1.6)
            emissiveIntensity={1.6} 
            toneMapped={false} 
            roughness={0.1}
            metalness={1}
        />
      </mesh>
      
      {/* Outer Halo mesh removed as requested */}
      
      {/* Point light remains for environment illumination */}
      <pointLight color={COLORS.gold} intensity={1.6} distance={6} decay={2} />
    </group>
  );
};
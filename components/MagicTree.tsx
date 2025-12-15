import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '../context';
import { AppMode, COLORS, COUNTS } from '../types';

// Helper to generate random point in sphere
const randomSpherePoint = (radius: number) => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  const sinPhi = Math.sin(phi);
  return new THREE.Vector3(
    r * sinPhi * Math.cos(theta),
    r * sinPhi * Math.sin(theta),
    r * Math.cos(phi)
  );
};

interface ParticleSystemProps {
  count: number;
  color: string;
  shape: 'octahedron' | 'cube' | 'tetrahedron' | 'icosahedron';
  scale: number;
  type: 'leaf' | 'ornament' | 'ribbon';
  direction?: number; // 1 for normal (CCW), -1 for reverse (CW)
}

const ParticleSystem: React.FC<ParticleSystemProps> = ({ count, color, shape, scale, type, direction = 1 }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { mode, rotationOffset } = useAppStore();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Pre-calculate positions for both states
  const { treePositions, explodePositions, phases, randomScales } = useMemo(() => {
    const tree = new Float32Array(count * 3);
    const explode = new Float32Array(count * 3);
    const p = new Float32Array(count);
    const s = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      p[i] = Math.random() * Math.PI * 2; // Random phase
      s[i] = Math.random(); // Random scale factor

      // 1. EXPLODE STATE: Random Sphere
      const pExplode = randomSpherePoint(25); 
      explode[i3] = pExplode.x;
      explode[i3 + 1] = pExplode.y;
      explode[i3 + 2] = pExplode.z;

      // 2. TREE STATE: Cone / Spiral
      let x, y, z;
      
      if (type === 'ribbon') {
        // Ribbon Logic: Spiral Cloud
        const t = i / count; // 0 (bottom) to 1 (top)
        const height = 18;
        
        // Move ribbon down
        y = (t * height) - (height / 2) - 2.0; 
        
        // Ribbon Radius 
        // Increased base from 7.2 to 8.5 to double the gap from tree surface.
        // Tree surface at bottom is ~6.0. Old Gap ~1.2. New Gap ~2.5.
        const radiusAtHeight = 8.5 * (1 - t * 0.95); 
        const revolutions = 3.5;
        const angle = t * Math.PI * 2 * revolutions;
        
        // Taper: Thick bottom, thin top
        const taperFactor = (1.0 - t) * 1.7 + 0.1; 
        
        // Base thickness randomized, then tapered
        const tubeRadius = (0.3 + Math.random() * 0.6) * taperFactor;
        const tubeAngle = Math.random() * Math.PI * 2;
        
        const baseX = Math.cos(angle) * (radiusAtHeight + 1.0);
        const baseZ = Math.sin(angle) * (radiusAtHeight + 1.0);

        x = baseX + Math.cos(tubeAngle) * tubeRadius;
        z = baseZ + Math.sin(tubeAngle) * tubeRadius;
        y += (Math.random() - 0.5) * 0.5; // Vertical jitter

      } else {
        // Leaves/Ornaments: Volume of Cone
        const height = 16;
        y = (Math.random() * height) - (height / 2); // -8 to 8
        const hNormalized = (y + (height / 2)) / height; // 0 to 1
        
        // Cone Logic:
        // Changed factor to 0.99 for a sharper, needle-like tip
        const maxRadius = 6.0 * (1 - hNormalized * 0.99);
        
        if (type === 'ornament') {
            const r = maxRadius * (0.8 + Math.random() * 0.3);
            const angle = Math.random() * Math.PI * 2;
            x = Math.cos(angle) * r;
            z = Math.sin(angle) * r;
        } else {
            const r = maxRadius * Math.pow(Math.random(), 0.4);
            const angle = Math.random() * Math.PI * 2;
            x = Math.cos(angle) * r;
            z = Math.sin(angle) * r;
        }
      }

      tree[i3] = x;
      tree[i3 + 1] = y;
      tree[i3 + 2] = z;
    }

    return { treePositions: tree, explodePositions: explode, phases: p, randomScales: s };
  }, [count, type]);

  const lerpFactor = useRef(0);
  const groupRotation = useRef(0);

  useLayoutEffect(() => {
     if(meshRef.current) {
         for (let i = 0; i < count; i++) {
             dummy.position.set(treePositions[i*3], treePositions[i*3+1], treePositions[i*3+2]);
             dummy.scale.setScalar(scale);
             dummy.updateMatrix();
             meshRef.current.setMatrixAt(i, dummy.matrix);
         }
         meshRef.current.instanceMatrix.needsUpdate = true;
     }
  }, [count, scale, treePositions, dummy]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // 1. Update Mode Interpolation
    const targetLerp = mode === AppMode.EXPLODE ? 1 : 0;
    lerpFactor.current = THREE.MathUtils.lerp(lerpFactor.current, targetLerp, delta * 2.0);

    // 2. Handle Group Rotation
    const speed = type === 'ribbon' ? 0.2 : 0.15; 
    groupRotation.current += (speed * direction * delta) + (rotationOffset.current * delta * 5);
    
    // 3. Update Instances
    const lf = lerpFactor.current;
    const time = state.clock.elapsedTime;
    
    const cosR = Math.cos(groupRotation.current);
    const sinR = Math.sin(groupRotation.current);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      const tx = treePositions[i3];
      const ty = treePositions[i3 + 1];
      const tz = treePositions[i3 + 2];

      const ex = explodePositions[i3];
      const ey = explodePositions[i3 + 1];
      const ez = explodePositions[i3 + 2];

      const x = tx + (ex - tx) * lf;
      const y = ty + (ey - ty) * lf;
      const z = tz + (ez - tz) * lf;

      // Orbit Rotation around Y axis
      const rotX = x * cosR - z * sinR;
      const rotZ = x * sinR + z * cosR;

      dummy.position.set(rotX, y, rotZ);

      // Scale / Animation
      let s = scale * (0.5 + 0.5 * randomScales[i]); 
      
      if (mode === AppMode.EXPLODE) {
         s *= (0.5 + 0.5 * Math.sin(time * 2 + phases[i]));
      } else if (type === 'ornament' || type === 'ribbon') {
         s *= (0.8 + 0.4 * Math.sin(time * 3 + phases[i]));
      }
      
      if (type === 'leaf' || type === 'ribbon') {
        dummy.rotation.x = time * 0.5 + phases[i];
        dummy.rotation.y = time * 0.3 + phases[i];
        dummy.rotation.z = time * 0.1 + phases[i];
      } else {
        dummy.rotation.set(0,0,0);
      }

      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  let GeometryComponent;
  switch (shape) {
      case 'cube': GeometryComponent = <boxGeometry />; break;
      case 'tetrahedron': GeometryComponent = <tetrahedronGeometry />; break;
      case 'icosahedron': GeometryComponent = <icosahedronGeometry />; break;
      default: GeometryComponent = <octahedronGeometry />; break;
  }

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      {GeometryComponent}
      <meshStandardMaterial 
        color={color} 
        roughness={type === 'leaf' ? 0.4 : 0.1}
        metalness={type === 'leaf' ? 0.6 : 0.9}
        emissive={color}
        // Reduced to ~1/3 brightness:
        // Ribbon: 2.5 -> 0.8
        // Ornament: 1.5 -> 0.5
        // Leaf: 0.4 -> 0.13
        emissiveIntensity={type === 'ribbon' ? 0.8 : (type === 'ornament' ? 0.5 : 0.13)}
        toneMapped={false}
        transparent={type === 'ribbon'} 
        opacity={type === 'ribbon' ? 0.9 : 1}
      />
    </instancedMesh>
  );
};

export const MagicTree: React.FC = () => {
  return (
    // Moved up from -2 to -1.0. Scaled down to 0.9.
    <group position={[0, -1.0, 0]} scale={[0.9, 0.9, 0.9]}>
        {/* Leaves - Primary - #8170fc - Rotate CCW */}
        <ParticleSystem 
            count={COUNTS.leavesPrimary} 
            color={COLORS.leafPrimary} 
            shape="octahedron" 
            scale={0.08} 
            type="leaf"
            direction={1} 
        />
        {/* Leaves - Secondary - #c0b2e9 - Rotate CCW */}
        <ParticleSystem 
            count={COUNTS.leavesSecondary} 
            color={COLORS.leafSecondary} 
            shape="octahedron" 
            scale={0.08} 
            type="leaf" 
            direction={1}
        />
        {/* Ornaments - White/Bright - Rotate CW (Contrast) */}
        <ParticleSystem 
            count={COUNTS.ornaments} 
            color={COLORS.ornament} 
            shape="icosahedron" 
            scale={0.12} 
            type="ornament"
            direction={-1} 
        />
        {/* Ribbon - White Cloud - Rotate CW - High Density */}
        <ParticleSystem 
            count={COUNTS.ribbon} 
            color={COLORS.ribbon} 
            shape="tetrahedron" 
            scale={0.05} 
            type="ribbon"
            direction={-1} 
        />
    </group>
  );
};
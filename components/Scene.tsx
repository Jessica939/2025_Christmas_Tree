import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { MagicTree } from './MagicTree';
import { GlowingStar } from './GlowingStar';
import { useAppStore } from '../context';
import { COLORS } from '../types';

const InteractiveScene: React.FC = () => {
    const { toggleMode } = useAppStore();

    return (
        <Canvas
            onPointerMissed={toggleMode} // Click anywhere to toggle
            className="w-full h-full cursor-pointer"
            dpr={[1, 2]}
            gl={{ antialias: false, toneMapping: 0 }} // Disable tone mapping for pure colors
        >
            <color attach="background" args={[COLORS.bg]} />
            
            <PerspectiveCamera makeDefault position={[0, 2, 14]} fov={50} />
            <OrbitControls 
                enablePan={false} 
                maxPolarAngle={Math.PI / 1.5} 
                minPolarAngle={Math.PI / 3}
                enableZoom={true}
                maxDistance={25}
                minDistance={5}
                autoRotate
                autoRotateSpeed={0.3}
            />

            {/* Lights - Dreamy Setup */}
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={2} color="#8170fc" />
            <directionalLight position={[-10, -5, -5]} intensity={1} color="#c0b2e9" />
            <spotLight position={[0, 15, 0]} intensity={3} angle={0.6} penumbra={1} color="#FFFFFF" />

            {/* Ambient Sparkles for Dust Effect */}
            <Sparkles 
                count={500}
                scale={20}
                size={4}
                speed={0.2}
                opacity={0.5}
                color="#c0b2e9"
            />

            <Suspense fallback={null}>
                <MagicTree />
                <GlowingStar />
            </Suspense>

            {/* Post Processing */}
            <EffectComposer disableNormalPass>
                <Bloom 
                    luminanceThreshold={0.2} // Lower threshold to capture purple
                    mipmapBlur 
                    intensity={2.0} // High intensity for dreamy glow
                    radius={0.6} 
                />
                <Vignette eskil={false} offset={0.1} darkness={1.0} />
                <Noise opacity={0.05} />
            </EffectComposer>
        </Canvas>
    );
};

export default InteractiveScene;
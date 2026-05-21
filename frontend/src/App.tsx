import React, { Suspense } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { NebulaField } from './components/canvas/nebula/NebulaField';
import { CoreCrystal } from './components/canvas/core/CoreCrystal';
import { OrbitalSources } from './components/canvas/environment/OrbitalSources';
import { CameraRig } from './components/canvas/environment/CameraRig';
import { CommandHUD } from './components/hud/CommandHUD';

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <CommandHUD />
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={75} />

        <color attach="background" args={['#020617']} />
        <fog attach="fog" args={['#020617', 10, 50]} />

        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#4f46e5" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#06b6d4" />

        <Suspense fallback={null}>
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <NebulaField />
          <CoreCrystal />
          <OrbitalSources />
          <CameraRig />
        </Suspense>

        <EffectComposer>
          <Bloom luminanceThreshold={0.2} intensity={1.5} mipmapBlur={true} />
          {/* @ts-expect-error - Library type definitions are overly restrictive */}
          <ChromaticAberration offset={new THREE.Vector2(0.001, 0.001)} />
        </EffectComposer>

        <OrbitControls enableZoom={true} enablePan={true} />
      </Canvas>
    </div>
  );
}


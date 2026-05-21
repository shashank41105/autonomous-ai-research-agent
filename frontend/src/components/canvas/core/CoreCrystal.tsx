import * as THREE from 'three';
import { useRef } from 'react';
import { Float, MeshWobbleMaterial } from '@react-three/drei';
import { useSceneStore } from '../../../store/sceneStore';

export const CoreCrystal = () => {
  const crystalRef = useRef<THREE.Mesh>(null!);
  const { phase } = useSceneStore();

  // Pulse intensity based on phase
  const emissionIntensity = phase === 'COMPLETE' ? 5 : 1;
  const scale = phase === 'COMPLETE' ? 1.5 : 1.0;

  return (
    <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
      <mesh ref={crystalRef} scale={scale}>
        <icosahedronGeometry args={[1, 0]} />
        <MeshWobbleMaterial
          color="#06b6d4"
          factor={0.3}
          speed={2}
          emissive="#06b6d4"
          emissiveIntensity={emissionIntensity}
        />
      </mesh>
    </Float>
  );
};

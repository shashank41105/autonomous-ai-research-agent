import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useRef, useLayoutEffect } from 'react';
import { useSceneStore } from '../../../store/sceneStore';

export const NebulaField = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const { phase } = useSceneStore();

  // Create 5000 particles for the nebula background
  const count = 5000;

  useLayoutEffect(() => {
    if (!meshRef.current) return;

    const tempObject = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      // Position particles in a large spherical/box cloud around the center
      const x = (Math.random() - 0.5) * 80;
      const y = (Math.random() - 0.5) * 80;
      const z = (Math.random() - 0.5) * 80;
      tempObject.position.set(x, y, z);

      // Give them some variety in scale
      const s = 0.3 + Math.random() * 0.7;
      tempObject.scale.set(s, s, s);

      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      // Slow rotation of the entire nebula
      meshRef.current.rotation.y += 0.0003;
      meshRef.current.rotation.x += 0.0001;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[null as any, null as any, count]}>
      <sphereGeometry args={[0.06, 6, 6]} />
      <meshStandardMaterial
        color="#4f46e5"
        emissive="#4f46e5"
        emissiveIntensity={1.5}
        transparent
        opacity={0.6}
      />
    </instancedMesh>
  );
};

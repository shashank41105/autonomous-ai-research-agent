import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import gsap from 'gsap';
import { useSceneStore, Phase } from '../../../store/sceneStore';

export const CameraRig = () => {
  const { camera } = useThree();
  const phase = useSceneStore((state) => state.phase);

  useFrame(() => {
    // Gentle ambient drift to keep the scene feeling alive
    camera.position.x += Math.sin(Date.now() * 0.0005) * 0.002;
    camera.position.y += Math.cos(Date.now() * 0.0005) * 0.002;
    camera.lookAt(0, 0, 0);
  });

  useEffect(() => {
    if (phase === Phase.EXPANDING) {
      // "Warp" out to the nebula
      gsap.to(camera.position, {
        z: 30,
        duration: 2,
        ease: 'expo.inOut'
      });
      gsap.to(camera, {
        fov: 90,
        duration: 2,
        ease: 'expo.inOut',
        onUpdate: () => camera.updateProjectionMatrix()
      });
    } else if (phase === Phase.CONVERGING) {
      // Dive back into the core
      gsap.to(camera.position, {
        z: 8,
        x: 0,
        y: 0,
        duration: 2,
        ease: 'power4.inOut'
      });
      gsap.to(camera, {
        fov: 50,
        duration: 2,
        ease: 'power4.inOut',
        onUpdate: () => camera.updateProjectionMatrix()
      });
    } else if (phase === Phase.COMPLETE) {
      // Cinematic close-up on the Crystal
      gsap.to(camera.position, {
        z: 4,
        duration: 1.5,
        ease: 'back.out(1.7)'
      });
    }
  }, [phase, camera]);

  return null;
};

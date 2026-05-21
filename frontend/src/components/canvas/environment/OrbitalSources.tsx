import * as THREE from 'three';
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, Html } from '@react-three/drei';
import { useSceneStore, Phase } from '../../../store/sceneStore';

interface SourceSatelliteProps {
  url: string;
  index: number;
  total: number;
}

const SourceSatellite = ({ url, index, total }: SourceSatelliteProps) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  
  let domain = url;
  try {
    domain = new URL(url).hostname;
  } catch (e) {
    const parts = url.split("//");
    const lastPart = parts[parts.length - 1];
    domain = lastPart.split("/")[0] || url;
  }
  
  // Distribute orbits at nested distances
  const orbitRadius = 3.5 + index * 0.9;
  const speed = 0.2 + (total - index) * 0.05; // Different speeds
  const angleOffset = (index / total) * Math.PI * 2;

  const [position, setPosition] = useState<[number, number, number]>([0, 0, 0]);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    const currentAngle = elapsed * speed + angleOffset;
    
    // Orbital path math (tilt slightly for visual interest)
    const x = Math.cos(currentAngle) * orbitRadius;
    const z = Math.sin(currentAngle) * orbitRadius;
    const y = Math.sin(currentAngle * 1.5) * 0.5; // Slight wave motion
    
    meshRef.current.position.set(x, y, z);
    setPosition([x, y, z]);

    // Spin the satellite itself
    meshRef.current.rotation.y += 0.02;
    meshRef.current.rotation.x += 0.01;
  });

  return (
    <group>
      {/* Faint orbit path ring */}
      <Line
        points={Array.from({ length: 64 }, (_, i) => {
          const a = (i / 64) * Math.PI * 2;
          return [Math.cos(a) * orbitRadius, Math.sin(a * 1.5) * 0.5, Math.sin(a) * orbitRadius];
        })}
        color="#06b6d4"
        opacity={0.12}
        transparent
        lineWidth={0.5}
      />

      {/* Laser line to the central crystal core */}
      <Line
        points={[[0, 0, 0], position]}
        color={hovered ? "#00ffcc" : "#06b6d4"}
        opacity={hovered ? 0.8 : 0.25}
        transparent
        lineWidth={hovered ? 2.5 : 1}
      />

      {/* Satellite Sphere */}
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={(e) => {
          setHovered(false);
        }}
        onClick={(e) => {
          e.stopPropagation();
          setClicked(!clicked);
        }}
        scale={hovered ? 1.4 : 1.0}
      >
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial
          color={hovered ? "#00ffcc" : "#06b6d4"}
          emissive={hovered ? "#00ffcc" : "#4f46e5"}
          emissiveIntensity={hovered ? 6 : 2}
        />
      </mesh>

      {/* Glassmorphic 3D label/Card overlay */}
      {(hovered || clicked) && (
        <Html position={[position[0], position[1] + 0.35, position[2]]} distanceFactor={8} center pointerEvents="auto">
          <div 
            className="bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 p-2.5 rounded-lg text-white font-mono text-[9px] w-48 shadow-[0_0_15px_rgba(6,182,212,0.3)] select-none cursor-default transition-all"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <div className="text-cyan-400 font-extrabold border-b border-cyan-500/20 pb-1 mb-1.5 uppercase tracking-widest flex justify-between items-center">
              <span>SOURCE_NODE_{index + 1}</span>
              <span className="text-[8px] bg-cyan-950 text-cyan-400 border border-cyan-500/20 px-1 rounded font-bold">ACTIVE</span>
            </div>
            <div className="truncate text-slate-300 mb-2 font-sans text-[10px] font-semibold">{domain}</div>
            <div className="flex justify-between gap-2">
              <button 
                onClick={() => window.open(url, '_blank')}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold px-2 py-1 rounded text-center cursor-pointer transition-all uppercase tracking-wider font-mono text-[8px]"
              >
                Inspect URL →
              </button>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

export const OrbitalSources = () => {
  const { sources, phase } = useSceneStore();

  // Only render orbital graph once search starts harvesting sources
  if (phase === Phase.IDLE || sources.length === 0) return null;

  return (
    <group>
      {sources.map((url, i) => (
        <SourceSatellite 
          key={url + i}
          url={url} 
          index={i} 
          total={sources.length} 
        />
      ))}
      
      {/* Beautiful structural link connections between sequential orbit paths */}
      {sources.length > 1 && (
        <Line
          points={Array.from({ length: sources.length }, (_, i) => {
            const orbitRadius = 3.5 + i * 0.9;
            // Get an arbitrary connection pattern in space
            const angle = (i / sources.length) * Math.PI * 2;
            return [
              Math.cos(angle) * orbitRadius,
              Math.sin(angle * 1.5) * 0.5,
              Math.sin(angle) * orbitRadius
            ];
          })}
          color="#4f46e5"
          opacity={0.18}
          transparent
          lineWidth={1.2}
        />
      )}
    </group>
  );
};

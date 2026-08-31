import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function OuterFrame() {
  const titaniumMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#6B7B8D',
    metalness: 0.85,
    roughness: 0.25,
  }), []);

  const edgeRadius = 0.06;
  const frameSize = 3.2;
  const half = frameSize / 2;

  const edges: [number, number, number, number, number, number][] = [
    [-half, -half, -half, half, -half, -half],
    [half, -half, -half, half, half, -half],
    [half, half, -half, -half, half, -half],
    [-half, half, -half, -half, -half, -half],
    [-half, -half, half, half, -half, half],
    [half, -half, half, half, half, half],
    [half, half, half, -half, half, half],
    [-half, half, half, -half, -half, half],
    [-half, -half, -half, -half, -half, half],
    [half, -half, -half, half, -half, half],
    [half, half, -half, half, half, half],
    [-half, half, -half, -half, half, half],
  ];

  return (
    <group>
      {edges.map(([x1, y1, z1, x2, y2, z2], i) => {
        const start = new THREE.Vector3(x1, y1, z1);
        const end = new THREE.Vector3(x2, y2, z2);
        const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        const length = start.distanceTo(end);
        const dir = new THREE.Vector3().subVectors(end, start).normalize();
        const up = new THREE.Vector3(0, 1, 0);
        const quat = new THREE.Quaternion().setFromUnitVectors(
          Math.abs(dir.y) > 0.999 ? new THREE.Vector3(1, 0, 0) : up,
          dir
        );

        return (
          <mesh key={`edge-${i}`} position={mid} quaternion={quat} material={titaniumMaterial} castShadow>
            <cylinderGeometry args={[edgeRadius, edgeRadius, length, 12]} />
          </mesh>
        );
      })}
    </group>
  );
}

function XBrace({ position, rotation }: { position: [number, number, number]; rotation: [number, number, number] }) {
  const titaniumMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#5A6A7A',
    metalness: 0.8,
    roughness: 0.3,
  }), []);

  const braceLength = 4.0;
  const barRadius = 0.04;

  return (
    <group position={position} rotation={rotation}>
      <mesh material={titaniumMaterial} castShadow>
        <cylinderGeometry args={[barRadius, barRadius, braceLength, 8]} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} material={titaniumMaterial} castShadow>
        <cylinderGeometry args={[barRadius, barRadius, braceLength, 8]} />
      </mesh>
    </group>
  );
}

function SyntacticFoamBlocks() {
  const foamMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#8A9AAA',
    metalness: 0.1,
    roughness: 0.8,
  }), []);

  const blockSize = 0.7;
  const offset = 1.1;
  const positions: [number, number, number][] = [
    [-offset, -offset, -offset],
    [offset, -offset, -offset],
    [-offset, offset, -offset],
    [offset, offset, -offset],
    [-offset, -offset, offset],
    [offset, -offset, offset],
    [-offset, offset, offset],
    [offset, offset, offset],
  ];

  return (
    <group>
      {positions.map((pos, i) => (
        <mesh key={`foam-${i}`} position={pos} material={foamMaterial} castShadow receiveShadow>
          <boxGeometry args={[blockSize, blockSize, blockSize]} />
        </mesh>
      ))}
    </group>
  );
}

function CentralHousing() {
  const housingMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#4A5A6A',
    metalness: 0.75,
    roughness: 0.3,
  }), []);

  const viewportMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1A3A2A',
    metalness: 0.4,
    roughness: 0.2,
    transparent: true,
    opacity: 0.8,
  }), []);

  const ledMaterials = useMemo(() => [
    new THREE.MeshStandardMaterial({ color: '#44FF44', emissive: '#22AA22', emissiveIntensity: 2 }),
    new THREE.MeshStandardMaterial({ color: '#FFAA00', emissive: '#AA7700', emissiveIntensity: 2 }),
    new THREE.MeshStandardMaterial({ color: '#FF4444', emissive: '#AA2222', emissiveIntensity: 1.5 }),
  ], []);

  return (
    <group>
      <mesh material={housingMaterial} castShadow>
        <cylinderGeometry args={[1.0, 1.0, 1.6, 32]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.81]} material={viewportMaterial}>
        <circleGeometry args={[0.45, 32]} />
      </mesh>
      {ledMaterials.map((mat, i) => (
        <mesh key={`led-${i}`} position={[
          Math.cos((i * Math.PI * 2) / 3) * 0.25,
          Math.sin((i * Math.PI * 2) / 3) * 0.25,
          0.82,
        ]} material={mat}>
          <sphereGeometry args={[0.06, 16, 16]} />
        </mesh>
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.81]} material={housingMaterial}>
        <cylinderGeometry args={[0.6, 0.6, 0.1, 32]} />
      </mesh>
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => (
        <mesh key={`port-${i}`} position={[Math.cos(angle) * 1.0, 0, Math.sin(angle) * 1.0]} rotation={[0, -angle, Math.PI / 2]} material={housingMaterial}>
          <cylinderGeometry args={[0.12, 0.12, 0.2, 16]} />
        </mesh>
      ))}
    </group>
  );
}

function TopCircularComponent() {
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#5E6E7E',
    metalness: 0.8,
    roughness: 0.2,
  }), []);

  return (
    <group position={[0, 2.1, 0]}>
      <mesh material={material} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.15, 32]} />
      </mesh>
      <mesh position={[0, 0.15, 0]} material={material} castShadow>
        <cylinderGeometry args={[0.35, 0.35, 0.12, 32]} />
      </mesh>
      <mesh position={[0, 0.28, 0]} material={material} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.1, 16]} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#4FA3C7" emissive="#2A7A9A" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, -0.1, 0]} material={material}>
        <cylinderGeometry args={[0.08, 0.08, 0.3, 8]} />
      </mesh>
    </group>
  );
}

function BottomWeight() {
  const chainMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#555555',
    metalness: 0.7,
    roughness: 0.4,
  }), []);

  const weightMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#2A2A2A',
    metalness: 0.3,
    roughness: 0.7,
  }), []);

  const chainLinks = 6;
  const linkSpacing = 0.22;

  return (
    <group position={[0, -2.5, 0]}>
      {Array.from({ length: chainLinks }).map((_, i) => (
        <mesh
          key={`chain-${i}`}
          position={[0, -i * linkSpacing, 0]}
          rotation={[i % 2 === 0 ? 0 : Math.PI / 2, 0, 0]}
          material={chainMaterial}
        >
          <torusGeometry args={[0.07, 0.02, 8, 16]} />
        </mesh>
      ))}
      <mesh position={[0, -chainLinks * linkSpacing - 0.25, 0]} material={weightMaterial} castShadow>
        <boxGeometry args={[0.7, 0.7, 0.7]} />
      </mesh>
    </group>
  );
}

function SideConnectors() {
  const connectorMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#5A6A7A',
    metalness: 0.7,
    roughness: 0.35,
  }), []);

  const connectors: { pos: [number, number, number]; rot: [number, number, number]; len: number }[] = [
    { pos: [1.7, 0, 0], rot: [0, 0, Math.PI / 2], len: 0.4 },
    { pos: [-1.7, 0, 0], rot: [0, 0, Math.PI / 2], len: 0.4 },
    { pos: [0, 0, 1.7], rot: [Math.PI / 2, 0, 0], len: 0.4 },
    { pos: [0, 0, -1.7], rot: [Math.PI / 2, 0, 0], len: 0.4 },
  ];

  return (
    <group>
      {connectors.map((c, i) => (
        <group key={`conn-${i}`} position={c.pos} rotation={c.rot}>
          <mesh material={connectorMaterial} castShadow>
            <cylinderGeometry args={[0.1, 0.1, c.len, 12]} />
          </mesh>
          <mesh position={[0, c.len / 2, 0]} material={connectorMaterial}>
            <sphereGeometry args={[0.12, 12, 12]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function AcousticSensor() {
  const sensorMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#4A5A6A',
    metalness: 0.6,
    roughness: 0.3,
  }), []);

  return (
    <group position={[0, -1.7, 0]}>
      <mesh material={sensorMaterial} castShadow>
        <cylinderGeometry args={[0.25, 0.35, 0.4, 16]} />
      </mesh>
      <mesh position={[0, -0.25, 0]} material={sensorMaterial}>
        <sphereGeometry args={[0.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
    </group>
  );
}

export default function PrototypeModel() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.3, 0]}>
      <OuterFrame />
      <XBrace position={[0, 0, 1.6]} rotation={[0, 0, 0]} />
      <XBrace position={[0, 0, -1.6]} rotation={[0, 0, 0]} />
      <XBrace position={[1.6, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
      <XBrace position={[-1.6, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
      <SyntacticFoamBlocks />
      <CentralHousing />
      <TopCircularComponent />
      <BottomWeight />
      <SideConnectors />
      <AcousticSensor />
    </group>
  );
}

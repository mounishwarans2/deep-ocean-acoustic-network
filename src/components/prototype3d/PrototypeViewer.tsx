import { useState, useRef, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import PrototypeModel from './PrototypeModel';
import UnderwaterParticles from './UnderwaterParticles';

function SceneSetup() {
  return (
    <>
      <ambientLight intensity={0.3} color="#4A7A9A" />
      <directionalLight position={[5, 8, 5]} intensity={1.2} color="#C0D8E8" castShadow />
      <directionalLight position={[-3, 4, -5]} intensity={0.5} color="#3A6A8A" />
      <pointLight position={[0, 3, 0]} intensity={0.8} color="#4FA3C7" distance={10} />
      <pointLight position={[0, -3, 0]} intensity={0.4} color="#2A5A7A" distance={8} />
      <fog attach="fog" args={['#0A1E2E', 8, 25]} />
    </>
  );
}

interface CameraControllerProps {
  autoRotate: boolean;
  controlsRef: React.RefObject<React.ComponentRef<typeof OrbitControls> | null>;
}

function CameraController({ autoRotate, controlsRef }: CameraControllerProps) {
  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      autoRotate={autoRotate}
      autoRotateSpeed={1.5}
      minDistance={3}
      maxDistance={15}
      minPolarAngle={0.1}
      maxPolarAngle={Math.PI - 0.1}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.8}
      zoomSpeed={0.8}
    />
  );
}

interface PrototypeViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrototypeViewer({ isOpen, onClose }: PrototypeViewerProps) {
  const [autoRotate, setAutoRotate] = useState(false);
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls> | null>(null);

  const handleReset = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    if (controlsRef.current) {
      const camera = controlsRef.current.object as THREE.PerspectiveCamera;
      camera.position.multiplyScalar(0.8);
      controlsRef.current.update();
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (controlsRef.current) {
      const camera = controlsRef.current.object as THREE.PerspectiveCamera;
      camera.position.multiplyScalar(1.25);
      controlsRef.current.update();
    }
  }, []);

  const setView = useCallback((pos: [number, number, number]) => {
    if (controlsRef.current) {
      const camera = controlsRef.current.object as THREE.PerspectiveCamera;
      camera.position.set(...pos);
      camera.lookAt(0, 0, 0);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, []);

  const viewButtons = [
    { label: 'Front', pos: [0, 0, 8] as [number, number, number] },
    { label: 'Back', pos: [0, 0, -8] as [number, number, number] },
    { label: 'Left', pos: [-8, 0, 0] as [number, number, number] },
    { label: 'Right', pos: [8, 0, 0] as [number, number, number] },
    { label: 'Top', pos: [0, 8, 0.01] as [number, number, number] },
    { label: 'Bottom', pos: [0, -8, 0.01] as [number, number, number] },
  ];

  if (!isOpen) return null;

  return (
    <div className="pv-overlay" onClick={onClose}>
      <div className="pv-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pv-header">
          <h3>3D PROTOTYPE VIEWER</h3>
          <button className="pv-close" onClick={onClose}>✕</button>
        </div>

        <div className="pv-canvas-container">
          <Canvas
            camera={{ position: [0, 2, 8], fov: 45, near: 0.1, far: 100 }}
            shadows
            gl={{ antialias: true, alpha: false }}
            style={{ background: '#0A1E2E' }}
          >
            <color attach="background" args={['#0A1E2E']} />
            <SceneSetup />
            <Suspense fallback={null}>
              <PrototypeModel />
              <UnderwaterParticles />
            </Suspense>
            <CameraController autoRotate={autoRotate} controlsRef={controlsRef} />
          </Canvas>

          <div className="pv-controls">
            <div className="pv-controls-title">CONTROLS</div>
            <button className="pv-btn pv-btn-primary" onClick={handleReset}>Reset View</button>
            <button
              className={`pv-btn ${autoRotate ? 'pv-btn-active' : 'pv-btn-secondary'}`}
              onClick={() => setAutoRotate(!autoRotate)}
            >
              Auto Rotate: {autoRotate ? 'ON' : 'OFF'}
            </button>
            <div className="pv-divider" />
            {viewButtons.map((v) => (
              <button key={v.label} className="pv-btn pv-btn-view" onClick={() => setView(v.pos)}>
                {v.label} View
              </button>
            ))}
            <div className="pv-divider" />
            <button className="pv-btn pv-btn-zoom" onClick={handleZoomIn}>+ Zoom In</button>
            <button className="pv-btn pv-btn-zoom" onClick={handleZoomOut}>− Zoom Out</button>
          </div>
        </div>

        <div className="pv-footer">
          <span>Drag to rotate</span>
          <span>Scroll to zoom</span>
          <span>Inspect from all angles</span>
        </div>
      </div>
    </div>
  );
}

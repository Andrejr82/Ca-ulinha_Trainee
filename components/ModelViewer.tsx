/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {OrbitControls, useGLTF} from '@react-three/drei';
import {Canvas} from '@react-three/fiber';
import React, {Suspense, useEffect, useMemo} from 'react';
import * as THREE from 'three';

// GLTF models can be complex, so we'll show a simple loading state.
// Note: `useGLTF` from drei handles caching and suspense automatically.
const Model: React.FC<{url: string}> = ({url}) => {
  const {scene} = useGLTF(url);

  // Calculate the scale needed to normalize the model size
  const scale = useMemo(() => {
    if (!scene) return 1;
    // Calculate bounding box of the scene
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    // Avoid division by zero
    if (maxDim > 0) {
      // Scale to fit within a 2-unit cube
      return 2 / maxDim;
    }
    return 1;
  }, [scene]);

  // Center the model in the scene
  useEffect(() => {
    if (scene) {
      const box = new THREE.Box3().setFromObject(scene);
      const center = box.getCenter(new THREE.Vector3());
      // Offset the model by the negative of its center
      scene.position.sub(center);
    }
  }, [scene]);

  return <primitive object={scene} scale={scale} />;
};

interface ModelViewerProps {
  modelUrl: string | null;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

const ModelViewer: React.FC<ModelViewerProps> = ({modelUrl, canvasRef}) => {
  if (!modelUrl) return null;

  return (
    <div className="w-full h-64 bg-gray-900/50 rounded-lg overflow-hidden relative border border-gray-700">
      <Canvas
        ref={canvasRef}
        // This is crucial for allowing canvas.toBlob() to work
        gl={{preserveDrawingBuffer: true}}
        camera={{position: [0, 1, 5], fov: 50}}>
        {/* Basic lighting setup to make the model visible */}
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 5]} intensity={2} />
        <directionalLight position={[-10, -10, -5]} intensity={1} />

        <Suspense fallback={null}>
          <Model url={modelUrl} />
        </Suspense>

        {/* Controls to allow the user to rotate the model */}
        <OrbitControls />
      </Canvas>
      <div className="absolute bottom-2 left-2 text-xs text-gray-400 bg-black/50 px-2 py-1 rounded">
        Click and drag to rotate model
      </div>
    </div>
  );
};

export default ModelViewer;

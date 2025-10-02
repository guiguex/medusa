import { useEffect, useRef } from 'react';
import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, SceneLoader } from '@babylonjs/core';
import { attachBridgeToBabylon } from '../viewer/attachBridgeToBabylon';
import { viewerBridge } from '../viewer/bridge';
import '@babylonjs/loaders';

interface BabylonViewerProps {
  modelPath: string;
}

export function BabylonViewer({ modelPath }: BabylonViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Create engine and scene
    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);

    // Create camera
    const camera = new ArcRotateCamera(
      'camera',
      -Math.PI / 2,
      Math.PI / 2.5,
      10,
      Vector3.Zero(),
      scene
    );
    camera.attachControls(canvasRef.current, true);
    camera.setTarget(Vector3.Zero());
		const detach = attachBridgeToBabylon(scene, camera, () => props.modelPath);

    // Create light
    const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    // Load model (fallback to a simple cube if model doesn't exist)
    const createFallbackMesh = () => {
      const { MeshBuilder } = require('@babylonjs/core');
      const box = MeshBuilder.CreateBox('box', { size: 2 }, scene);
      const { StandardMaterial, Color3 } = require('@babylonjs/core');
      const material = new StandardMaterial('boxMat', scene);
      material.diffuseColor = new Color3(0.3, 0.5, 0.9);
      box.material = material;
      
      // Add rotation animation
      scene.registerBeforeRender(() => {
        box.rotation.y += 0.01;
      });
    };

    try {
      SceneLoader.ImportMeshAsync('', '', modelPath, scene).catch(() => {
        createFallbackMesh();
      });
    } catch {
      createFallbackMesh();
    }

    // Store references
    engineRef.current = engine;
    sceneRef.current = scene;

    // Render loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    // Handle resize
    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
		  detach?.()
      engine.dispose();
    };
  }, [modelPath]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ outline: 'none' }}
    />
  );
}
'use client';

import * as React from 'react';
import * as THREE from 'three';
import { disposeThreeScene } from '@/lib/three-utils';

export interface NexusHero3DProps {
  currentStep?: number; // 0 to 6 representing the 7-step loop
  interactive?: boolean;
  className?: string;
}

export function NexusHero3D({
  currentStep = 0,
  interactive = true,
  className = '',
}: NexusHero3DProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const sceneRef = React.useRef<THREE.Scene | null>(null);
  const cameraRef = React.useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = React.useRef<THREE.WebGLRenderer | null>(null);
  const reqIdRef = React.useRef<number | null>(null);
  const nodesGroupRef = React.useRef<THREE.Group | null>(null);
  const arcsGroupRef = React.useRef<THREE.Group | null>(null);
  const particlesRef = React.useRef<THREE.Points | null>(null);
  const targetCamPosRef = React.useRef<{ x: number; y: number; z: number }>({ x: 0, y: 3, z: 8 });
  const mouseRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // 7 Camera Target Positions corresponding to the 7-step operational loop
  const stepCameraConfigs = [
    { x: 0, y: 2.5, z: 7.5, rotX: -0.2, rotY: 0 },         // 0: OBSERVE (Wide spatial overview)
    { x: -2.0, y: 1.8, z: 5.5, rotX: -0.15, rotY: 0.3 },    // 1: UNDERSTAND (Zoomed into dense telemetry cluster)
    { x: 2.2, y: 1.5, z: 4.8, rotX: -0.1, rotY: -0.4 },     // 2: INVESTIGATE (Focused on red anomaly node)
    { x: 0, y: 3.5, z: 6.0, rotX: -0.35, rotY: 0.2 },       // 3: SIMULATE (Elevated overview of purple twin corridor)
    { x: -1.5, y: 1.2, z: 4.5, rotX: -0.1, rotY: 0.25 },    // 4: DECIDE (Pareto evaluation focus)
    { x: 1.8, y: 2.0, z: 5.5, rotX: -0.2, rotY: -0.25 },    // 5: LEARN (Pattern feedback neural lattice)
    { x: 0, y: 1.0, z: 5.0, rotX: -0.05, rotY: 0 },         // 6: OPERATE (Operational forward dispatch view)
  ];

  React.useEffect(() => {
    const config = stepCameraConfigs[currentStep] || stepCameraConfigs[0];
    targetCamPosRef.current = { x: config.x, y: config.y, z: config.z };
  }, [currentStep]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 500;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 3, 8);
    cameraRef.current = camera;

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Ambient & Directional Lighting
    const ambientLight = new THREE.AmbientLight(0xf4fbf7, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x2f6b57, 2.0);
    dirLight1.position.set(5, 8, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x7c3aed, 1.5);
    dirLight2.position.set(-5, 4, -5);
    scene.add(dirLight2);

    // 4. Ground Telemetry Grid & Topology Ring
    const gridHelper = new THREE.GridHelper(20, 24, 0x2f6b57, 0x1f382f);
    gridHelper.position.y = -1.2;
    // @ts-ignore
    gridHelper.material.opacity = 0.25;
    // @ts-ignore
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // 5. Spatial Hub Nodes (Warehouses & Distribution Superhubs)
    const nodesGroup = new THREE.Group();
    nodesGroupRef.current = nodesGroup;
    scene.add(nodesGroup);

    const nodeCoords = [
      { x: -3.5, y: 0.2, z: -1.0, color: 0x2f6b57, label: 'Chicago' },
      { x: 0.0, y: 0.5, z: 0.5, color: 0x0284c7, label: 'Denver' },
      { x: 3.2, y: -0.1, z: -2.0, color: 0x2f6b57, label: 'New York' },
      { x: -2.0, y: -0.4, z: 2.2, color: 0xd97706, label: 'Dallas' },
      { x: 2.5, y: 0.3, z: 1.8, color: 0xba1a1a, label: 'Atlanta (Hazard)' },
      { x: -4.0, y: 0.0, z: 1.5, color: 0x7c3aed, label: 'Seattle (Twin)' },
    ];

    const hubGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.4, 24);
    const pulseRingGeo = new THREE.RingGeometry(0.3, 0.45, 32);

    nodeCoords.forEach((node, i) => {
      const mat = new THREE.MeshStandardMaterial({
        color: node.color,
        roughness: 0.2,
        metalness: 0.8,
        emissive: node.color,
        emissiveIntensity: 0.3,
      });
      const mesh = new THREE.Mesh(hubGeo, mat);
      mesh.position.set(node.x, node.y, node.z);
      nodesGroup.add(mesh);

      // Add pulsating beacon ring at base
      const ringMat = new THREE.MeshBasicMaterial({
        color: node.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      });
      const ring = new THREE.Mesh(pulseRingGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(node.x, node.y - 0.18, node.z);
      ring.userData = { isPulseRing: true, phase: i * 0.8 };
      nodesGroup.add(ring);
    });

    // 6. Glowing Corridors & Arc Splines (Dynamic Logistics Routing)
    const arcsGroup = new THREE.Group();
    arcsGroupRef.current = arcsGroup;
    scene.add(arcsGroup);

    const arcPairs = [
      { from: nodeCoords[0], to: nodeCoords[1], color: 0x2f6b57 },
      { from: nodeCoords[1], to: nodeCoords[2], color: 0x0284c7 },
      { from: nodeCoords[1], to: nodeCoords[3], color: 0x2f6b57 },
      { from: nodeCoords[3], to: nodeCoords[4], color: 0xd97706 },
      { from: nodeCoords[1], to: nodeCoords[4], color: 0xba1a1a }, // Alert corridor
      { from: nodeCoords[1], to: nodeCoords[5], color: 0x7c3aed }, // Simulation corridor
    ];

    arcPairs.forEach((pair) => {
      const vFrom = new THREE.Vector3(pair.from.x, pair.from.y + 0.2, pair.from.z);
      const vTo = new THREE.Vector3(pair.to.x, pair.to.y + 0.2, pair.to.z);
      const mid = new THREE.Vector3().addVectors(vFrom, vTo).multiplyScalar(0.5);
      mid.y += vFrom.distanceTo(vTo) * 0.35; // Curve height

      const curve = new THREE.QuadraticBezierCurve3(vFrom, mid, vTo);
      const points = curve.getPoints(36);
      const geom = new THREE.BufferGeometry().setFromPoints(points);

      const mat = new THREE.LineBasicMaterial({
        color: pair.color,
        transparent: true,
        opacity: 0.75,
        linewidth: 2,
      });
      const line = new THREE.Line(geom, mat);
      arcsGroup.add(line);
    });

    // 7. Atmospheric Telemetry Particles
    const particleCount = 180;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const pColor1 = new THREE.Color(0x2f6b57);
    const pColor2 = new THREE.Color(0x7c3aed);
    const pColor3 = new THREE.Color(0x0284c7);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = Math.random() * 6 - 1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 14;

      const chosenColor = i % 3 === 0 ? pColor1 : i % 3 === 1 ? pColor2 : pColor3;
      colors[i * 3] = chosenColor.r;
      colors[i * 3 + 1] = chosenColor.g;
      colors[i * 3 + 2] = chosenColor.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    particlesRef.current = particles;
    scene.add(particles);

    // 8. Handle Mouse Interaction / Parallax
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseRef.current = { x: x * 0.4, y: y * 0.3 };
    };

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    // 9. Resize Observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 10. Animation Loop with off-screen pause via IntersectionObserver
    let clock = new THREE.Clock();
    let isVisible = true;

    const animate = () => {
      if (!isVisible) {
        reqIdRef.current = null;
        return;
      }
      reqIdRef.current = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth Camera Lerping to target position
      camera.position.x += (targetCamPosRef.current.x + mouseRef.current.x - camera.position.x) * 0.04;
      camera.position.y += (targetCamPosRef.current.y + mouseRef.current.y - camera.position.y) * 0.04;
      camera.position.z += (targetCamPosRef.current.z - camera.position.z) * 0.04;
      camera.lookAt(0, 0.4, 0);

      // Slowly rotate root nodes group for living ambient feel
      if (nodesGroupRef.current) {
        nodesGroupRef.current.rotation.y = elapsed * 0.04;
      }
      if (arcsGroupRef.current) {
        arcsGroupRef.current.rotation.y = elapsed * 0.04;
      }

      // Animate Beacon Pulse Rings
      nodesGroup.children.forEach((child) => {
        if (child.userData.isPulseRing) {
          const s = 1 + 0.3 * Math.sin(elapsed * 3 + child.userData.phase);
          child.scale.set(s, s, s);
          // @ts-ignore
          if (child.material) {
            // @ts-ignore
            child.material.opacity = 0.4 + 0.3 * Math.cos(elapsed * 3 + child.userData.phase);
          }
        }
      });

      // Animate Particles Floating
      if (particlesRef.current) {
        const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          positions[i * 3 + 1] += Math.sin(elapsed + i) * 0.002;
          if (positions[i * 3 + 1] > 5) positions[i * 3 + 1] = -1;
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible && !reqIdRef.current) {
        animate();
      }
    }, { threshold: 0.1 });

    if (container) {
      observer.observe(container);
    }

    animate();

    return () => {
      observer.disconnect();
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
      if (interactive) window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (sceneRef.current) {
        disposeThreeScene(sceneRef.current);
        sceneRef.current.clear();
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current.forceContextLoss?.();
      }
      if (container) container.innerHTML = '';
    };
  }, [interactive]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[380px] pointer-events-none overflow-hidden ${className}`}
      aria-label="3D Interactive Operational Logistics Twin"
    />
  );
}

"use client";

import * as React from "react";
import * as THREE from "three";
import { disposeThreeScene } from "@/lib/three-utils";

export interface NexusExplodedCore3DProps {
  scrollProgress: number; // 0.0 (compact hero) to 1.0 (fully exploded and transitioned)
  className?: string;
}

export function NexusExplodedCore3D({
  scrollProgress = 0,
  className = "",
}: NexusExplodedCore3DProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const sceneRef = React.useRef<THREE.Scene | null>(null);
  const cameraRef = React.useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = React.useRef<THREE.WebGLRenderer | null>(null);
  const reqIdRef = React.useRef<number | null>(null);

  // Group references for exploded components
  const masterGroupRef = React.useRef<THREE.Group | null>(null);
  const layer1TopLidarRef = React.useRef<THREE.Group | null>(null);
  const layer2NeuralCoreRef = React.useRef<THREE.Group | null>(null);
  const layer3StreamBusRef = React.useRef<THREE.Group | null>(null);
  const layer4KineticMatrixRef = React.useRef<THREE.Group | null>(null);
  const layer5AegisLedgerRef = React.useRef<THREE.Group | null>(null);
  const particlesRef = React.useRef<THREE.Points | null>(null);

  // Smooth lerped progress ref
  const progressRef = React.useRef(scrollProgress);
  const mouseRef = React.useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  // Update target progress
  React.useEffect(() => {
    progressRef.current = scrollProgress;
  }, [scrollProgress]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 2, 7.5);
    cameraRef.current = camera;

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 4. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const emeraldKeyLight = new THREE.DirectionalLight(0x10b981, 2.5);
    emeraldKeyLight.position.set(5, 8, 6);
    scene.add(emeraldKeyLight);

    const purpleFillLight = new THREE.DirectionalLight(0x8b5cf6, 2.0);
    purpleFillLight.position.set(-6, 4, -4);
    scene.add(purpleFillLight);

    const cyanRimLight = new THREE.PointLight(0x06b6d4, 3.0, 15);
    cyanRimLight.position.set(0, -3, 3);
    scene.add(cyanRimLight);

    // 5. Master Model Assembly
    const masterGroup = new THREE.Group();
    masterGroupRef.current = masterGroup;
    scene.add(masterGroup);

    // --- LAYER 1: Optical Lidar & GPS Sensory Ring (Top) ---
    const layer1 = new THREE.Group();
    layer1TopLidarRef.current = layer1;

    // Dome cap
    const domeGeo = new THREE.SphereGeometry(0.7, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshPhysicalMaterial({
      color: 0x059669,
      metalness: 0.9,
      roughness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transmission: 0.4,
      transparent: true,
      opacity: 0.85,
    });
    const domeMesh = new THREE.Mesh(domeGeo, domeMat);
    domeMesh.rotation.x = Math.PI;
    domeMesh.position.y = 0.5;
    layer1.add(domeMesh);

    // Laser Ring
    const lidarRingGeo = new THREE.TorusGeometry(0.9, 0.05, 16, 64);
    const lidarRingMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 0.8,
      metalness: 0.8,
      roughness: 0.2,
    });
    const lidarRing = new THREE.Mesh(lidarRingGeo, lidarRingMat);
    lidarRing.rotation.x = Math.PI / 2;
    lidarRing.position.y = 0.4;
    layer1.add(lidarRing);

    // Beacon Pin
    const pinGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 16);
    const pinMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });
    const pinMesh = new THREE.Mesh(pinGeo, pinMat);
    pinMesh.position.y = 0.8;
    layer1.add(pinMesh);

    masterGroup.add(layer1);

    // --- LAYER 2: Nexus Neural Engine™ Core Crystal (Upper Center) ---
    const layer2 = new THREE.Group();
    layer2NeuralCoreRef.current = layer2;

    // Central Floating Neural Polyhedron
    const crystalGeo = new THREE.OctahedronGeometry(0.85, 0);
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0x7c3aed,
      emissive: 0x6d28d9,
      emissiveIntensity: 0.6,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.8,
      thickness: 1.2,
      transparent: true,
      opacity: 0.9,
    });
    const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
    layer2.add(crystalMesh);

    // Wireframe Cage around crystal
    const wireGeo = new THREE.IcosahedronGeometry(1.05, 1);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xa78bfa,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    layer2.add(wireMesh);

    masterGroup.add(layer2);

    // --- LAYER 3: Sub-Second StreamGrid™ Interconnect Hub (Middle Chassis) ---
    const layer3 = new THREE.Group();
    layer3StreamBusRef.current = layer3;

    const busDiscGeo = new THREE.CylinderGeometry(1.3, 1.35, 0.22, 48);
    const busDiscMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.95,
      roughness: 0.25,
    });
    const busDisc = new THREE.Mesh(busDiscGeo, busDiscMat);
    layer3.add(busDisc);

    // Glowing Optical Ring on Disc
    const optRingGeo = new THREE.RingGeometry(1.1, 1.25, 48);
    const optRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const optRing = new THREE.Mesh(optRingGeo, optRingMat);
    optRing.rotation.x = Math.PI / 2;
    optRing.position.y = 0.12;
    layer3.add(optRing);

    // Bus connector nodes around disc perimeter
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const nodePin = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.18, 0.2),
        new THREE.MeshStandardMaterial({ color: 0x0ea5e9, emissive: 0x0284c7, emissiveIntensity: 0.5 })
      );
      nodePin.position.set(Math.cos(angle) * 1.32, 0, Math.sin(angle) * 1.32);
      layer3.add(nodePin);
    }

    masterGroup.add(layer3);

    // --- LAYER 4: Kinetic Reroute Matrix™ & Physics Accelerator (Lower Core) ---
    const layer4 = new THREE.Group();
    layer4KineticMatrixRef.current = layer4;

    const chamberGeo = new THREE.CylinderGeometry(1.0, 1.15, 0.55, 32);
    const chamberMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.85,
      roughness: 0.3,
    });
    const chamber = new THREE.Mesh(chamberGeo, chamberMat);
    layer4.add(chamber);

    // Internal magnetic accelerator coils
    const coilGeo = new THREE.TorusGeometry(0.75, 0.08, 16, 32);
    const coilMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.7,
      metalness: 0.9,
    });
    const coil = new THREE.Mesh(coilGeo, coilMat);
    coil.rotation.x = Math.PI / 2;
    layer4.add(coil);

    masterGroup.add(layer4);

    // --- LAYER 5: Aegis Sovereign Ledger™ Cryptographic Shield (Base Plate) ---
    const layer5 = new THREE.Group();
    layer5AegisLedgerRef.current = layer5;

    const baseOctagonGeo = new THREE.CylinderGeometry(1.5, 1.65, 0.35, 8);
    const baseOctagonMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      metalness: 0.95,
      roughness: 0.15,
    });
    const baseOctagon = new THREE.Mesh(baseOctagonGeo, baseOctagonMat);
    layer5.add(baseOctagon);

    // Gold cryptographic seal ring
    const sealGeo = new THREE.RingGeometry(0.9, 1.4, 32);
    const sealMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xb45309,
      emissiveIntensity: 0.4,
      metalness: 0.95,
      roughness: 0.1,
      side: THREE.DoubleSide,
    });
    const seal = new THREE.Mesh(sealGeo, sealMat);
    seal.rotation.x = Math.PI / 2;
    seal.position.y = 0.18;
    layer5.add(seal);

    masterGroup.add(layer5);

    // 6. Ambient Particle Nebula (Telemetry Stream Field)
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 16;
      particlePositions[i + 1] = (Math.random() - 0.5) * 12;
      particlePositions[i + 2] = (Math.random() - 0.5) * 16;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x10b981,
      size: 0.06,
      transparent: true,
      opacity: 0.5,
    });
    const particleField = new THREE.Points(particleGeo, particleMat);
    particlesRef.current = particleField;
    scene.add(particleField);

    // Mouse Move Parallax
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseRef.current.targetX = x * 0.4;
      mouseRef.current.targetY = y * 0.3;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Resize Observer
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // 7. Animation Loop (Scrub-Driven & Self-Paced)
    let currentLerpProgress = scrollProgress;
    let clock = new THREE.Clock();

    const renderLoop = () => {
      reqIdRef.current = requestAnimationFrame(renderLoop);
      const elapsedTime = clock.getElapsedTime();

      // Smooth lerp progress
      currentLerpProgress += (progressRef.current - currentLerpProgress) * 0.08;
      const p = Math.max(0, Math.min(1, currentLerpProgress));

      // Mouse Parallax smoothing
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      // Base auto rotation + scrub rotation
      if (masterGroupRef.current) {
        masterGroupRef.current.rotation.y = elapsedTime * 0.3 + p * Math.PI * 2.5 + mouseRef.current.x;
        masterGroupRef.current.rotation.x = Math.sin(elapsedTime * 0.5) * 0.08 + (p * 0.4 - 0.2) + mouseRef.current.y;
        masterGroupRef.current.rotation.z = Math.cos(elapsedTime * 0.4) * 0.04;
      }

      // --- EXPLODED VIEW EXPANSION MATH ---
      // Explosion factor triggers from p = 0.15 to 0.75
      const explosionStrength = Math.min(1, Math.max(0, (p - 0.12) / 0.65));

      // Layer 1: Lidar moves UP (+2.6 max)
      if (layer1TopLidarRef.current) {
        layer1TopLidarRef.current.position.y = 0.8 + explosionStrength * 2.6;
        layer1TopLidarRef.current.rotation.y = -elapsedTime * 1.2;
      }

      // Layer 2: Neural Core moves UP (+1.3 max)
      if (layer2NeuralCoreRef.current) {
        layer2NeuralCoreRef.current.position.y = 0.4 + explosionStrength * 1.3;
        layer2NeuralCoreRef.current.rotation.x = elapsedTime * 0.8;
        layer2NeuralCoreRef.current.rotation.z = elapsedTime * 0.6;
      }

      // Layer 3: Central Bus stays at center but pulses scale
      if (layer3StreamBusRef.current) {
        layer3StreamBusRef.current.position.y = 0.0;
        const scalePulse = 1 + Math.sin(elapsedTime * 2) * 0.02;
        layer3StreamBusRef.current.scale.set(scalePulse, 1, scalePulse);
      }

      // Layer 4: Kinetic Matrix moves DOWN (-1.4 max)
      if (layer4KineticMatrixRef.current) {
        layer4KineticMatrixRef.current.position.y = -0.45 - explosionStrength * 1.4;
        layer4KineticMatrixRef.current.rotation.y = elapsedTime * 0.9;
      }

      // Layer 5: Aegis Shield moves DOWN (-2.8 max)
      if (layer5AegisLedgerRef.current) {
        layer5AegisLedgerRef.current.position.y = -0.9 - explosionStrength * 2.8;
        layer5AegisLedgerRef.current.rotation.y = -elapsedTime * 0.4;
      }

      // Camera Scrub Choreography
      if (cameraRef.current) {
        // As p goes from 0 -> 1:
        // p=0.0 -> Wide Hero View (0, 2, 7.5)
        // p=0.4 -> Angled Inspection (-2.2, 1.2, 5.8)
        // p=0.8 -> Low-Angle Exploded Review (2.5, -0.6, 5.0)
        // p=1.0 -> Zoomed Horizon Dissolve (0, 0.5, 4.0)
        let camX = 0;
        let camY = 2.0;
        let camZ = 7.5;

        if (p < 0.4) {
          const t = p / 0.4;
          camX = THREE.MathUtils.lerp(0, -2.2, t);
          camY = THREE.MathUtils.lerp(2.0, 1.2, t);
          camZ = THREE.MathUtils.lerp(7.5, 5.8, t);
        } else if (p < 0.8) {
          const t = (p - 0.4) / 0.4;
          camX = THREE.MathUtils.lerp(-2.2, 2.5, t);
          camY = THREE.MathUtils.lerp(1.2, -0.6, t);
          camZ = THREE.MathUtils.lerp(5.8, 5.0, t);
        } else {
          const t = (p - 0.8) / 0.2;
          camX = THREE.MathUtils.lerp(2.5, 0, t);
          camY = THREE.MathUtils.lerp(-0.6, 0.5, t);
          camZ = THREE.MathUtils.lerp(5.0, 4.2, t);
        }

        cameraRef.current.position.set(camX + mouseRef.current.x, camY + mouseRef.current.y, camZ);
        cameraRef.current.lookAt(0, 0, 0);
      }

      // Rotate particle field slowly
      if (particlesRef.current) {
        particlesRef.current.rotation.y = elapsedTime * 0.05;
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    renderLoop();

    return () => {
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      if (sceneRef.current) disposeThreeScene(sceneRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (rendererRef.current.domElement && rendererRef.current.domElement.parentNode) {
          rendererRef.current.domElement.parentNode.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full pointer-events-none ${className}`}
    />
  );
}

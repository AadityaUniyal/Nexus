'use client';

import * as React from 'react';
import * as THREE from 'three';
import { cn } from '@/lib/utils';

export type AvatarMood =
  | 'IDLE'
  | 'WELCOME'
  | 'LOADING'
  | 'SUCCESS'
  | 'WARNING'
  | 'CRITICAL'
  | 'ERROR'
  | 'EMPTY'
  | 'SIMULATION';

export interface Avatar3DProps {
  mood?: AvatarMood;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
}

export function Avatar3D({
  mood = 'IDLE',
  size = 'md',
  className,
  interactive = true,
  onClick,
}: Avatar3DProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const rendererRef = React.useRef<THREE.WebGLRenderer | null>(null);
  const animFrameRef = React.useRef<number | null>(null);
  const mouseRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [bounce, setBounce] = React.useState(false);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 120;
    const height = container.clientHeight || 120;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.35, 4.2);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Warm Industrial Lighting
    const ambientLight = new THREE.AmbientLight(0xfffdfa, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.7);
    keyLight.position.set(3, 5, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xb1f0d6, 0.7);
    fillLight.position.set(-3, -2, 2);
    scene.add(fillLight);

    const avatarGroup = new THREE.Group();

    // Material setup based on mood
    let bodyColor = 0xddede4; // Soft warm sage / paper polymer
    let antennaColor = 0x2f6b57; // Nexus forest green
    let eyeColor = 0x20231f; // Obsidian
    let haloColor = 0x2f6b57;
    let haloOpacity = 0.35;

    switch (mood) {
      case 'WELCOME':
        antennaColor = 0x2d6955;
        bodyColor = 0xe2f2ea;
        break;
      case 'LOADING':
        antennaColor = 0x3b82f6;
        bodyColor = 0xe0e7ff;
        haloColor = 0x3b82f6;
        break;
      case 'SUCCESS':
        antennaColor = 0x10b981;
        bodyColor = 0xd1fae5;
        haloColor = 0x10b981;
        haloOpacity = 0.5;
        break;
      case 'WARNING':
        antennaColor = 0xd97706;
        bodyColor = 0xfef3c7;
        haloColor = 0xd97706;
        break;
      case 'CRITICAL':
        antennaColor = 0xba1a1a;
        bodyColor = 0xffdad6;
        haloColor = 0xba1a1a;
        haloOpacity = 0.6;
        break;
      case 'ERROR':
        antennaColor = 0xe11d48;
        bodyColor = 0xffe4e6;
        haloColor = 0xe11d48;
        break;
      case 'EMPTY':
        antennaColor = 0x888a85;
        bodyColor = 0xe5e2e0;
        haloColor = 0x888a85;
        haloOpacity = 0.2;
        break;
      case 'SIMULATION':
        antennaColor = 0x7c3aed;
        bodyColor = 0xede9fe;
        haloColor = 0x7c3aed;
        haloOpacity = 0.55;
        break;
      case 'IDLE':
      default:
        bodyColor = 0xddede4;
        antennaColor = 0x2f6b57;
        break;
    }

    // Main Body: Soft, rounded teardrop sphere geometry
    const bodyGeometry = new THREE.SphereGeometry(1, 48, 48);
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: bodyColor,
      shininess: 90,
      specular: 0xffffff,
      flatShading: false,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.scale.set(1, 1.15, 1);
    avatarGroup.add(body);

    // Eyes: Two tactile glossy dark beads
    const eyeGeometry = new THREE.SphereGeometry(0.12, 24, 24);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: eyeColor });

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.32, 0.28, 0.88);
    avatarGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.32, 0.28, 0.88);
    avatarGroup.add(rightEye);

    // Eye glints (friendly lifelike reflections)
    const glintGeometry = new THREE.SphereGeometry(0.035, 12, 12);
    const glintMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const leftGlint = new THREE.Mesh(glintGeometry, glintMaterial);
    leftGlint.position.set(-0.29, 0.32, 0.96);
    avatarGroup.add(leftGlint);

    const rightGlint = new THREE.Mesh(glintGeometry, glintMaterial);
    rightGlint.position.set(0.35, 0.32, 0.96);
    avatarGroup.add(rightGlint);

    // Tactile Antenna / Telemetry sensor stalk
    const antennaStalkGeom = new THREE.CylinderGeometry(0.03, 0.05, 0.45, 16);
    const antennaStalkMat = new THREE.MeshPhongMaterial({ color: 0x454843, shininess: 80 });
    const stalk = new THREE.Mesh(antennaStalkGeom, antennaStalkMat);
    stalk.position.set(0, 1.25, 0);
    avatarGroup.add(stalk);

    const beaconGeom = new THREE.SphereGeometry(0.14, 24, 24);
    const beaconMat = new THREE.MeshPhongMaterial({
      color: antennaColor,
      emissive: antennaColor,
      emissiveIntensity: 0.5,
      shininess: 100,
    });
    const beacon = new THREE.Mesh(beaconGeom, beaconMat);
    beacon.position.set(0, 1.5, 0);
    avatarGroup.add(beacon);

    // Floating Halo
    const haloGeom = new THREE.TorusGeometry(1.25, 0.02, 16, 64);
    const haloMat = new THREE.MeshBasicMaterial({
      color: haloColor,
      transparent: true,
      opacity: haloOpacity,
    });
    const halo = new THREE.Mesh(haloGeom, haloMat);
    halo.rotation.x = Math.PI / 2.3;
    halo.position.set(0, -0.3, 0);
    avatarGroup.add(halo);

    scene.add(avatarGroup);

    // Mouse movement tracking
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseRef.current = { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    const clock = new THREE.Clock();

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Look toward mouse smoothly
      const targetRotY = mouseRef.current.x * 0.35;
      const targetRotX = -mouseRef.current.y * 0.2;
      avatarGroup.rotation.y += (targetRotY - avatarGroup.rotation.y) * 0.05;
      avatarGroup.rotation.x += (targetRotX - avatarGroup.rotation.x) * 0.05;

      // Mood-specific micro physics
      switch (mood) {
        case 'LOADING':
          avatarGroup.rotation.y += 0.03;
          avatarGroup.position.y = Math.sin(elapsed * 4) * 0.15;
          break;
        case 'WELCOME':
          avatarGroup.position.y = Math.sin(elapsed * 2.5) * 0.12 + 0.08;
          avatarGroup.rotation.z = Math.sin(elapsed * 2) * 0.06;
          break;
        case 'SUCCESS':
          avatarGroup.position.y = Math.abs(Math.sin(elapsed * 4)) * 0.2;
          halo.rotation.z = elapsed * 2;
          break;
        case 'WARNING':
          avatarGroup.position.y = Math.sin(elapsed * 1.8) * 0.06;
          avatarGroup.rotation.z = Math.sin(elapsed * 2) * 0.08;
          break;
        case 'CRITICAL':
          avatarGroup.position.y = Math.sin(elapsed * 8) * 0.08;
          beaconMat.emissiveIntensity = 0.5 + Math.sin(elapsed * 6) * 0.5;
          break;
        case 'ERROR':
          avatarGroup.rotation.z = Math.sin(elapsed * 5) * 0.05;
          avatarGroup.position.y = Math.sin(elapsed * 1.2) * 0.04;
          break;
        case 'EMPTY':
          avatarGroup.position.y = Math.sin(elapsed * 0.8) * 0.03;
          break;
        case 'SIMULATION':
          avatarGroup.position.y = Math.sin(elapsed * 2) * 0.12;
          halo.rotation.z = elapsed * 1.8;
          beaconMat.emissiveIntensity = 0.6 + Math.sin(elapsed * 3) * 0.4;
          break;
        case 'IDLE':
        default:
          avatarGroup.position.y = Math.sin(elapsed * 1.6) * 0.08;
          halo.rotation.z = elapsed * 0.4;
          break;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      bodyGeometry.dispose();
      bodyMaterial.dispose();
      eyeGeometry.dispose();
      eyeMaterial.dispose();
      glintGeometry.dispose();
      glintMaterial.dispose();
      antennaStalkGeom.dispose();
      antennaStalkMat.dispose();
      beaconGeom.dispose();
      beaconMat.dispose();
      haloGeom.dispose();
      haloMat.dispose();
      if (container) container.innerHTML = '';
    };
  }, [mood]);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48',
    hero: 'w-64 h-64 md:w-80 md:h-80',
  };

  return (
    <div
      ref={containerRef}
      onClick={() => {
        setBounce(true);
        setTimeout(() => setBounce(false), 500);
        onClick?.();
      }}
      className={cn(
        'relative flex items-center justify-center select-none',
        sizeClasses[size],
        interactive && 'cursor-pointer transition-transform hover:scale-105 active:scale-95',
        bounce && 'animate-bounce',
        className
      )}
    />
  );
}

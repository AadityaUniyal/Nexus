'use client';

import * as React from 'react';
import * as THREE from 'three';
import { cn } from '@/lib/utils';
import { tactileAudio } from '@/lib/sound-effects';

export type AvatarMood =
  | 'IDLE'
  | 'WELCOME'
  | 'LOADING'
  | 'LISTENING'
  | 'THINKING'
  | 'SPEAKING'
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
  
  // Interactive state refs
  const mouseRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isPointerDownRef = React.useRef<boolean>(false);
  const pointerStartRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragRotationRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragVelocityRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isHoveredRef = React.useRef<boolean>(false);
  
  // Animation triggers
  const spinTriggerRef = React.useRef<number>(0);
  const burstParticlesRef = React.useRef<THREE.Points | null>(null);
  const particleVelocitiesRef = React.useRef<THREE.Vector3[]>([]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 140;
    const height = container.clientHeight || 140;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.35, 4.2);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Warm Industrial Lighting
    const ambientLight = new THREE.AmbientLight(0xfffdfa, 1.5);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(3, 5, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xb1f0d6, 0.8);
    fillLight.position.set(-3, -2, 2);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xa7f3d0, 1.2, 10);
    rimLight.position.set(0, 3, -3);
    scene.add(rimLight);

    const avatarGroup = new THREE.Group();

    // Color theme configuration based on mood
    let bodyColor = 0xddede4; // Soft warm paper polymer
    let antennaColor = 0x2f6b57; // Nexus emerald
    let eyeColor = 0x20231f; // Obsidian glossy
    let haloColor = 0x2f6b57;
    let haloOpacity = 0.45;

    switch (mood) {
      case 'WELCOME':
        antennaColor = 0x2d6955;
        bodyColor = 0xe2f2ea;
        haloColor = 0x2d6955;
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
        haloOpacity = 0.6;
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
        haloOpacity = 0.7;
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
        haloOpacity = 0.25;
        break;
      case 'SIMULATION':
        antennaColor = 0x7c3aed;
        bodyColor = 0xede9fe;
        haloColor = 0x7c3aed;
        haloOpacity = 0.6;
        break;
      case 'IDLE':
      default:
        bodyColor = 0xddede4;
        antennaColor = 0x2f6b57;
        break;
    }

    // 1. Main Teardrop Sphere Body
    const bodyGeometry = new THREE.SphereGeometry(1, 48, 48);
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: bodyColor,
      shininess: 95,
      specular: 0xffffff,
      flatShading: false,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.scale.set(1, 1.15, 1);
    avatarGroup.add(body);

    // 2. Eyes & Glints
    const eyeGeometry = new THREE.SphereGeometry(0.12, 24, 24);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: eyeColor });
    const eyeGroup = new THREE.Group();

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.32, 0.28, 0.88);
    eyeGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.32, 0.28, 0.88);
    eyeGroup.add(rightEye);

    const glintGeometry = new THREE.SphereGeometry(0.038, 16, 16);
    const glintMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const leftGlint = new THREE.Mesh(glintGeometry, glintMaterial);
    leftGlint.position.set(-0.29, 0.32, 0.96);
    eyeGroup.add(leftGlint);

    const rightGlint = new THREE.Mesh(glintGeometry, glintMaterial);
    rightGlint.position.set(0.35, 0.32, 0.96);
    eyeGroup.add(rightGlint);

    avatarGroup.add(eyeGroup);

    // 3. Sensor Stalk & Emissive Beacon
    const stalkGeom = new THREE.CylinderGeometry(0.03, 0.05, 0.45, 16);
    const stalkMat = new THREE.MeshPhongMaterial({ color: 0x454843, shininess: 80 });
    const stalk = new THREE.Mesh(stalkGeom, stalkMat);
    stalk.position.set(0, 1.25, 0);
    avatarGroup.add(stalk);

    const beaconGeom = new THREE.SphereGeometry(0.15, 24, 24);
    const beaconMat = new THREE.MeshPhongMaterial({
      color: antennaColor,
      emissive: antennaColor,
      emissiveIntensity: 0.6,
      shininess: 100,
    });
    const beacon = new THREE.Mesh(beaconGeom, beaconMat);
    beacon.position.set(0, 1.5, 0);
    avatarGroup.add(beacon);

    // 4. Continuous Animation Layer 3: Dual Counter-Rotating Orbital Rings
    const innerHaloGeom = new THREE.TorusGeometry(1.28, 0.022, 16, 64);
    const innerHaloMat = new THREE.MeshBasicMaterial({
      color: haloColor,
      transparent: true,
      opacity: haloOpacity,
    });
    const innerHalo = new THREE.Mesh(innerHaloGeom, innerHaloMat);
    innerHalo.rotation.x = Math.PI / 2.3;
    innerHalo.position.set(0, -0.2, 0);
    avatarGroup.add(innerHalo);

    const outerHaloGeom = new THREE.TorusGeometry(1.5, 0.012, 16, 64);
    const outerHaloMat = new THREE.MeshBasicMaterial({
      color: antennaColor,
      transparent: true,
      opacity: haloOpacity * 0.6,
    });
    const outerHalo = new THREE.Mesh(outerHaloGeom, outerHaloMat);
    outerHalo.rotation.x = -Math.PI / 3;
    outerHalo.position.set(0, 0.1, 0);
    avatarGroup.add(outerHalo);

    // 5. Orbital Spatial Energy Particles (32 particles surrounding avatar)
    const particleCount = 36;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    particleVelocitiesRef.current = [];

    for (let i = 0; i < particleCount; i++) {
      const radius = 1.6 + Math.random() * 0.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.8;
      
      particlePositions[i * 3] = radius * Math.cos(theta) * Math.cos(phi);
      particlePositions[i * 3 + 1] = radius * Math.sin(phi);
      particlePositions[i * 3 + 2] = radius * Math.sin(theta) * Math.cos(phi);

      particleVelocitiesRef.current.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02
        )
      );
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: haloColor,
      size: 0.05,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    burstParticlesRef.current = particles;
    avatarGroup.add(particles);

    scene.add(avatarGroup);

    // Event handlers for mouse movement & dragging
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseRef.current = { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };

      if (isPointerDownRef.current) {
        const deltaX = e.clientX - pointerStartRef.current.x;
        const deltaY = e.clientY - pointerStartRef.current.y;
        dragVelocityRef.current = { x: deltaX * 0.01, y: deltaY * 0.01 };
        dragRotationRef.current.y += deltaX * 0.01;
        dragRotationRef.current.x += deltaY * 0.01;
        pointerStartRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handlePointerDown = (e: MouseEvent) => {
      isPointerDownRef.current = true;
      pointerStartRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = () => {
      isPointerDownRef.current = false;
    };

    const handleMouseEnter = () => {
      isHoveredRef.current = true;
    };

    const handleMouseLeave = () => {
      isHoveredRef.current = false;
      isPointerDownRef.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mouseup', handlePointerUp);
    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);

    // Animation Loop with 4 Continuous Procedural Animation Channels
    const clock = new THREE.Clock();
    let isVisible = true;
    let nextBlinkTime = 2.0;

    const animate = () => {
      if (!isVisible) {
        animFrameRef.current = null;
        return;
      }
      animFrameRef.current = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Inertial dampening for drag rotation
      if (!isPointerDownRef.current) {
        dragRotationRef.current.y += dragVelocityRef.current.x;
        dragRotationRef.current.x += dragVelocityRef.current.y;
        dragVelocityRef.current.x *= 0.92;
        dragVelocityRef.current.y *= 0.92;
      }

      // Dynamic hover zoom & magnetic tilt
      const hoverScaleTarget = isHoveredRef.current ? 1.08 : 1.0;
      avatarGroup.scale.lerp(new THREE.Vector3(hoverScaleTarget, hoverScaleTarget, hoverScaleTarget), 0.1);

      // --- 4 CONTINUOUS PROCEDURAL ANIMATIONS (ALL THE TIME) ---

      // [CHANNEL 1]: Harmonic Levitation & Figure-8 Wobble
      const levitationY = Math.sin(elapsed * 1.8) * 0.09;
      const wobbleX = Math.sin(elapsed * 1.2) * 0.05;
      const wobbleZ = Math.cos(elapsed * 1.4) * 0.04;

      avatarGroup.position.y = levitationY;

      // Cursor Gaze Dampening + Drag Rotation
      const targetRotY = mouseRef.current.x * 0.35 + dragRotationRef.current.y;
      const targetRotX = -mouseRef.current.y * 0.2 + dragRotationRef.current.x + wobbleX;

      avatarGroup.rotation.y += (targetRotY - avatarGroup.rotation.y) * 0.08;
      avatarGroup.rotation.x += (targetRotX - avatarGroup.rotation.x) * 0.08;
      avatarGroup.rotation.z += (wobbleZ - avatarGroup.rotation.z) * 0.08;

      // [CHANNEL 2]: Rhythmic Breathing & Beacon Glow Pulse
      const breathScale = 1.0 + Math.sin(elapsed * 2.2) * 0.025;
      body.scale.set(breathScale, 1.15 * breathScale, breathScale);

      const glowPulse = 0.5 + Math.sin(elapsed * 3.5) * 0.4;
      beaconMat.emissiveIntensity = glowPulse;

      // [CHANNEL 3]: Orbital Counter-Rotation & Particle Swarm
      innerHalo.rotation.z = elapsed * 0.6;
      outerHalo.rotation.y = -elapsed * 0.8;
      outerHalo.rotation.z = elapsed * 0.4;

      // Animate 3D Orbiting Energy Particles
      const positions = particleGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const vel = particleVelocitiesRef.current[i];
        positions[i * 3] += vel.x;
        positions[i * 3 + 1] += vel.y;
        positions[i * 3 + 2] += vel.z;

        // Keep particles bounded within 3D sphere radius
        const dist = Math.sqrt(
          positions[i * 3] ** 2 + positions[i * 3 + 1] ** 2 + positions[i * 3 + 2] ** 2
        );
        if (dist > 2.5 || dist < 1.1) {
          vel.negate();
        }
      }
      particleGeometry.attributes.position.needsUpdate = true;

      // [CHANNEL 4]: Organic Eye-Blink System & Expression Micro-physics
      if (elapsed > nextBlinkTime) {
        eyeGroup.scale.y = 0.1; // Blink closed
        if (elapsed > nextBlinkTime + 0.15) {
          eyeGroup.scale.y = 1.0;
          nextBlinkTime = elapsed + 2.5 + Math.random() * 4.0; // Schedule next blink
        }
      } else {
        eyeGroup.scale.y = 1.0;
      }

      // Interactive Click Spin Jump Handler
      if (spinTriggerRef.current > 0) {
        spinTriggerRef.current -= 0.05;
        avatarGroup.rotation.y += 0.35; // 360 Spin Jump
        avatarGroup.position.y += Math.sin(spinTriggerRef.current * Math.PI) * 0.25;
      }

      // Mood-specific micro physics modifiers
      switch (mood) {
        case 'LISTENING':
          eyeGroup.scale.set(1.2, 1.2, 1.2);
          beaconMat.emissiveIntensity = 0.9 + Math.sin(elapsed * 6) * 0.3;
          break;
        case 'THINKING':
          avatarGroup.rotation.y += Math.sin(elapsed * 2.5) * 0.05;
          break;
        case 'SPEAKING':
          eyeGroup.scale.y = 0.85 + Math.sin(elapsed * 8) * 0.25;
          break;
        case 'SIMULATION':
          innerHaloMat.opacity = 0.6 + Math.sin(elapsed * 4) * 0.3;
          break;
        default:
          break;
      }

      renderer.render(scene, camera);
    };

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible && !animFrameRef.current) {
        animate();
      }
    }, { threshold: 0.1 });

    if (container) {
      observer.observe(container);
    }

    animate();

    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      observer.disconnect();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handlePointerUp);
      if (container) {
        container.removeEventListener('mousedown', handlePointerDown);
        container.removeEventListener('mouseenter', handleMouseEnter);
        container.removeEventListener('mouseleave', handleMouseLeave);
        container.innerHTML = '';
      }
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      bodyGeometry.dispose();
      bodyMaterial.dispose();
      eyeGeometry.dispose();
      eyeMaterial.dispose();
      glintGeometry.dispose();
      glintMaterial.dispose();
      stalkGeom.dispose();
      stalkMat.dispose();
      beaconGeom.dispose();
      beaconMat.dispose();
      innerHaloGeom.dispose();
      innerHaloMat.dispose();
      outerHaloGeom.dispose();
      outerHaloMat.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
    };
  }, [mood]);

  const handleClick = () => {
    // 1. Trigger 360 Spin Jump animation
    spinTriggerRef.current = 1.0;
    
    // 2. Play acoustic tactile audio feedback
    try {
      tactileAudio.playClick();
    } catch {}

    // 3. User callback
    onClick?.();
  };

  const sizeClasses = {
    sm: 'w-14 h-14',
    md: 'w-24 h-24',
    lg: 'w-36 h-36',
    xl: 'w-52 h-52',
    hero: 'w-72 h-72 md:w-96 md:h-96',
  };

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      title="Click to trigger 360 Spin Jump • Drag to rotate in 3D"
      className={cn(
        'relative flex items-center justify-center select-none touch-none',
        sizeClasses[size],
        interactive && 'cursor-grab active:cursor-grabbing transition-transform hover:drop-shadow-[0_10px_20px_rgba(47,107,87,0.25)]',
        className
      )}
    />
  );
}

"use client";

import * as React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Float, ContactShadows, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

export type VehicleLivery = "amber" | "obsidian" | "emerald" | "cyan";
export type VehicleClass = "CLASS_8_EV" | "INTERMODAL" | "URBAN_POD";

interface Nexus3DFleetTwinProps {
  livery?: VehicleLivery;
  vehicleClass?: VehicleClass;
}

const LIVERY_COLORS: Record<VehicleLivery, { body: string; accent: string; emission: string; light: string }> = {
  amber: {
    body: "#ea580c",
    accent: "#f97316",
    emission: "#ffedd5",
    light: "#fb923c",
  },
  obsidian: {
    body: "#18181b",
    accent: "#38bdf8",
    emission: "#0284c7",
    light: "#60a5fa",
  },
  emerald: {
    body: "#059669",
    accent: "#10b981",
    emission: "#a7f3d0",
    light: "#34d399",
  },
  cyan: {
    body: "#0891b2",
    accent: "#06b6d4",
    emission: "#cffafe",
    light: "#22d3ee",
  },
};

// 3D Procedural Heavy Truck Model
function TruckModel({ livery, vehicleClass }: { livery: VehicleLivery; vehicleClass: VehicleClass }) {
  const colors = LIVERY_COLORS[livery] || LIVERY_COLORS.amber;

  return (
    <group position={[0, -0.6, 0]}>
      {/* --- CABIN --- */}
      <mesh position={[-1.7, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 1.4, 1.2]} />
        <meshStandardMaterial
          color={colors.body}
          roughness={0.2}
          metalness={0.7}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* Aerodynamic Cab Visor & Windshield */}
      <mesh position={[-1.85, 0.95, 0]} rotation={[0, 0, 0.15]} castShadow>
        <boxGeometry args={[0.9, 0.7, 1.16]} />
        <meshPhysicalMaterial
          color="#0f172a"
          roughness={0.1}
          metalness={0.9}
          transmission={0.6}
          thickness={0.5}
        />
      </mesh>

      {/* Futuristic Headlight Bar */}
      <mesh position={[-2.52, 0.45, 0]}>
        <boxGeometry args={[0.08, 0.12, 1.08]} />
        <meshStandardMaterial
          color={colors.accent}
          emissive={colors.accent}
          emissiveIntensity={3.5}
        />
      </mesh>

      {/* Aerodynamic Cab Roof Fairing */}
      <mesh position={[-1.6, 1.55, 0]} rotation={[0, 0, -0.08]} castShadow>
        <boxGeometry args={[1.3, 0.25, 1.15]} />
        <meshStandardMaterial color={colors.body} roughness={0.3} metalness={0.6} />
      </mesh>

      {/* --- CHASSIS & UNDERCARRIAGE --- */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[5.2, 0.25, 1.05]} />
        <meshStandardMaterial color="#09090b" roughness={0.8} metalness={0.5} />
      </mesh>

      {/* Battery Pack Under Chassis (Illuminated Status Bar) */}
      <mesh position={[-0.5, 0.15, 0.54]}>
        <boxGeometry args={[1.8, 0.15, 0.05]} />
        <meshStandardMaterial
          color={colors.accent}
          emissive={colors.accent}
          emissiveIntensity={2.0}
        />
      </mesh>
      <mesh position={[-0.5, 0.15, -0.54]}>
        <boxGeometry args={[1.8, 0.15, 0.05]} />
        <meshStandardMaterial
          color={colors.accent}
          emissive={colors.accent}
          emissiveIntensity={2.0}
        />
      </mesh>

      {/* --- CARGO TRAILER / POD --- */}
      {vehicleClass === "CLASS_8_EV" && (
        <group position={[0.7, 1.05, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[3.3, 1.85, 1.25]} />
            <meshStandardMaterial
              color="#18181b"
              roughness={0.25}
              metalness={0.8}
            />
          </mesh>
          {/* Side Logo Panel Accent */}
          <mesh position={[0, 0, 0.63]}>
            <boxGeometry args={[2.8, 0.8, 0.02]} />
            <meshStandardMaterial color="#27272a" roughness={0.4} metalness={0.5} />
          </mesh>
          {/* Cyber Neon Trim Line */}
          <mesh position={[0, -0.85, 0.635]}>
            <boxGeometry args={[3.1, 0.06, 0.02]} />
            <meshStandardMaterial color={colors.accent} emissive={colors.accent} emissiveIntensity={2.5} />
          </mesh>
          <mesh position={[0, -0.85, -0.635]}>
            <boxGeometry args={[3.1, 0.06, 0.02]} />
            <meshStandardMaterial color={colors.accent} emissive={colors.accent} emissiveIntensity={2.5} />
          </mesh>
        </group>
      )}

      {vehicleClass === "INTERMODAL" && (
        <group position={[0.7, 1.05, 0]}>
          {/* Corrugated Intermodal Shipping Container */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[3.4, 1.75, 1.25]} />
            <meshStandardMaterial color={colors.body} roughness={0.4} metalness={0.6} />
          </mesh>
          {/* Frame Reinforcements */}
          <mesh position={[0, 0, 0.63]}>
            <boxGeometry args={[3.45, 0.1, 0.05]} />
            <meshStandardMaterial color="#09090b" roughness={0.9} />
          </mesh>
        </group>
      )}

      {vehicleClass === "URBAN_POD" && (
        <group position={[0.4, 0.95, 0]}>
          {/* Compact Streamlined Urban Autonomous Capsule */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[2.6, 1.5, 1.2]} />
            <meshPhysicalMaterial
              color={colors.body}
              roughness={0.2}
              metalness={0.7}
              clearcoat={1}
              clearcoatRoughness={0.1}
            />
          </mesh>
          {/* Autonomous Sensor Dome */}
          <mesh position={[0, 0.85, 0]}>
            <cylinderGeometry args={[0.25, 0.25, 0.15, 32]} />
            <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={3} />
          </mesh>
        </group>
      )}

      {/* --- WHEELS (6 Wheels) --- */}
      {[
        [-1.8, 0, 0.62],
        [-1.8, 0, -0.62],
        [1.2, 0, 0.62],
        [1.2, 0, -0.62],
        [2.1, 0, 0.62],
        [2.1, 0, -0.62],
      ].map(([x, y, z], idx) => (
        <group key={idx} position={[x, y, z]} rotation={[Math.PI / 2, 0, 0]}>
          {/* Tire */}
          <mesh castShadow>
            <cylinderGeometry args={[0.34, 0.34, 0.22, 24]} />
            <meshStandardMaterial color="#09090b" roughness={0.9} />
          </mesh>
          {/* Rim */}
          <mesh>
            <cylinderGeometry args={[0.2, 0.2, 0.23, 16]} />
            <meshStandardMaterial color="#e4e4e7" roughness={0.2} metalness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Subtle Tail Light Bar */}
      <mesh position={[2.36, 0.6, 0]}>
        <boxGeometry args={[0.06, 0.12, 1.05]} />
        <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={4} />
      </mesh>
    </group>
  );
}

export function Nexus3DFleetTwin({ livery = "amber", vehicleClass = "CLASS_8_EV" }: Nexus3DFleetTwinProps) {
  const colors = LIVERY_COLORS[livery] || LIVERY_COLORS.amber;

  return (
    <div className="relative w-full h-[400px] sm:h-[450px] bg-gradient-to-b from-[#131317] via-[#09090b] to-[#040405] rounded-2xl overflow-hidden select-none cursor-grab active:cursor-grabbing border border-stone-800/80 shadow-2xl">
      {/* Ambient Lighting Studio Flare */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-25 transition-colors duration-700"
        style={{ backgroundColor: colors.light }}
      />

      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <PerspectiveCamera makeDefault position={[-4.5, 2.2, 4.5]} fov={38} />
        <ambientLight intensity={0.7} />
        
        {/* Studio Key Light */}
        <directionalLight
          position={[-6, 8, 5]}
          intensity={1.8}
          color={colors.light}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        
        {/* Fill Light */}
        <directionalLight position={[6, 3, -4]} intensity={0.9} color="#ffffff" />
        
        {/* Dramatic Underglow Rim Light */}
        <pointLight position={[0, -0.4, 0]} intensity={1.5} color={colors.accent} distance={4} />

        <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.2}>
          <TruckModel livery={livery} vehicleClass={vehicleClass} />
        </Float>

        <ContactShadows
          position={[0, -0.61, 0]}
          opacity={0.65}
          scale={8}
          blur={2.4}
          far={3}
          resolution={512}
          color="#000000"
        />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2.05}
          autoRotate
          autoRotateSpeed={0.8}
        />
      </Canvas>

      {/* Floating Spatial Micro-HUD */}
      <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-[10px] font-mono uppercase tracking-widest text-stone-300 bg-stone-900/80 px-2 py-0.5 rounded-full border border-stone-800">
          3D Kinetic Digital Twin
        </span>
      </div>

      <div className="absolute bottom-3 left-3 text-[10px] font-mono text-stone-400 pointer-events-none flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-stone-600" />
        <span>Drag to orbit 360° | 60 FPS WebGL</span>
      </div>
    </div>
  );
}

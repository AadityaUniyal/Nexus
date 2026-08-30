"use client";

import * as React from "react";
import * as THREE from "three";
import { WarehouseItem, VehicleItem, RouteItem, IncidentItem } from "@/lib/mock-data";
import { Maximize2, RotateCcw, Sparkles, Navigation, Layers, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface NexusWorldProps {
  warehouses: WarehouseItem[];
  vehicles: VehicleItem[];
  routes: RouteItem[];
  incidents: IncidentItem[];
  selectedEntity?: { type: "VEHICLE" | "WAREHOUSE" | "ROUTE" | "INCIDENT"; id: string } | null;
  onSelectEntity?: (entity: { type: "VEHICLE" | "WAREHOUSE" | "ROUTE" | "INCIDENT"; id: string }) => void;
  simulationMode?: boolean;
  className?: string;
}

export function NexusWorld({
  warehouses,
  vehicles,
  routes,
  incidents,
  selectedEntity,
  onSelectEntity,
  simulationMode = false,
  className,
}: NexusWorldProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const rendererRef = React.useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = React.useRef<THREE.Scene | null>(null);
  const cameraRef = React.useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameRef = React.useRef<number | null>(null);

  const [inspectedEntity, setInspectedEntity] = React.useState<{
    type: "VEHICLE" | "WAREHOUSE" | "ROUTE" | "INCIDENT";
    id: string;
    data: any;
  } | null>(null);

  // Coordinate mapping from US lat/lng to 3D plane (-15 to 15)
  const mapCoords = React.useCallback((lat: number, lng: number): [number, number, number] => {
    // US approx: lat 25 to 50, lng -125 to -65
    const x = ((lng - -95) / 30) * 16;
    const z = -((lat - 38) / 12) * 12;
    return [x, 0.2, z];
  }, []);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xf6f3ef); // Warm paper canvas

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(0, 24, 28);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Warm Ambient and Directional Lighting
    const ambientLight = new THREE.AmbientLight(0xfffdfa, 1.2);
    scene.add(ambientLight);

    const sun = new THREE.DirectionalLight(0xfffaed, 1.8);
    sun.position.set(20, 35, 15);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    scene.add(sun);

    const rimLight = new THREE.DirectionalLight(0xb1f0d6, 0.6);
    rimLight.position.set(-20, 10, -15);
    scene.add(rimLight);

    // 1. Terrain Grid Ground Floor
    const gridHelper = new THREE.GridHelper(36, 36, 0xc5c7c1, 0xe5e2e0);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    // Ground Plate
    const groundGeom = new THREE.PlaneGeometry(42, 32);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0xfcf9f7 });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // 2. Interactive Object Registry for Raycasting
    const interactiveMeshes: Array<{
      mesh: THREE.Object3D;
      entity: { type: "VEHICLE" | "WAREHOUSE" | "ROUTE" | "INCIDENT"; id: string; data: any };
    }> = [];

    // 3. Render Warehouses
    warehouses.forEach((wh) => {
      const [x, y, z] = mapCoords(wh.lat, wh.lng);

      const whGroup = new THREE.Group();
      whGroup.position.set(x, 0, z);

      // Base Platform
      const baseGeom = new THREE.CylinderGeometry(1.2, 1.3, 0.2, 32);
      const baseMat = new THREE.MeshPhongMaterial({
        color: wh.status === "ATTENTION" ? 0xfef3c7 : 0xe5e2e0,
        shininess: 30,
      });
      const base = new THREE.Mesh(baseGeom, baseMat);
      base.receiveShadow = true;
      whGroup.add(base);

      // Main Building Architecture
      const bldgGeom = new THREE.BoxGeometry(1.2, 0.9, 1.2);
      const bldgMat = new THREE.MeshPhongMaterial({
        color: 0x20231f,
        shininess: 40,
      });
      const bldg = new THREE.Mesh(bldgGeom, bldgMat);
      bldg.position.y = 0.55;
      bldg.castShadow = true;
      whGroup.add(bldg);

      // Roof Beacon / LED Indicator
      const beaconGeom = new THREE.SphereGeometry(0.18, 16, 16);
      const beaconColor =
        wh.status === "CRITICAL" ? 0xef4444 : wh.status === "ATTENTION" ? 0xf59e0b : 0x10b981;
      const beaconMat = new THREE.MeshBasicMaterial({ color: beaconColor });
      const beacon = new THREE.Mesh(beaconGeom, beaconMat);
      beacon.position.y = 1.15;
      whGroup.add(beacon);

      scene.add(whGroup);
      interactiveMeshes.push({
        mesh: bldg,
        entity: { type: "WAREHOUSE", id: wh.id, data: wh },
      });
    });

    // 4. Render Routes
    routes.forEach((rt) => {
      const originWh = warehouses.find((w) => w.id === rt.originWarehouseId);
      const destWh = warehouses.find((w) => w.id === rt.destWarehouseId);
      if (!originWh || !destWh) return;

      const p1 = mapCoords(originWh.lat, originWh.lng);
      const p2 = mapCoords(destWh.lat, destWh.lng);

      // Mid-point curve
      const midX = (p1[0] + p2[0]) / 2;
      const midZ = (p1[2] + p2[2]) / 2;
      const curveHeight = 1.2;

      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(p1[0], 0.3, p1[2]),
        new THREE.Vector3(midX, curveHeight, midZ),
        new THREE.Vector3(p2[0], 0.3, p2[2])
      );

      const points = curve.getPoints(40);
      const lineGeom = new THREE.BufferGeometry().setFromPoints(points);

      const isWarning = rt.trafficCondition === "SEVERE_WEATHER_ALERT";
      const lineColor = isWarning ? 0xef4444 : simulationMode ? 0x7c3aed : 0x2d6955;

      const lineMat = new THREE.LineDashedMaterial({
        color: lineColor,
        linewidth: 2,
        dashSize: isWarning ? 0.4 : 1,
        gapSize: isWarning ? 0.2 : 0,
      });

      const line = new THREE.Line(lineGeom, lineMat);
      if (isWarning) line.computeLineDistances();
      scene.add(line);
    });

    // 5. Render Vehicles (moving markers)
    const vehicleMeshes: Array<{ mesh: THREE.Group; vehicle: VehicleItem }> = [];

    vehicles.forEach((v) => {
      const [x, y, z] = mapCoords(v.lat, v.lng);

      const vGroup = new THREE.Group();
      vGroup.position.set(x, 0.4, z);

      // Vehicle Body (Tactile Truck/Van Geometry)
      const cabGeom = new THREE.BoxGeometry(0.5, 0.4, 0.8);
      const cabMat = new THREE.MeshPhongMaterial({
        color: v.code === "NX-TRK-104" ? 0x2d6955 : 0x20231f,
        shininess: 60,
      });
      const cab = new THREE.Mesh(cabGeom, cabMat);
      cab.castShadow = true;
      vGroup.add(cab);

      // Headlight / Telemetry Ping
      const lightGeom = new THREE.SphereGeometry(0.08, 12, 12);
      const lightMat = new THREE.MeshBasicMaterial({
        color: v.healthScore < 80 ? 0xef4444 : 0x10b981,
      });
      const light = new THREE.Mesh(lightGeom, lightMat);
      light.position.set(0, 0.25, 0.38);
      vGroup.add(light);

      scene.add(vGroup);
      vehicleMeshes.push({ mesh: vGroup, vehicle: v });

      interactiveMeshes.push({
        mesh: cab,
        entity: { type: "VEHICLE", id: v.id, data: v },
      });
    });

    // 6. Render Incident Beacons
    incidents.forEach((inc) => {
      let pos: [number, number, number] = [0, 0, 0];
      if (inc.affectedEntityType === "ROUTE") {
        const rt = routes.find((r) => r.id === inc.affectedEntityId);
        if (rt) {
          const originWh = warehouses.find((w) => w.id === rt.originWarehouseId);
          const destWh = warehouses.find((w) => w.id === rt.destWarehouseId);
          if (originWh && destWh) {
            const p1 = mapCoords(originWh.lat, originWh.lng);
            const p2 = mapCoords(destWh.lat, destWh.lng);
            pos = [(p1[0] + p2[0]) / 2, 0.8, (p1[2] + p2[2]) / 2];
          }
        }
      } else if (inc.affectedEntityType === "VEHICLE") {
        const v = vehicles.find((veh) => veh.id === inc.affectedEntityId);
        if (v) pos = mapCoords(v.lat, v.lng);
      }

      const alertGroup = new THREE.Group();
      alertGroup.position.set(pos[0], pos[1] + 1.2, pos[2]);

      const beaconGeom = new THREE.OctahedronGeometry(0.4, 0);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xba1a1a, wireframe: false });
      const beaconMesh = new THREE.Mesh(beaconGeom, beaconMat);
      alertGroup.add(beaconMesh);

      // Warning Halo
      const ringGeom = new THREE.RingGeometry(0.5, 0.7, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xba1a1a,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.rotation.x = Math.PI / 2;
      alertGroup.add(ring);

      scene.add(alertGroup);

      interactiveMeshes.push({
        mesh: beaconMesh,
        entity: { type: "INCIDENT", id: inc.id, data: inc },
      });
    });

    // 7. Raycaster for user click interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(
        interactiveMeshes.map((item) => item.mesh),
        true
      );

      if (intersects.length > 0) {
        const hit = interactiveMeshes.find(
          (item) => item.mesh === intersects[0].object || item.mesh.children.includes(intersects[0].object)
        );
        if (hit) {
          setInspectedEntity(hit.entity);
          if (onSelectEntity) onSelectEntity({ type: hit.entity.type, id: hit.entity.id });
        }
      }
    };

    renderer.domElement.addEventListener("click", handleClick);

    // Orbit Drag Controls
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouse.x;
      const deltaY = e.clientY - prevMouse.y;
      prevMouse = { x: e.clientX, y: e.clientY };

      scene.rotation.y += deltaX * 0.005;
      camera.position.y = Math.max(10, Math.min(45, camera.position.y - deltaY * 0.05));
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = Math.max(12, Math.min(50, camera.position.z + e.deltaY * 0.02));
    };

    renderer.domElement.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    renderer.domElement.addEventListener("wheel", handleWheel, { passive: false });

    // Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Subtle vehicle micro-movement simulation
      vehicleMeshes.forEach((item, index) => {
        if (item.vehicle.status === "IN_TRANSIT") {
          item.mesh.position.y = 0.35 + Math.sin(elapsed * 4 + index) * 0.03;
        }
      });

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

    window.addEventListener("resize", handleResize);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.domElement.removeEventListener("click", handleClick);
        rendererRef.current.domElement.removeEventListener("mousedown", handleMouseDown);
        rendererRef.current.domElement.removeEventListener("wheel", handleWheel);
        rendererRef.current.dispose();
      }
      if (container) container.innerHTML = "";
    };
  }, [warehouses, vehicles, routes, incidents, simulationMode, mapCoords, onSelectEntity]);

  const handleResetCamera = () => {
    if (cameraRef.current && sceneRef.current) {
      sceneRef.current.rotation.y = 0;
      cameraRef.current.position.set(0, 24, 28);
      cameraRef.current.lookAt(0, 0, 0);
    }
  };

  return (
    <div className={cn("relative w-full h-[520px] rounded-2xl overflow-hidden border border-nexus-outline-variant/40 bg-nexus-surface shadow-tactile-md", className)}>
      {/* 3D Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating HUD Controls */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <div className="px-3 py-1.5 rounded-lg bg-nexus-surface-lowest/90 backdrop-blur-md border border-nexus-outline-variant/40 shadow-tactile flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-nexus-on-surface font-mono-data uppercase">
            Live Digital Twin · North America Hub
          </span>
        </div>

        {simulationMode && (
          <Badge variant="simulation" size="md">
            <Sparkles className="h-3 w-3 mr-1" />
            Simulation Layer Active
          </Badge>
        )}
      </div>

      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleResetCamera}
          className="bg-nexus-surface-lowest/90 backdrop-blur-md text-xs font-mono-data"
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1" />
          Reset View
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 p-2.5 rounded-xl bg-nexus-surface-lowest/90 backdrop-blur-md border border-nexus-outline-variant/30 shadow-tactile flex items-center gap-4 text-xs font-mono-data text-nexus-on-surface-variant">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-nexus-primary" />
          <span>Warehouse</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-nexus-secondary" />
          <span>Fleet Active</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-ping" />
          <span className="text-red-700 font-semibold">Incident</span>
        </div>
      </div>

      {/* Inspect Popup Card */}
      {inspectedEntity && (
        <div className="absolute bottom-4 right-4 z-20 w-80 p-4 rounded-xl bg-nexus-surface-lowest shadow-2xl border border-nexus-outline-variant/50 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-semibold text-nexus-on-surface-variant font-mono-data uppercase">
                {inspectedEntity.type}
              </span>
              <h4 className="text-sm font-bold text-nexus-on-surface">
                {inspectedEntity.data.name || inspectedEntity.data.title || inspectedEntity.data.code}
              </h4>
            </div>
            <button
              onClick={() => setInspectedEntity(null)}
              className="text-xs text-nexus-outline hover:text-nexus-on-surface p-1"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 space-y-1.5 text-xs text-nexus-on-surface-variant font-mono-data border-t border-nexus-outline-variant/30 pt-2">
            {inspectedEntity.type === "VEHICLE" && (
              <>
                <div className="flex justify-between">
                  <span>Speed:</span>
                  <span className="font-semibold text-nexus-on-surface">{inspectedEntity.data.speedKmh} km/h</span>
                </div>
                <div className="flex justify-between">
                  <span>Battery:</span>
                  <span className="font-semibold text-nexus-on-surface">{inspectedEntity.data.batteryPct}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Driver:</span>
                  <span className="font-semibold text-nexus-on-surface">{inspectedEntity.data.driverName}</span>
                </div>
              </>
            )}
            {inspectedEntity.type === "WAREHOUSE" && (
              <>
                <div className="flex justify-between">
                  <span>Capacity:</span>
                  <span className="font-semibold text-nexus-on-surface">
                    {inspectedEntity.data.currentUnits} / {inspectedEntity.data.capacityUnits}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Efficiency:</span>
                  <span className="font-semibold text-nexus-on-surface">{inspectedEntity.data.efficiencyPct}%</span>
                </div>
              </>
            )}
            {inspectedEntity.type === "INCIDENT" && (
              <>
                <div className="flex justify-between text-red-600 font-semibold">
                  <span>Severity:</span>
                  <span>{inspectedEntity.data.severity}</span>
                </div>
                <p className="text-[11px] font-sans text-nexus-on-surface mt-1 line-clamp-2">
                  {inspectedEntity.data.summary}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

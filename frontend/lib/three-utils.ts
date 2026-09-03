import * as THREE from 'three';

/**
 * Recursively disposes all geometries, materials, and textures in a Three.js scene or object.
 * Prevents GPU VRAM leaks during telemetry updates and unmounts.
 */
export function disposeThreeScene(root: THREE.Object3D | THREE.Scene | null | undefined): void {
  if (!root) return;

  root.traverse((object: any) => {
    // 1. Dispose Geometries
    if (object.geometry && typeof object.geometry.dispose === 'function') {
      object.geometry.dispose();
    }

    // 2. Dispose Materials and Textures
    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach((mat: any) => disposeMaterial(mat));
      } else {
        disposeMaterial(object.material);
      }
    }
  });
}

/**
 * Helper to safely dispose a material and any texture maps attached to it.
 */
export function disposeMaterial(material: any): void {
  if (!material) return;

  // Scan and dispose texture properties
  const textureKeys = [
    'map',
    'alphaMap',
    'aoMap',
    'bumpMap',
    'displacementMap',
    'emissiveMap',
    'envMap',
    'lightMap',
    'metalnessMap',
    'normalMap',
    'roughnessMap',
    'specularMap',
  ];

  for (const key of textureKeys) {
    const tex = material[key];
    if (tex && typeof tex.dispose === 'function') {
      tex.dispose();
    }
  }

  // Also check arbitrary object properties for textures
  for (const prop of Object.keys(material)) {
    const val = material[prop];
    if (val && typeof val === 'object' && 'isTexture' in val && typeof val.dispose === 'function') {
      val.dispose();
    }
  }

  if (typeof material.dispose === 'function') {
    material.dispose();
  }
}

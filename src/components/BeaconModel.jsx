import { useEffect, useRef, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { findColor } from '../colors'

const MODEL_URL = import.meta.env.VITE_MODEL_URL || ''

// Maps mesh names to color state keys
const MESH_COLOR_MAP = {
  Case_Top: 'caseColor',
  Case_Bottom: 'caseColor',
  Buttons_24mm: 'buttons24mm',
  Buttons_30mm: 'buttons30mm',
  Buttons_Menu: 'buttonsMenu',
}

function createMaterial(colorEntry) {
  if (colorEntry.metallic) {
    return new THREE.MeshStandardMaterial({
      color: colorEntry.hex,
      metalness: 0.8,
      roughness: 0.2,
    })
  }
  return new THREE.MeshStandardMaterial({
    color: colorEntry.hex,
    metalness: 0,
    roughness: 0.5,
  })
}

function createAcrylicMaterial() {
  return new THREE.MeshPhysicalMaterial({
    transmission: 0.95,
    thickness: 0.2,
    roughness: 0.05,
    clearcoat: 1,
  })
}

export default function BeaconModel({ colors }) {
  const { scene } = useGLTF(MODEL_URL)
  const meshRefs = useRef({})
  const materialsRef = useRef({})

  // Find and cache mesh references on first load
  useEffect(() => {
    const found = {}
    scene.traverse((child) => {
      if (child.isMesh) {
        console.log('[BeaconModel] Found mesh:', child.name)
        if (MESH_COLOR_MAP[child.name] || child.name === 'Acrylic_Top') {
          found[child.name] = child
        }
      }
    })
    meshRefs.current = found

    // Apply acrylic material once
    if (found.Acrylic_Top) {
      found.Acrylic_Top.material = createAcrylicMaterial()
    }

    return () => {
      // Dispose all materials on unmount
      Object.values(materialsRef.current).forEach((mat) => mat.dispose())
    }
  }, [scene])

  // Update materials when colors change
  useEffect(() => {
    const meshes = meshRefs.current
    const oldMaterials = { ...materialsRef.current }
    const newMaterials = {}

    for (const [meshName, stateKey] of Object.entries(MESH_COLOR_MAP)) {
      const mesh = meshes[meshName]
      if (!mesh) continue

      const colorName = colors[stateKey]
      const colorEntry = findColor(colorName)
      if (!colorEntry) continue

      const matKey = `${meshName}_${colorName}`
      const mat = createMaterial(colorEntry)
      newMaterials[matKey] = mat
      mesh.material = mat
    }

    // Dispose old materials
    Object.values(oldMaterials).forEach((mat) => mat.dispose())
    materialsRef.current = newMaterials
  }, [colors])

  return <primitive object={scene} />
}

if (MODEL_URL) {
  useGLTF.preload(MODEL_URL)
}

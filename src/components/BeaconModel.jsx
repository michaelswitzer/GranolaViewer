import { useEffect, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { findColor } from '../colors'

const MODEL_URL = import.meta.env.VITE_MODEL_URL || ''

// Maps parent name prefixes to color state keys
const PARENT_PREFIX_MAP = [
  { prefix: 'Case_Top', key: 'caseColor' },
  { prefix: 'Case_Bottom', key: 'caseColor' },
  { prefix: 'Buttons_24mm', key: 'buttons24mm' },
  { prefix: 'Buttons_30mm', key: 'buttons30mm' },
  { prefix: 'Buttons_Menu', key: 'buttonsMenu' },
  { prefix: 'occurrence_of_', key: 'buttonsMenu' },
]

const ACRYLIC_PREFIX = 'Acrylic_Top'

function getStateKey(parentName) {
  for (const { prefix, key } of PARENT_PREFIX_MAP) {
    if (parentName === prefix || parentName.startsWith(prefix + '_')) {
      return key
    }
  }
  return null
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
    roughness: 0.95,
  })
}

function createAcrylicMaterial() {
  return new THREE.MeshPhysicalMaterial({
    transparent: true,
    opacity: 0.35,
    roughness: 0.1,
    color: '#ffffff',
    depthWrite: false,
  })
}

export default function BeaconModel({ colors }) {
  const { scene } = useGLTF(MODEL_URL)
  const meshGroups = useRef({})
  const materialsRef = useRef({})

  // Find and group meshes by parent name on first load
  useEffect(() => {
    const groups = {}

    scene.traverse((child) => {
      if (!child.isMesh) return
      const parentName = child.parent?.name || 'none'

      const stateKey = getStateKey(parentName)
      if (stateKey) {
        if (!groups[stateKey]) groups[stateKey] = []
        groups[stateKey].push(child)
      }

      if (parentName === ACRYLIC_PREFIX || parentName.startsWith(ACRYLIC_PREFIX + '_')) {
        child.material = createAcrylicMaterial()
      }
    })

    meshGroups.current = groups

    return () => {
      Object.values(materialsRef.current).forEach((mat) => mat.dispose())
    }
  }, [scene])

  // Update materials when colors change
  useEffect(() => {
    const groups = meshGroups.current
    const oldMaterials = { ...materialsRef.current }
    const newMaterials = {}

    for (const [stateKey, meshes] of Object.entries(groups)) {
      const colorName = colors[stateKey]
      const colorEntry = findColor(colorName)
      if (!colorEntry) continue

      const mat = createMaterial(colorEntry)
      newMaterials[stateKey] = mat

      for (const mesh of meshes) {
        mesh.material = mat
      }
    }

    Object.values(oldMaterials).forEach((mat) => mat.dispose())
    materialsRef.current = newMaterials
  }, [colors])

  return <primitive object={scene} />
}

if (MODEL_URL) {
  useGLTF.preload(MODEL_URL)
}

import { useEffect, useRef } from 'react'
import { useGLTF, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { findColor } from '../colors'

function getStateKey(parentName, parentPrefixMap) {
  for (const { prefix, key } of parentPrefixMap) {
    if (parentName === prefix || parentName.startsWith(prefix + '_')) {
      return key
    }
  }
  return null
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

// Find the mesh that contains the single largest coplanar face
function findLargestBottomMesh(meshes) {
  const vA = new THREE.Vector3()
  const vB = new THREE.Vector3()
  const vC = new THREE.Vector3()
  const edge1 = new THREE.Vector3()
  const edge2 = new THREE.Vector3()
  const faceNormal = new THREE.Vector3()

  let bestMesh = null
  let bestArea = 0

  for (const mesh of meshes) {
    const geo = mesh.geometry
    const position = geo.attributes.position
    const index = geo.index
    if (!position) continue

    const triCount = index ? index.count / 3 : position.count / 3
    const buckets = new Map()

    for (let t = 0; t < triCount; t++) {
      const i0 = index ? index.getX(t * 3) : t * 3
      const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1
      const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2

      vA.fromBufferAttribute(position, i0)
      vB.fromBufferAttribute(position, i1)
      vC.fromBufferAttribute(position, i2)

      edge1.subVectors(vB, vA)
      edge2.subVectors(vC, vA)
      faceNormal.crossVectors(edge1, edge2)
      const area = faceNormal.length() * 0.5
      faceNormal.normalize()

      const key = `${faceNormal.x.toFixed(1)},${faceNormal.y.toFixed(1)},${faceNormal.z.toFixed(1)}`
      buckets.set(key, (buckets.get(key) || 0) + area)
    }

    for (const [key, area] of buckets) {
      if (area > bestArea) {
        bestArea = area
        bestMesh = mesh
        console.log(`[ProductModel] New best mesh: ${mesh.name} parent=${mesh.parent?.name} normal=${key} area=${area.toFixed(6)}`)
      }
    }
  }

  console.log(`[ProductModel] Selected logo mesh: ${bestMesh?.name} area=${bestArea.toFixed(6)}`)
  return bestMesh
}

// Find the dominant face normal (largest total triangle area sharing that normal)
// then project UVs only onto triangles with that normal
function generateLargestFaceUVs(mesh) {
  const geometry = mesh.geometry
  const position = geometry.attributes.position
  const index = geometry.index

  if (!position) return false

  const triCount = index ? index.count / 3 : position.count / 3
  const vA = new THREE.Vector3()
  const vB = new THREE.Vector3()
  const vC = new THREE.Vector3()
  const edge1 = new THREE.Vector3()
  const edge2 = new THREE.Vector3()
  const faceNormal = new THREE.Vector3()

  const buckets = new Map()

  for (let t = 0; t < triCount; t++) {
    const i0 = index ? index.getX(t * 3) : t * 3
    const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1
    const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2

    vA.fromBufferAttribute(position, i0)
    vB.fromBufferAttribute(position, i1)
    vC.fromBufferAttribute(position, i2)

    edge1.subVectors(vB, vA)
    edge2.subVectors(vC, vA)
    faceNormal.crossVectors(edge1, edge2)
    const area = faceNormal.length() * 0.5
    faceNormal.normalize()

    const key = `${faceNormal.x.toFixed(1)},${faceNormal.y.toFixed(1)},${faceNormal.z.toFixed(1)}`

    if (!buckets.has(key)) {
      buckets.set(key, { normal: faceNormal.clone(), totalArea: 0, triangles: [] })
    }
    const bucket = buckets.get(key)
    bucket.totalArea += area
    bucket.triangles.push(i0, i1, i2)
  }

  let largest = null
  let maxArea = 0
  for (const bucket of buckets.values()) {
    if (bucket.totalArea > maxArea) {
      maxArea = bucket.totalArea
      largest = bucket
    }
  }

  if (!largest) return false

  console.log('[ProductModel] Largest face normal:', largest.normal, 'area:', maxArea.toFixed(4), 'tris:', largest.triangles.length / 3)

  const absN = new THREE.Vector3(
    Math.abs(largest.normal.x),
    Math.abs(largest.normal.y),
    Math.abs(largest.normal.z)
  )

  let getU, getV
  if (absN.y >= absN.x && absN.y >= absN.z) {
    getU = (i) => position.getX(i)
    getV = (i) => position.getZ(i)
  } else if (absN.x >= absN.y && absN.x >= absN.z) {
    getU = (i) => position.getZ(i)
    getV = (i) => position.getY(i)
  } else {
    getU = (i) => position.getX(i)
    getV = (i) => position.getY(i)
  }

  const targetVerts = new Set(largest.triangles)
  let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity
  for (const vi of targetVerts) {
    const u = getU(vi)
    const v = getV(vi)
    if (u < minU) minU = u
    if (u > maxU) maxU = u
    if (v < minV) minV = v
    if (v > maxV) maxV = v
  }
  const rangeU = maxU - minU || 1
  const rangeV = maxV - minV || 1

  const uvs = new Float32Array(position.count * 2)
  for (let i = 0; i < position.count; i++) {
    if (targetVerts.has(i)) {
      uvs[i * 2] = 1 - (getU(i) - minU) / rangeU
      uvs[i * 2 + 1] = (getV(i) - minV) / rangeV
    } else {
      uvs[i * 2] = -1
      uvs[i * 2 + 1] = -1
    }
  }

  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
  return true
}

export default function ProductModel({ colors, config }) {
  const { scene } = useGLTF(config.modelUrl)
  const logoTexture = useTexture(config.logo.texture)
  const meshGroups = useRef({})
  const logoMesh = useRef(null)
  const materialsRef = useRef({})

  // Configure logo texture — clamp so off-UV areas don't repeat
  useEffect(() => {
    if (logoTexture) {
      logoTexture.colorSpace = THREE.SRGBColorSpace
      logoTexture.wrapS = THREE.ClampToEdgeWrapping
      logoTexture.wrapT = THREE.ClampToEdgeWrapping
      logoTexture.needsUpdate = true
    }
  }, [logoTexture])

  // Find and group meshes by parent name, create materials once
  useEffect(() => {
    const groups = {}
    const bottoms = []

    scene.traverse((child) => {
      if (!child.isMesh) return
      const parentName = child.parent?.name || 'none'

      const stateKey = getStateKey(parentName, config.parentPrefixMap)
      if (stateKey) {
        if (!groups[stateKey]) groups[stateKey] = []
        groups[stateKey].push(child)
      }

      if (config.logo.enabled && config.logo.bottomGroupTest(parentName)) {
        bottoms.push(child)
      }

      if (parentName === config.acrylicPrefix || parentName.startsWith(config.acrylicPrefix + '_')) {
        child.material = createAcrylicMaterial()
      }
    })

    meshGroups.current = groups

    // Find the largest bottom mesh for the logo
    if (config.logo.enabled && bottoms.length > 0) {
      const largest = findLargestBottomMesh(bottoms)
      if (largest) {
        largest.geometry.computeBoundingBox()
        const box = largest.geometry.boundingBox
        console.log('[ProductModel] Logo mesh bounds:', {
          min: { x: box.min.x.toFixed(3), y: box.min.y.toFixed(3), z: box.min.z.toFixed(3) },
          max: { x: box.max.x.toFixed(3), y: box.max.y.toFixed(3), z: box.max.z.toFixed(3) },
          hasNormals: !!largest.geometry.attributes.normal,
          hasUV: !!largest.geometry.attributes.uv,
          verts: largest.geometry.attributes.position.count,
        })

        generateLargestFaceUVs(largest)
        logoMesh.current = largest
      }
    }

    // Create one material per group and assign to meshes
    const newMaterials = {}
    for (const [stateKey, meshes] of Object.entries(groups)) {
      const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 0, roughness: 0.95 })
      newMaterials[stateKey] = mat
      for (const mesh of meshes) {
        if (mesh !== logoMesh.current) {
          mesh.material = mat
        }
      }
    }

    // Create logo material once
    if (config.logo.enabled && logoMesh.current && logoTexture) {
      const logoMat = new THREE.MeshStandardMaterial({
        color: '#000000',
        emissiveMap: logoTexture,
        emissive: '#ffffff',
        emissiveIntensity: 1,
        metalness: 0,
        roughness: 0.95,
      })
      newMaterials['_logo'] = logoMat
      logoMesh.current.material = logoMat
    }

    Object.values(materialsRef.current).forEach((mat) => mat.dispose())
    materialsRef.current = newMaterials

    return () => {
      Object.values(materialsRef.current).forEach((mat) => mat.dispose())
    }
  }, [scene, logoTexture, config])

  // Update material colors when colors change
  useEffect(() => {
    for (const [stateKey, colorName] of Object.entries(colors)) {
      const mat = materialsRef.current[stateKey]
      const colorEntry = findColor(colorName)
      if (mat && colorEntry) {
        mat.color.set(colorEntry.hex)
        mat.needsUpdate = true
      }
    }
  }, [colors])

  return <primitive object={scene} />
}

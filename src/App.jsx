import { Suspense, useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { Loader } from '@react-three/drei'
import Scene from './components/Scene'
import BeaconModel from './components/BeaconModel'
import useShopifyBridge from './hooks/useShopifyBridge'
import { getDefaultColors } from './colors'
import './App.css'

const MODEL_URL = import.meta.env.VITE_MODEL_URL

export default function App() {
  const [colors, setColors] = useState(getDefaultColors)

  const handleColorChange = useCallback((field, colorName) => {
    setColors((prev) => ({ ...prev, [field]: colorName }))
  }, [])

  useShopifyBridge(handleColorChange)

  return (
    <>
      <Canvas camera={{ position: [0, 2, 5], fov: 45 }}>
        <Scene>
          <Suspense fallback={null}>
            {MODEL_URL && <BeaconModel colors={colors} />}
          </Suspense>
        </Scene>
      </Canvas>
      <Loader />
    </>
  )
}

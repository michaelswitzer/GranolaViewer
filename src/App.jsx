import { Suspense, useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { Loader, useGLTF } from '@react-three/drei'
import Scene from './components/Scene'
import ProductModel from './components/ProductModel'
import useShopifyBridge from './hooks/useShopifyBridge'
import { getDefaultColors } from './colors'
import { getProductConfig } from './products'
import './App.css'

const config = getProductConfig()

if (config.modelUrl) {
  useGLTF.preload(config.modelUrl)
}

export default function App() {
  const [colors, setColors] = useState(() => getDefaultColors(config.colorStateKeys))

  const handleColorChange = useCallback((field, colorName) => {
    setColors((prev) => ({ ...prev, [field]: colorName }))
  }, [])

  useShopifyBridge(handleColorChange, config)

  return (
    <>
      <Canvas camera={{ position: config.camera.position, fov: config.camera.fov }} gl={{ alpha: true }}>
        <Scene>
          <Suspense fallback={null}>
            {config.modelUrl && <ProductModel colors={colors} config={config} />}
          </Suspense>
        </Scene>
      </Canvas>
      <Loader />
    </>
  )
}

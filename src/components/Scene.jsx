import { OrbitControls, Environment } from '@react-three/drei'

export default function Scene({ children }) {
  return (
    <>
      <color attach="background" args={['#f0f0f0']} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <directionalLight position={[-3, 2, -2]} intensity={0.4} />
      <Environment preset="studio" />
      <OrbitControls
        enablePan={false}
        minDistance={2}
        maxDistance={8}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2}
      />
      {children}
    </>
  )
}

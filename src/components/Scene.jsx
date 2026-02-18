import { OrbitControls } from '@react-three/drei'

export default function Scene({ children }) {
  return (
    <>
      <color attach="background" args={['#105652']} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 4, 3]} intensity={1.5} />
      <directionalLight position={[-3, 2, -1]} intensity={0.4} />
      <directionalLight position={[0, -1, 2]} intensity={0.2} />
      <OrbitControls
        enablePan={false}
        minDistance={0.1}
        maxDistance={20}
        minPolarAngle={0}
        maxPolarAngle={Math.PI}
      />
      {children}
    </>
  )
}

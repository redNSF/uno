import { useMemo } from 'react'

export function Table() {
  return (
    <group>
      {/* Giant Cartoon Planet Table */}
      <mesh
        position={[0, -20.5, 0]}
        receiveShadow
      >
        <sphereGeometry args={[20, 64, 64]} />
        <meshLambertMaterial
          color={'#20d43b'}
        />
      </mesh>
      
      {/* Background Cartoony Clouds (Simple implementation using Icosahedrons) */}
      {[
        [-15, 2, -10],
        [18, 4, -8],
        [-8, -2, -15],
        [10, -5, -20]
      ].map((pos, i) => (
        <mesh key={`cloud-${i}`} position={pos as [number, number, number]} castShadow>
          <icosahedronGeometry args={[2.5, 1]} />
          <meshLambertMaterial color={'#ffffff'} flatShading />
        </mesh>
      ))}
    </group>
  )
}

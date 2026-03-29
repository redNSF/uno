import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { GameState } from '../game/logic'
import { SEAT_COLORS } from '../utils/constants'
import { computeSeatLayout } from '../utils/seatLayout'

interface LightingProps {
  gameState: GameState | null
}

export function Lighting() {
  return (
    <group>
      {/* Super bright, flat ambient light */}
      <ambientLight intensity={1.5} color={0xffffff} />

      {/* Main directional sun casting simple shadow */}
      <directionalLight
        position={[4, 12, 6]}
        intensity={2.0}
        color={0xffffff}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0005}
      />
    </group>
  )
}

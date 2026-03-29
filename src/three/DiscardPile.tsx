import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import type { Card as CardType } from '../game/logic'
import type { CardColor } from '../utils/constants'
import { generateCardTexture } from '../textures/CardTextureGenerator'
import { SCENE } from '../utils/constants'

const COLOR_HEX: Record<string, number> = {
  red: 0xe02020,
  yellow: 0xf5c817,
  green: 0x1fb851,
  blue: 0x1a6fff,
  wild: 0xc084fc,
}

interface DiscardPileProps {
  topCard: CardType | null
  position: [number, number, number]
  activeColor: CardColor
}

export function DiscardPile({ topCard, position, activeColor }: DiscardPileProps) {
  const shockwaveRef = useRef<THREE.Mesh>(null!)
  const shockwaveActive = useRef(false)
  const shockwaveProgress = useRef(0)
  const prevCardId = useRef<string | null>(null)

  const faceTexture = useMemo(() => {
    if (!topCard) return null
    return generateCardTexture(topCard)
  }, [topCard?.id])

  // Trigger shockwave on new card played
  useEffect(() => {
    if (topCard && topCard.id !== prevCardId.current) {
      shockwaveActive.current = true
      shockwaveProgress.current = 0
      prevCardId.current = topCard.id
    }
  }, [topCard?.id])

  useFrame((_, delta) => {
    if (!shockwaveRef.current) return
    if (shockwaveActive.current) {
      shockwaveProgress.current += delta * 2.5
      const p = Math.min(shockwaveProgress.current, 1)
      const s = p * 2.5
      shockwaveRef.current.scale.set(s, s, s)
      ;(shockwaveRef.current.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.6
      if (p >= 1) shockwaveActive.current = false
    }
  })

  const colorHex = COLOR_HEX[activeColor] ?? 0xffffff

  return (
    <group position={position}>
      {/* Ghost stack layers */}
      {[-0.02, -0.01].map((yOffset, i) => (
        <RoundedBox
          key={i}
          args={[SCENE.CARD_WIDTH, SCENE.CARD_HEIGHT, SCENE.CARD_DEPTH]}
          radius={0.005}
          position={[i * 0.005, yOffset, i * 0.005]}
          rotation={[-Math.PI / 2, 0, (i - 1) * 0.05]}
        >
          <meshLambertMaterial color={0x3a2a2a} />
        </RoundedBox>
      ))}

      {/* Top card */}
      {topCard && faceTexture && (
        <RoundedBox
          args={[SCENE.CARD_WIDTH, SCENE.CARD_HEIGHT, SCENE.CARD_DEPTH * 1.2]}
          radius={0.005}
          position={[0, 0.005, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          castShadow
        >
          <meshLambertMaterial attach="material-4" map={faceTexture} />
          <meshLambertMaterial attach="material-5" color={0x8b0000} />
          <meshLambertMaterial attach="material-0" color={0xf5f0e8} />
          <meshLambertMaterial attach="material-1" color={0xf5f0e8} />
          <meshLambertMaterial attach="material-2" color={0xf5f0e8} />
          <meshLambertMaterial attach="material-3" color={0xf5f0e8} />
        </RoundedBox>
      )}

      {/* Active color orb above */}
      <mesh position={[0, 0.35, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshLambertMaterial
          color={colorHex}
          emissive={colorHex}
          emissiveIntensity={1.0}
        />
      </mesh>

      {/* Shockwave ring */}
      <mesh ref={shockwaveRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} scale={[0, 0, 0]}>
        <ringGeometry args={[0.3, 0.45, 48]} />
        <meshBasicMaterial color={colorHex} transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

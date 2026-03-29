import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { generateCardBackTexture } from '../textures/CardTextureGenerator'
import { useMemo } from 'react'
import { useStore } from '../game/store'
import { SCENE } from '../utils/constants'

interface DrawPileProps {
  deckSize: number
  position: [number, number, number]
}

export function DrawPile({ deckSize, position }: DrawPileProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const drawCardAction = useStore(s => s.drawCardAction)
  const gameState = useStore(s => s.gameState)
  const isHumanTurn = gameState && gameState.players[gameState.currentPlayerIndex]?.isHuman

  const backTexture = useMemo(() => {
    return generateCardBackTexture()
  }, [])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.elapsedTime
    groupRef.current.position.y = Math.sin(t * 1.2) * 0.04
    groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.03
  })

  const stackHeight = Math.min(deckSize / 108, 1)
  const cardLayers = Math.max(1, Math.round(stackHeight * 12))

  return (
    <group ref={groupRef} position={position}>
      {/* Stack of cards */}
      {Array.from({ length: cardLayers }).map((_, i) => (
        <RoundedBox
          key={i}
          args={[SCENE.CARD_WIDTH, SCENE.CARD_HEIGHT, SCENE.CARD_DEPTH * 1.5]}
          radius={0.005}
          position={[0, i * SCENE.CARD_DEPTH * 1.5 + 0.01, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
          onClick={isHumanTurn ? () => drawCardAction() : undefined}
          onPointerOver={isHumanTurn ? (e) => { e.stopPropagation(); document.body.style.cursor = 'pointer' } : undefined}
          onPointerOut={isHumanTurn ? (e) => { e.stopPropagation(); document.body.style.cursor = 'auto' } : undefined}
        >
          <meshLambertMaterial attach="material-5" map={backTexture} />
          <meshLambertMaterial attach="material-4" color={0xf5f0e8} />
          <meshLambertMaterial attach="material-0" color={0xf5f0e8} />
          <meshLambertMaterial attach="material-1" color={0xf5f0e8} />
          <meshLambertMaterial attach="material-2" color={0xf5f0e8} />
          <meshLambertMaterial attach="material-3" color={0xf5f0e8} />
        </RoundedBox>
      ))}

      {/* Glow for clickable state */}
      {isHumanTurn && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
          <ringGeometry args={[0.38, 0.55, 32]} />
          <meshBasicMaterial color={0xf5c817} transparent opacity={0.25} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Count label */}
      <mesh position={[0, cardLayers * SCENE.CARD_DEPTH * 1.5 + 0.06, 0]}>
        <planeGeometry args={[0.32, 0.16]} />
        <meshBasicMaterial color={0x1a1a26} transparent opacity={0.8} />
      </mesh>
    </group>
  )
}

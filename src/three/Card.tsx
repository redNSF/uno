import { useRef, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import type { Card as CardType } from '../game/logic'
import { generateCardTexture, generateCardBackTexture } from '../textures/CardTextureGenerator'
import { SCENE } from '../utils/constants'

interface CardProps {
  card: CardType
  faceUp?: boolean
  position: [number, number, number]
  rotation?: [number, number, number]
  isHuman?: boolean
  isHovered?: boolean
  isSelected?: boolean
  onClick?: () => void
  onHover?: (hovered: boolean) => void
  scale?: number
}

export function Card({
  card,
  faceUp = false,
  position,
  rotation = [0, 0, 0],
  isHuman = false,
  isHovered = false,
  isSelected = false,
  onClick,
  onHover,
  scale = 1,
}: CardProps) {
  const meshRef = useRef<THREE.Group>(null!)
  const flipRef = useRef(faceUp ? 0 : Math.PI)  // Y rotation for flip
  const { gl } = useThree()

  const faceTexture = generateCardTexture(card)
  const backTexture = generateCardBackTexture()

  const isWild = card.value === 'wild' || card.value === 'wild4'

  useFrame((_, delta) => {
    if (!meshRef.current) return
    const targetY = faceUp ? 0 : Math.PI
    flipRef.current += (targetY - flipRef.current) * Math.min(delta * 8, 1)
    meshRef.current.rotation.y = flipRef.current

    // Hover lift
    const targetLift = isSelected ? 0.35 : isHovered ? 0.15 : 0
    // Target position relies on animating the local Y
    meshRef.current.position.y += (targetLift - meshRef.current.position.y) * 0.15

    // Selected glow scale
    const targetScale = (isSelected ? 1.08 : isHovered ? 1.04 : 1) * scale
    const cs = meshRef.current.scale.x
    meshRef.current.scale.setScalar(cs + (targetScale - cs) * 0.15)
  })

  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (isHuman) {
      gl.domElement.style.cursor = 'pointer'
      onHover?.(true)
    }
  }, [isHuman, onHover, gl])

  const handlePointerOut = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    gl.domElement.style.cursor = 'auto'
    onHover?.(false)
  }, [onHover, gl])

  const handleClick = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (isHuman) onClick?.()
  }, [isHuman, onClick])

  return (
    <group
      ref={meshRef}
      position={position}
      rotation={rotation}
    >
      {/* Card body */}
      <RoundedBox
        args={[SCENE.CARD_WIDTH, SCENE.CARD_HEIGHT, SCENE.CARD_DEPTH]}
        radius={0.005}
        smoothness={4}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        castShadow
      >
        <meshLambertMaterial attach="material-0" color={0xf5f0e8} />
        <meshLambertMaterial attach="material-1" color={0xf5f0e8} />
        <meshLambertMaterial attach="material-2" color={0xf5f0e8} />
        <meshLambertMaterial attach="material-3" color={0xf5f0e8} />
        <meshLambertMaterial
          attach="material-4"
          map={faceTexture}
        />
        <meshLambertMaterial
          attach="material-5"
          map={backTexture}
        />
      </RoundedBox>

      {/* Selection glow ring */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
          <ringGeometry args={[SCENE.CARD_WIDTH * 0.6, SCENE.CARD_WIDTH * 0.9, 32]} />
          <meshBasicMaterial color={0xf5c817} transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  )
}

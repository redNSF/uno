import { Canvas } from '@react-three/fiber'
import { Suspense, useRef } from 'react'
import { PerspectiveCamera, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Table } from './Table'
import { Lighting } from './Lighting'
import { PostFX } from './PostFX'
import { Seat } from './Seat'
import { DrawPile } from './DrawPile'
import { DiscardPile } from './DiscardPile'
import { CardHand } from './CardHand'
import { Particles } from './Particles'
import { useStore } from '../game/store'
import { computeSeatLayout } from '../utils/seatLayout'
import { SCENE } from '../utils/constants'

// ─── Inner Scene (uses useFrame, must be inside Canvas) ───────────────────
function SceneInner() {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null!)
  const gameState = useStore(s => s.gameState)
  const phase = gameState?.phase

  useFrame(({ clock }) => {
    if (!cameraRef.current) return
    const t = clock.elapsedTime

    // Subtle idle float
    const idleY = SCENE.CAMERA_Y + Math.sin(t * 0.4) * 0.08
    const idleZ = SCENE.CAMERA_Z + Math.cos(t * 0.3) * 0.06
    cameraRef.current.position.y += (idleY - cameraRef.current.position.y) * 0.02
    cameraRef.current.position.z += (idleZ - cameraRef.current.position.z) * 0.02
    cameraRef.current.lookAt(0, 0, 0)
  })

  const numPlayers = gameState?.players.length ?? 4
  const seatLayout = computeSeatLayout(numPlayers)
  const players = gameState?.players ?? []

  return (
    <>
      {/* Bright Sky Background */}
      <color attach="background" args={['#4fc3f7']} />
      
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        fov={SCENE.CAMERA_FOV}
        position={[0, SCENE.CAMERA_Y, SCENE.CAMERA_Z]}
        near={0.1}
        far={100}
      />

      <Lighting />

      {/* Table */}
      <Table />

      {/* Seats */}
      {seatLayout.map((seat, i) => (
        <Seat
          key={i}
          seatTransform={seat}
          player={players[i] ?? null}
          isActive={gameState?.currentPlayerIndex === i}
        />
      ))}

      {/* Card piles */}
      <DrawPile
        deckSize={gameState?.deck.length ?? 108}
        position={SCENE.DECK_POSITION}
      />
      <DiscardPile
        topCard={gameState ? gameState.discardPile[gameState.discardPile.length - 1] : null}
        position={SCENE.DISCARD_POSITION}
        activeColor={gameState?.activeColor ?? 'red'}
      />

      {/* Hands */}
      {players.map((player, i) => (
        <CardHand
          key={player.id}
          player={player}
          seatTransform={seatLayout[i]}
          isHuman={player.isHuman}
          isActive={gameState?.currentPlayerIndex === i}
        />
      ))}

      {/* Win confetti */}
      {phase === 'game-end' && <Particles />}

      <AdaptiveDpr pixelated />
      <AdaptiveEvents />
    </>
  )
}

// ─── Main Canvas Component ─────────────────────────────────────────────────
export function Scene() {
  return (
    <Canvas
      gl={{
        antialias: true,
        toneMapping: THREE.LinearToneMapping,
      }}
      style={{ width: '100%', height: '100%' }}
      frameloop="always"
    >
      <Suspense fallback={null}>
        <SceneInner />
      </Suspense>
    </Canvas>
  )
}

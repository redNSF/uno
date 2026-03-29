import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, RoundedBox, Text } from '@react-three/drei'
import * as THREE from 'three'
import type { Player } from '../game/logic'
import type { SeatTransform } from '../utils/seatLayout'
import { SEAT_COLORS } from '../utils/constants'

interface SeatProps {
  seatTransform: SeatTransform
  player: Player | null
  isActive: boolean
}

export function Seat({ seatTransform, player, isActive }: SeatProps) {
  const { position, rotation, seatIndex } = seatTransform
  const color = SEAT_COLORS[seatIndex]

  if (!player || player.isHuman) return null

  return (
    <group position={[position.x, position.y, position.z]} rotation={[0, rotation, 0]}>
      <Html position={[0, 1.2, 0]} center transform sprite zIndexRange={[100, 0]}>
        <div className={`avatar-bubble ${isActive ? 'active' : ''}`} style={{ '--theme-color': color } as React.CSSProperties}>
          <div className="avatar-emoji">{player.avatar}</div>
          <div className="avatar-name">{player.name}</div>
          <div className="avatar-cards">{player.hand.length} cards</div>
        </div>
      </Html>
    </group>
  )
}

import { useMemo } from 'react'
import type { Player } from '../game/logic'
import type { SeatTransform } from '../utils/seatLayout'
import { getHandPosition } from '../utils/seatLayout'
import { SCENE } from '../utils/constants'
import { Card } from './Card'
import { useStore } from '../game/store'

interface CardHandProps {
  player: Player
  seatTransform: SeatTransform
  isHuman: boolean
  isActive: boolean
}

export function CardHand({ player, seatTransform, isHuman, isActive }: CardHandProps) {
  const hoveredCardId = useStore(s => s.anim.hoveredCardId)
  const selectedCardId = useStore(s => s.anim.selectedCardId)
  const setHoveredCard = useStore(s => s.setHoveredCard)
  const setSelectedCard = useStore(s => s.setSelectedCard)
  const playCardAction = useStore(s => s.playCardAction)
  const gameState = useStore(s => s.gameState)

  const handPos = getHandPosition(seatTransform)
  const handCount = player.hand.length

  // Fan arc parameters
  const maxFanAngle = Math.min(0.8, handCount * 0.07)
  const baseRotY = seatTransform.rotation

  // Card positions along fan arc
  const cardTransforms = useMemo(() => {
    return player.hand.map((card, i) => {
      const t = handCount <= 1 ? 0.5 : i / (handCount - 1)

      if (isHuman) {
        // Flat, wide layout across the bottom of the camera view
        const spreadWidth = Math.min(8.0, handCount * 0.8)
        const x = -spreadWidth / 2 + t * spreadWidth
        const y = 0.5 + i * 0.002
        const z = 4.0 // Push closer to camera
        const rotZ = (0.5 - t) * 0.3 // Fan spread
        const rotY = 0
        const rotX = -Math.PI * 0.38 // Tilt heavily back to face high camera
        return { card, x, y, z, rotY, rotZ, rotX }
      }

      const angle = -maxFanAngle / 2 + t * maxFanAngle
      const radius = Math.max(0.9, handCount * 0.09)

      // Arc position around hand center
      const x = handPos.x + Math.sin(baseRotY + angle) * radius * 0.45
      const z = handPos.z + Math.cos(baseRotY + angle) * radius * 0.45
      const y = 0.05 + i * 0.001  // slight Y stagger to avoid z-fighting

      // Fan tilt rotation
      const rotZ = angle * 0.4
      const rotY = baseRotY + angle * 0.15
      const rotX = -Math.PI * 0.05 // default slight tilt

      return { card, x, y, z, rotY, rotZ, rotX }
    })
  }, [player.hand, handPos, baseRotY, maxFanAngle, handCount, isHuman])

  const handleCardClick = async (cardId: string) => {
    if (!isHuman || !isActive) return
    if (selectedCardId === cardId) {
      // Second click: play
      await playCardAction(cardId)
      setSelectedCard(null)
    } else {
      setSelectedCard(cardId)
    }
  }

  return (
    <group>
      {cardTransforms.map(({ card, x, y, z, rotY, rotZ, rotX }) => (
        <Card
          key={card.id}
          card={card}
          faceUp={isHuman}
          position={[x, y, z]}
          rotation={[rotX, rotY, rotZ]}
          isHuman={isHuman && isActive}
          isHovered={hoveredCardId === card.id}
          isSelected={selectedCardId === card.id}
          onHover={hovered => setHoveredCard(hovered ? card.id : null)}
          onClick={() => handleCardClick(card.id)}
        />
      ))}
    </group>
  )
}

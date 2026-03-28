/**
 * CardHand.tsx — Fan-arc hand layout per seat
 */

import React, { useState } from 'react';
import { Card as CardType } from '../game/logic';
import { Card } from './Card';

interface CardHandProps {
  cards: CardType[];
  faceUp: boolean;
  position: [number, number, number];
  baseRotation: number; // Y rotation to face table center
  playableCardIds?: Set<string>;
  selectedCardId?: string | null;
  onCardClick?: (card: CardType) => void;
}

const MAX_ARC_DEG = 30;
const SPREAD_COMPRESS_THRESHOLD = 10;

export function CardHand({
  cards,
  faceUp,
  position,
  baseRotation,
  playableCardIds = new Set(),
  selectedCardId = null,
  onCardClick,
}: CardHandProps) {
  const count = cards.length;
  if (count === 0) return null;

  const arcDeg = Math.min(MAX_ARC_DEG, count * 3.5);
  const arcRad = (arcDeg * Math.PI) / 180;
  const radius = Math.max(2.5, count * 0.22);
  const cardScale = count > 12 ? Math.max(0.6, 1 - (count - 10) * 0.04) : 1.0;

  return (
    <group position={position} rotation={[0, baseRotation, 0]}>
      {cards.map((card, i) => {
        const t = count === 1 ? 0 : (i / (count - 1)) * 2 - 1; // -1 to 1
        const theta = t * arcRad * 0.5;
        const x = Math.sin(theta) * radius;
        const y = Math.cos(theta) * 0.1 - 0.05; // slight arc height
        const z = -i * 0.002; // slight z-offset for correct layering

        const cardRotY = -theta;
        const cardRotZ = t * -0.08;

        return (
          <Card
            key={card.id}
            card={card}
            faceUp={faceUp}
            position={[x, y, z]}
            rotation={[0, cardRotY, cardRotZ]}
            scale={cardScale}
            isPlayable={faceUp && playableCardIds.has(card.id)}
            isSelected={card.id === selectedCardId}
            onClick={faceUp ? onCardClick : undefined}
          />
        );
      })}
    </group>
  );
}

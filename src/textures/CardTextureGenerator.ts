/**
 * CardTextureGenerator.ts
 * Canvas 2D renderer for UNO card face textures (512×768)
 */

import * as THREE from 'three';
import { Card } from '../game/logic';

const CARD_W = 512;
const CARD_H = 768;
const RADIUS = 40;

const COLOR_MAP: Record<string, string> = {
  red: '#D32F2F',
  blue: '#1565C0',
  green: '#2E7D32',
  yellow: '#F9A825',
  wild: '#1A0A2E',
};

const DARK_MAP: Record<string, string> = {
  red: '#7F0000',
  blue: '#003c8f',
  green: '#00390a',
  yellow: '#c17900',
  wild: '#0d0618',
};

const TEXT_MAP: Record<string, string> = {
  red: '#FF8A80',
  blue: '#82B1FF',
  green: '#B9F6CA',
  yellow: '#FFE57F',
  wild: '#FFFFFF',
};

// LRU texture cache
const textureCache = new Map<string, THREE.CanvasTexture>();

function cacheKey(card: Card): string {
  return `${card.color}-${card.value}-${card.chosenColor ?? ''}`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawCardBack(ctx: CanvasRenderingContext2D) {
  // Deep red guilloche pattern
  const grad = ctx.createRadialGradient(CARD_W / 2, CARD_H / 2, 10, CARD_W / 2, CARD_H / 2, Math.max(CARD_W, CARD_H) * 0.8);
  grad.addColorStop(0, '#2a0a1e');
  grad.addColorStop(1, '#0d0618');
  ctx.fillStyle = grad;
  ctx.fill();

  // Guilloche rings
  ctx.save();
  for (let i = 0; i < 80; i++) {
    const r = 30 + i * 4.5;
    const alpha = 0.06 - i * 0.0005;
    if (alpha <= 0) break;
    ctx.strokeStyle = `rgba(212, 175, 55, ${alpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(CARD_W / 2, CARD_H / 2, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // UNO logo
  ctx.save();
  ctx.font = `bold 100px Cinzel, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const logoGrad = ctx.createLinearGradient(CARD_W / 2 - 80, 0, CARD_W / 2 + 80, 0);
  logoGrad.addColorStop(0, '#A07820');
  logoGrad.addColorStop(0.5, '#F0D060');
  logoGrad.addColorStop(1.0, '#A07820');
  ctx.fillStyle = logoGrad;
  ctx.fillText('UNO', CARD_W / 2, CARD_H / 2);
  ctx.restore();
}

function drawColorCard(ctx: CanvasRenderingContext2D, card: Card) {
  const color = card.color as string;
  const baseColor = COLOR_MAP[color] ?? '#888';
  const darkColor = DARK_MAP[color] ?? '#444';
  const textColor = TEXT_MAP[color] ?? '#FFF';

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  bg.addColorStop(0, baseColor);
  bg.addColorStop(1, darkColor);
  ctx.fillStyle = bg;
  ctx.fill();

  // Inner white oval
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(CARD_W / 2, CARD_H / 2, CARD_W * 0.38, CARD_H * 0.44, Math.PI / 5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fill();
  ctx.restore();

  // Center value
  const valueLabel = getValueLabel(card.value);
  const isSpecial = ['skip', 'reverse', 'draw2'].includes(card.value);

  ctx.save();
  ctx.translate(CARD_W / 2, CARD_H / 2);
  ctx.font = isSpecial ? `bold 130px sans-serif` : `bold 180px Cinzel, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;
  ctx.fillText(valueLabel, 0, 0);
  ctx.restore();

  // Corner indices
  drawCorner(ctx, card, 14, 24, 1, textColor);
  drawCorner(ctx, card, CARD_W - 14, CARD_H - 24, -1, textColor);
}

function drawWildCard(ctx: CanvasRenderingContext2D, card: Card) {
  // Black background
  ctx.fillStyle = '#0A0A0F';
  ctx.fill();

  // Four-color quadrant fan
  const quadrants = ['#D32F2F', '#1565C0', '#2E7D32', '#F9A825'];
  const cx = CARD_W / 2, cy = CARD_H / 2;

  ctx.save();
  // If wild+4, draw 4 mini card arcs
  const r = 140;
  for (let i = 0; i < 4; i++) {
    const startAngle = (i / 4) * Math.PI * 2 - Math.PI / 4;
    const endAngle = ((i + 1) / 4) * Math.PI * 2 - Math.PI / 4;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = quadrants[i];
    ctx.fill();
  }
  ctx.restore();

  // Wild label
  ctx.save();
  ctx.font = `bold 62px Cinzel, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const grad = ctx.createLinearGradient(cx - 80, cy, cx + 80, cy);
  grad.addColorStop(0, '#FFD700');
  grad.addColorStop(0.5, '#FFFFFF');
  grad.addColorStop(1, '#FFD700');
  ctx.fillStyle = grad;

  if (card.value === 'wild4') {
    ctx.fillText('WILD', cx, cy - 28);
    ctx.font = `bold 48px Cinzel, serif`;
    ctx.fillText('+4', cx, cy + 40);
  } else {
    ctx.fillText('WILD', cx, cy);
  }
  ctx.restore();

  // Corner
  drawCorner(ctx, card, 14, 24, 1, '#FFFFFF');
  drawCorner(ctx, card, CARD_W - 14, CARD_H - 24, -1, '#FFFFFF');
}

function drawCorner(ctx: CanvasRenderingContext2D, card: Card, x: number, y: number, flip: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip, flip);
  ctx.fillStyle = color;
  ctx.font = `bold 44px Cinzel, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(getValueLabel(card.value), 0, 0);
  ctx.restore();
}

function getValueLabel(value: string): string {
  switch (value) {
    case 'skip': return '⊘';
    case 'reverse': return '↺';
    case 'draw2': return '+2';
    case 'wild': return 'W';
    case 'wild4': return 'W4';
    default: return value;
  }
}

export function generateCardTexture(card: Card): THREE.CanvasTexture {
  const key = cacheKey(card);
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d')!;

  // Card shape clip
  roundRect(ctx, 0, 0, CARD_W, CARD_H, RADIUS);
  ctx.clip();

  // White base
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  if ((card.value as string) === 'back') {
    drawCardBack(ctx);
  } else if (card.color === 'wild') {
    drawWildCard(ctx, card);
  } else {
    drawColorCard(ctx, card);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  textureCache.set(key, texture);
  return texture;
}

export function generateCardBackTexture(): THREE.CanvasTexture {
  return generateCardTexture({ id: 'back', color: 'wild', value: 'back' as any });
}

export function clearTextureCache() {
  textureCache.forEach((t) => t.dispose());
  textureCache.clear();
}

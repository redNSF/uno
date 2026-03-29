import * as THREE from 'three'
import type { CardColor } from '../utils/constants'
import type { Card } from '../game/logic'

// ─── Texture Cache ────────────────────────────────────────────────────────
const textureCache = new Map<string, THREE.CanvasTexture>()

const COLOR_MAP: Record<string, string> = {
  red: '#e02020',
  yellow: '#f5c817',
  green: '#1fb851',
  blue: '#1a6fff',
  wild: '#1a0a2e',
}

const LIGHT_COLOR_MAP: Record<string, string> = {
  red: '#ff7070',
  yellow: '#ffe060',
  green: '#60e890',
  blue: '#70aeff',
  wild: '#c084fc',
}

const DARK_COLOR_MAP: Record<string, string> = {
  red: '#800000',
  yellow: '#806800',
  green: '#005820',
  blue: '#003580',
  wild: '#0d0520',
}

// ─── Canvas Setup ─────────────────────────────────────────────────────────
const W = 512
const H = 768
const R = 48  // corner radius

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

// ─── Number Card ──────────────────────────────────────────────────────────
function drawNumberCard(ctx: CanvasRenderingContext2D, color: string, value: string) {
  // Background
  ctx.fillStyle = COLOR_MAP[color]
  roundedRect(ctx, 0, 0, W, H, R)
  ctx.fill()

  // Inner oval
  ctx.save()
  ctx.fillStyle = LIGHT_COLOR_MAP[color]
  ctx.beginPath()
  ctx.ellipse(W / 2, H / 2, W * 0.32, H * 0.36, 0.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // White border stripe
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'
  ctx.lineWidth = 18
  roundedRect(ctx, 9, 9, W - 18, H - 18, R - 4)
  ctx.stroke()
  ctx.restore()

  // Center number
  ctx.save()
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${value.length > 1 ? 200 : 220}px "Arial Black", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = DARK_COLOR_MAP[color]
  ctx.shadowBlur = 12
  ctx.fillText(value, W / 2, H / 2)
  ctx.restore()

  // Corner labels
  drawCornerLabel(ctx, color, value, 40, 60)
  drawCornerLabel(ctx, color, value, W - 40, H - 60, true)
}

function drawCornerLabel(ctx: CanvasRenderingContext2D, color: string, value: string, x: number, y: number, flipped = false) {
  ctx.save()
  ctx.translate(x, y)
  if (flipped) ctx.rotate(Math.PI)
  ctx.fillStyle = '#fff'
  ctx.font = `bold 60px "Arial Black", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(value, 0, -10)
  ctx.restore()
}

// ─── Action Card ──────────────────────────────────────────────────────────
function drawActionCard(ctx: CanvasRenderingContext2D, color: string, value: string) {
  // Same base as number
  ctx.fillStyle = COLOR_MAP[color]
  roundedRect(ctx, 0, 0, W, H, R)
  ctx.fill()

  // Inner oval
  ctx.save()
  ctx.fillStyle = LIGHT_COLOR_MAP[color]
  ctx.beginPath()
  ctx.ellipse(W / 2, H / 2, W * 0.32, H * 0.36, 0.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Border
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'
  ctx.lineWidth = 18
  roundedRect(ctx, 9, 9, W - 18, H - 18, R - 4)
  ctx.stroke()
  ctx.restore()

  // Symbol
  ctx.save()
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 10
  ctx.font = `bold 180px "Arial Black", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = DARK_COLOR_MAP[color]
  ctx.shadowBlur = 12

  const symbol = value === 'skip' ? '⊘' : value === 'reverse' ? '↺' : '+2'
  ctx.fillText(symbol, W / 2, H / 2)
  ctx.restore()

  // Corner
  const short = value === 'skip' ? '⊘' : value === 'reverse' ? '↺' : '+2'
  drawCornerLabel(ctx, color, short, 40, 60)
  drawCornerLabel(ctx, color, short, W - 40, H - 60, true)
}

// ─── Wild Card ─────────────────────────────────────────────────────────────
function drawWildCard(ctx: CanvasRenderingContext2D, value: string) {
  // Quadrant fill
  const colors = ['#e02020', '#f5c817', '#1fb851', '#1a6fff']
  const quadrants = [
    [0, 0, W / 2, H / 2],
    [W / 2, 0, W / 2, H / 2],
    [0, H / 2, W / 2, H / 2],
    [W / 2, H / 2, W / 2, H / 2],
  ]
  ctx.save()
  roundedRect(ctx, 0, 0, W, H, R)
  ctx.clip()
  quadrants.forEach((q, i) => {
    ctx.fillStyle = colors[i]
    ctx.fillRect(q[0], q[1], q[2], q[3])
  })
  ctx.restore()

  // Center black oval
  ctx.save()
  ctx.fillStyle = '#1a0a2e'
  ctx.beginPath()
  ctx.ellipse(W / 2, H / 2, W * 0.3, H * 0.34, 0.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Text
  ctx.save()
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold 90px "Arial Black", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(value === 'wild4' ? 'WILD' : 'WILD', W / 2, H / 2 - 20)
  if (value === 'wild4') {
    ctx.font = `bold 70px "Arial Black", sans-serif`
    ctx.fillStyle = '#f5c817'
    ctx.fillText('+4', W / 2, H / 2 + 70)
  }
  ctx.restore()

  // Corner labels
  ctx.save()
  ctx.fillStyle = '#fff'
  ctx.font = `bold 42px "Arial Black", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(value === 'wild4' ? 'W+4' : 'W', 44, 60)
  ctx.translate(W - 44, H - 60)
  ctx.rotate(Math.PI)
  ctx.fillText(value === 'wild4' ? 'W+4' : 'W', 0, 0)
  ctx.restore()
}

// ─── Card Back ─────────────────────────────────────────────────────────────
function drawCardBack(ctx: CanvasRenderingContext2D) {
  // Deep red background
  ctx.fillStyle = '#8b0000'
  roundedRect(ctx, 0, 0, W, H, R)
  ctx.fill()

  // Guilloche pattern (simplified)
  ctx.save()
  ctx.strokeStyle = 'rgba(255,200,0,0.18)'
  ctx.lineWidth = 1.5
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2
    ctx.beginPath()
    ctx.ellipse(W / 2, H / 2, 130 + i * 4, 190 + i * 4, angle * 0.3, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()

  // Center oval
  ctx.save()
  ctx.fillStyle = '#6b0000'
  ctx.beginPath()
  ctx.ellipse(W / 2, H / 2, 120, 170, 0.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // UNO logo
  ctx.save()
  ctx.fillStyle = '#f5c817'
  ctx.font = `bold 110px "Arial Black", Impact, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = '#ff6600'
  ctx.shadowBlur = 20
  ctx.fillText('UNO', W / 2, H / 2)
  ctx.restore()

  // Border
  ctx.save()
  ctx.strokeStyle = '#f5c817'
  ctx.lineWidth = 12
  roundedRect(ctx, 6, 6, W - 12, H - 12, R + 2)
  ctx.stroke()
  ctx.restore()
}

// ─── Public API ────────────────────────────────────────────────────────────
export function generateCardTexture(card: Card): THREE.CanvasTexture {
  const key = `${card.color}_${card.value}`
  if (textureCache.has(key)) return textureCache.get(key)!

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!

  if (card.value === 'wild' || card.value === 'wild4') {
    drawWildCard(ctx, card.value)
  } else if (['skip','reverse','draw2'].includes(card.value)) {
    drawActionCard(ctx, card.color, card.value)
  } else {
    drawNumberCard(ctx, card.color, card.value)
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  tex.needsUpdate = true
  textureCache.set(key, tex)
  return tex
}

export function generateCardBackTexture(): THREE.CanvasTexture {
  const key = '__back__'
  if (textureCache.has(key)) return textureCache.get(key)!
  
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  drawCardBack(ctx)
  
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  tex.needsUpdate = true
  textureCache.set(key, tex)
  return tex
}

export function clearTextureCache() {
  textureCache.forEach(tex => tex.dispose())
  textureCache.clear()
}

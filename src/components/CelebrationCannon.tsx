import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  shape: 'rect' | 'circle' | 'heart' | 'ribbon'
  rotation: number
  vRot: number
  opacity: number
  decay: number
  gravity: number
}

const CELEBRATION_COLORS = [
  '#ffd700', // Gold
  '#ffb347', // Light Gold
  '#ff4081', // Rose Pink
  '#e8175d', // Royal Crimson
  '#ffffff', // Diamond White
  '#ff85b1', // Soft Pink
  '#ffe082', // Champagne Gold
]

export default function CelebrationCannon() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const animIdRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    const spawnBlast = (originX: number, originY: number, count: number, angleMin: number, angleMax: number) => {
      const newParticles: Particle[] = []
      for (let i = 0; i < count; i++) {
        const angle = angleMin + Math.random() * (angleMax - angleMin)
        const speed = Math.random() * 16 + 10
        const shapeRand = Math.random()
        const shape = shapeRand < 0.4 ? 'ribbon' : shapeRand < 0.7 ? 'heart' : 'rect'

        newParticles.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: shape === 'ribbon' ? Math.random() * 10 + 8 : Math.random() * 8 + 6,
          color: CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)],
          shape,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.25,
          opacity: 1,
          decay: Math.random() * 0.008 + 0.006,
          gravity: 0.38,
        })
      }
      particlesRef.current.push(...newParticles)
    }

    const fireDoubleCannon = () => {
      // Left cannon shooting up-right
      spawnBlast(width * 0.1, height * 0.9, 75, -Math.PI * 0.45, -Math.PI * 0.15)
      // Right cannon shooting up-left
      spawnBlast(width * 0.9, height * 0.9, 75, -Math.PI * 0.85, -Math.PI * 0.55)
      // Center starburst
      spawnBlast(width * 0.5, height * 0.45, 55, -Math.PI, Math.PI)
    }

    const onCelebrateEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ x?: number; y?: number }>
      if (customEvent.detail && typeof customEvent.detail.x === 'number') {
        spawnBlast(
          customEvent.detail.x,
          customEvent.detail.y || height * 0.5,
          65,
          -Math.PI,
          Math.PI
        )
      } else {
        fireDoubleCannon()
      }
    }

    window.addEventListener('wedding:celebrate', onCelebrateEvent)

    const drawHeart = (c: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      c.beginPath()
      const topCurveHeight = size * 0.3
      c.moveTo(x, y + topCurveHeight)
      c.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + topCurveHeight)
      c.bezierCurveTo(x - size / 2, y + (size + topCurveHeight) / 2, x, y + size, x, y + size)
      c.bezierCurveTo(x, y + size, x + size / 2, y + (size + topCurveHeight) / 2, x + size / 2, y + topCurveHeight)
      c.bezierCurveTo(x + size / 2, y, x, y, x, y + topCurveHeight)
      c.closePath()
      c.fill()
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      const particles = particlesRef.current
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.vy += p.gravity
        p.vx *= 0.985
        p.rotation += p.vRot
        p.opacity -= p.decay

        if (p.opacity <= 0 || p.y > height + 50) {
          particles.splice(i, 1)
          continue
        }

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.globalAlpha = Math.max(0, p.opacity)
        ctx.fillStyle = p.color
        ctx.shadowColor = p.color
        ctx.shadowBlur = 4

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.6)
        } else if (p.shape === 'ribbon') {
          ctx.fillRect(-p.size, -p.size * 0.3, p.size * 2, p.size * 0.6)
        } else if (p.shape === 'heart') {
          drawHeart(ctx, 0, -p.size / 2, p.size)
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.restore()
      }

      animIdRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('wedding:celebrate', onCelebrateEvent)
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 10000,
        width: '100vw',
        height: '100vh',
      }}
      aria-hidden="true"
    />
  )
}

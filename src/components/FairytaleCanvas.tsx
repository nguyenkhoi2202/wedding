import { useEffect, useRef } from 'react'

interface Petal {
  x: number
  y: number
  size: number
  pitch: number // 3D rotation X
  yaw: number   // 3D rotation Y
  roll: number  // 2D rotation Z
  vPitch: number
  vYaw: number
  vRoll: number
  vy: number
  vx: number
  colorIndex: number
  flipSpeed: number
}

interface Firefly {
  x: number
  y: number
  radius: number
  baseAlpha: number
  pulseSpeed: number
  phase: number
  vx: number
  vy: number
  color: string
}

const PETAL_GRADIENTS = [
  ['#ff758c', '#ff7eb3', '#ffc3a0'], // Rose blush
  ['#e8175d', '#ff4081', '#f8bbd0'], // Royal crimson
  ['#ffffff', '#ffeef4', '#ffc2d1'], // White pearl petal
  ['#f06292', '#ec407a', '#f48fb1'], // Sakura pink
]

const FIREFLY_COLORS = [
  'rgba(255, 215, 0, ',    // Golden
  'rgba(255, 182, 193, ',  // Light pink
  'rgba(255, 235, 160, ',  // Warm champagne
]

export default function FairytaleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // Cap DPR ở 2 để màn hình retina nét mà không tốn fill-rate.
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let width = window.innerWidth
    let height = window.innerHeight

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    // Vẽ sẵn mỗi loại cánh hoa / đom đóm một lần, mỗi khung hình chỉ drawImage.
    const SPRITE = 64
    const petalSprites = PETAL_GRADIENTS.map((colors) => {
      const off = document.createElement('canvas')
      off.width = off.height = SPRITE
      const c = off.getContext('2d')!
      const r = SPRITE / 2 - 4
      const grad = c.createLinearGradient(-r, -r, r, r)
      grad.addColorStop(0, colors[0])
      grad.addColorStop(0.5, colors[1])
      grad.addColorStop(1, colors[2])
      c.translate(SPRITE / 2, SPRITE / 2)
      c.fillStyle = grad
      c.beginPath()
      c.moveTo(0, -r)
      c.bezierCurveTo(r * 0.8, -r * 0.8, r * 0.8, r * 0.6, 0, r)
      c.bezierCurveTo(-r * 0.8, r * 0.6, -r * 0.8, -r * 0.8, 0, -r)
      c.closePath()
      c.fill()
      return off
    })

    const fireflySprites = FIREFLY_COLORS.map((color) => {
      const off = document.createElement('canvas')
      off.width = off.height = SPRITE
      const c = off.getContext('2d')!
      const g = c.createRadialGradient(SPRITE / 2, SPRITE / 2, 0, SPRITE / 2, SPRITE / 2, SPRITE / 2)
      g.addColorStop(0, `${color}1)`)
      g.addColorStop(0.35, `${color}0.5)`)
      g.addColorStop(1, `${color}0)`)
      c.fillStyle = g
      c.fillRect(0, 0, SPRITE, SPRITE)
      return off
    })

    let running = true
    let animId = 0

    const loop = () => {
      if (!running) return
      render()
      animId = requestAnimationFrame(loop)
    }
    const handleVisibility = () => {
      const visible = document.visibilityState === 'visible'
      if (visible && !running) {
        running = true
        animId = requestAnimationFrame(loop)
      } else if (!visible) {
        running = false
        cancelAnimationFrame(animId)
      }
    }

    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', handleVisibility)

    // Wind influence from scroll
    let targetWind = 0
    let currentWind = 0
    let lastScrollY = window.scrollY

    const handleScroll = () => {
      const sy = window.scrollY
      const diff = sy - lastScrollY
      lastScrollY = sy
      targetWind = Math.max(-4, Math.min(4, diff * 0.12))
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    const PETAL_COUNT = window.innerWidth < 768 ? 16 : 30
    const petals: Petal[] = Array.from({ length: PETAL_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 10 + 12,
      pitch: Math.random() * Math.PI,
      yaw: Math.random() * Math.PI,
      roll: Math.random() * Math.PI * 2,
      vPitch: Math.random() * 0.03 + 0.01,
      vYaw: Math.random() * 0.02 + 0.01,
      vRoll: (Math.random() - 0.5) * 0.02,
      vy: Math.random() * 1.2 + 0.8,
      vx: (Math.random() - 0.5) * 0.6,
      colorIndex: Math.floor(Math.random() * PETAL_GRADIENTS.length),
      flipSpeed: Math.random() * 0.04 + 0.02,
    }))

    const FIREFLY_COUNT = window.innerWidth < 768 ? 10 : 22
    const fireflies: (Firefly & { sprite: number })[] = Array.from({ length: FIREFLY_COUNT }, () => {
      const sprite = Math.floor(Math.random() * FIREFLY_COLORS.length)
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2.5 + 1.2,
        baseAlpha: Math.random() * 0.4 + 0.35,
        pulseSpeed: Math.random() * 0.04 + 0.02,
        phase: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -(Math.random() * 0.5 + 0.3), // Drifts softly upwards
        color: FIREFLY_COLORS[sprite],
        sprite,
      }
    })

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      currentWind += (targetWind - currentWind) * 0.05
      targetWind *= 0.95

      for (const f of fireflies) {
        f.x += f.vx + currentWind * 0.4
        f.y += f.vy
        f.phase += f.pulseSpeed

        if (f.y < -20) f.y = height + 10
        if (f.x < -20) f.x = width + 10
        if (f.x > width + 20) f.x = -10

        const size = f.radius * 8
        ctx.globalAlpha = Math.max(0.1, f.baseAlpha + Math.sin(f.phase) * 0.25)
        ctx.drawImage(fireflySprites[f.sprite], f.x - size / 2, f.y - size / 2, size, size)
      }

      ctx.globalAlpha = 0.82
      for (const p of petals) {
        p.x += p.vx + currentWind + Math.sin(p.roll) * 0.6
        p.y += p.vy
        p.pitch += p.vPitch
        p.yaw += p.vYaw
        p.roll += p.vRoll

        if (p.y > height + 40) {
          p.y = -30
          p.x = Math.random() * width
          p.pitch = Math.random() * Math.PI
          p.yaw = Math.random() * Math.PI
        }
        if (p.x > width + 40) p.x = -30
        if (p.x < -40) p.x = width + 30

        const scaleX = Math.cos(p.yaw)
        const scaleY = Math.cos(p.pitch)
        if (Math.abs(scaleX) < 0.05 || Math.abs(scaleY) < 0.05) continue

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.roll)
        ctx.scale(scaleX, scaleY)
        ctx.drawImage(petalSprites[p.colorIndex], -p.size, -p.size, p.size * 2, p.size * 2)
        ctx.restore()
      }
      ctx.globalAlpha = 1
    }

    animId = requestAnimationFrame(loop)

    return () => {
      running = false
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('scroll', handleScroll)
      cancelAnimationFrame(animId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 2,
        width: '100%',
        height: '100%',
      }}
      aria-hidden="true"
    />
  )
}

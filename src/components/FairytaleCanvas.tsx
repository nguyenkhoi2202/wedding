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

    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)
    let isVisible = true

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    const handleVisibility = () => {
      isVisible = document.visibilityState === 'visible'
    }

    window.addEventListener('resize', handleResize)
    document.addEventListener('visibilitychange', handleVisibility)

    // Wind influence from scroll/mouse
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

    // Generate Petals
    const PETAL_COUNT = window.innerWidth < 768 ? 20 : 32
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

    // Generate Golden Fairy Fireflies
    const FIREFLY_COUNT = window.innerWidth < 768 ? 16 : 26
    const fireflies: Firefly[] = Array.from({ length: FIREFLY_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2.5 + 1.2,
      baseAlpha: Math.random() * 0.4 + 0.35,
      pulseSpeed: Math.random() * 0.04 + 0.02,
      phase: Math.random() * Math.PI * 2,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -(Math.random() * 0.5 + 0.3), // Drifts softly upwards
      color: FIREFLY_COLORS[Math.floor(Math.random() * FIREFLY_COLORS.length)],
    }))

    // Draw single 3D petal using bezier curves
    const drawPetal = (c: CanvasRenderingContext2D, p: Petal) => {
      const scaleX = Math.cos(p.yaw)
      const scaleY = Math.cos(p.pitch)
      if (Math.abs(scaleX) < 0.05 || Math.abs(scaleY) < 0.05) return

      c.save()
      c.translate(p.x, p.y)
      c.rotate(p.roll)
      c.scale(scaleX, scaleY)

      const colors = PETAL_GRADIENTS[p.colorIndex]
      const grad = c.createLinearGradient(-p.size, -p.size, p.size, p.size)
      grad.addColorStop(0, colors[0])
      grad.addColorStop(0.5, colors[1])
      grad.addColorStop(1, colors[2])

      c.fillStyle = grad
      c.shadowColor = 'rgba(232, 23, 93, 0.25)'
      c.shadowBlur = 3
      c.globalAlpha = 0.82

      c.beginPath()
      c.moveTo(0, -p.size)
      c.bezierCurveTo(p.size * 0.8, -p.size * 0.8, p.size * 0.8, p.size * 0.6, 0, p.size)
      c.bezierCurveTo(-p.size * 0.8, p.size * 0.6, -p.size * 0.8, -p.size * 0.8, 0, -p.size)
      c.closePath()
      c.fill()

      c.restore()
    }

    let animId: number

    const render = () => {
      if (isVisible) {
        ctx.clearRect(0, 0, width, height)

        // Smooth wind damping
        currentWind += (targetWind - currentWind) * 0.05
        targetWind *= 0.95

        // Render Fireflies first (in background)
        for (const f of fireflies) {
          f.x += f.vx + currentWind * 0.4
          f.y += f.vy
          f.phase += f.pulseSpeed

          // Wrap around screen
          if (f.y < -20) f.y = height + 10
          if (f.x < -20) f.x = width + 10
          if (f.x > width + 20) f.x = -10

          const alpha = Math.max(0.1, f.baseAlpha + Math.sin(f.phase) * 0.25)
          const glowRadius = f.radius * 4

          const radGrad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, glowRadius)
          radGrad.addColorStop(0, `${f.color}${alpha})`)
          radGrad.addColorStop(0.35, `${f.color}${alpha * 0.5})`)
          radGrad.addColorStop(1, `${f.color}0)`)

          ctx.fillStyle = radGrad
          ctx.beginPath()
          ctx.arc(f.x, f.y, glowRadius, 0, Math.PI * 2)
          ctx.fill()
        }

        // Render 3D Petals
        for (const p of petals) {
          p.x += p.vx + currentWind + Math.sin(p.roll) * 0.6
          p.y += p.vy
          p.pitch += p.vPitch
          p.yaw += p.vYaw
          p.roll += p.vRoll

          // Reset when fallen below screen
          if (p.y > height + 40) {
            p.y = -30
            p.x = Math.random() * width
            p.pitch = Math.random() * Math.PI
            p.yaw = Math.random() * Math.PI
          }
          if (p.x > width + 40) p.x = -30
          if (p.x < -40) p.x = width + 30

          drawPetal(ctx, p)
        }
      }

      animId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
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
        width: '100vw',
        height: '100vh',
      }}
      aria-hidden="true"
    />
  )
}

import { useEffect, useState } from 'react'

interface Sparkle {
  id: number
  x: number
  y: number
  char: string
  size: number
}

const SPARKLE_CHARS = ['✨', '✧', '💖', '🌸', '★', '💕']

export default function SparkleTrail() {
  const [sparkles, setSparkles] = useState<Sparkle[]>([])

  useEffect(() => {
    let idCounter = 0
    let lastTime = 0

    const addSparkle = (x: number, y: number) => {
      const now = Date.now()
      // Throttle sparkle creation for high performance (at most 1 sparkle per 45ms)
      if (now - lastTime < 45) return
      lastTime = now

      const newSparkle: Sparkle = {
        id: ++idCounter,
        x,
        y,
        char: SPARKLE_CHARS[Math.floor(Math.random() * SPARKLE_CHARS.length)],
        size: Math.floor(Math.random() * 8) + 12,
      }

      setSparkles((prev) => [...prev.slice(-15), newSparkle])

      setTimeout(() => {
        setSparkles((prev) => prev.filter((s) => s.id !== newSparkle.id))
      }, 750)
    }

    const handleMouseMove = (e: MouseEvent) => {
      addSparkle(e.clientX, e.clientY)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        addSparkle(e.touches[0].clientX, e.touches[0].clientY)
      }
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [])

  return (
    <div className="sparkle-trail-container" aria-hidden="true">
      {sparkles.map((s) => (
        <span
          key={s.id}
          className="trail-sparkle"
          style={{
            left: s.x,
            top: s.y,
            fontSize: `${s.size}px`,
          }}
        >
          {s.char}
        </span>
      ))}
    </div>
  )
}

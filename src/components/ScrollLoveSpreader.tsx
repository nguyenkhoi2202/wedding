import { useEffect, useRef, useState } from 'react'

interface LoveParticle {
  id: number
  x: number
  y: number
  emoji: string
  size: number
  vx: number
  vy: number
  rot: number
  vRot: number
  color?: string
}

const FLOWERS = ['🌸', '🌹', '🌺', '💮', '✿', '❀']
const HEARTS = ['💗', '💖', '💕', '🤍', '✨', '💐']

export default function ScrollLoveSpreader() {
  const [particles, setParticles] = useState<LoveParticle[]>([])
  const lastScrollY = useRef(0)
  const idCounter = useRef(0)

  // Scroll listener: scatter petals & hearts as user scrolls down or up
  useEffect(() => {
    let accumulatedDelta = 0

    const spawnParticles = (count: number, side?: 'left' | 'right' | 'both') => {
      const newItems: LoveParticle[] = []
      const vh = window.innerHeight
      const vw = window.innerWidth

      for (let i = 0; i < count; i++) {
        const isLeft = side === 'left' ? true : side === 'right' ? false : Math.random() > 0.5
        const isHeart = Math.random() > 0.4
        const emoji = isHeart
          ? HEARTS[Math.floor(Math.random() * HEARTS.length)]
          : FLOWERS[Math.floor(Math.random() * FLOWERS.length)]

        // Scatter along left or right side of current viewport
        const startX = isLeft
          ? Math.random() * (vw * 0.22) + 10
          : vw - (Math.random() * (vw * 0.22) + 20)

        // Stagger along vertical center of viewport
        const startY = (vh * 0.25) + Math.random() * (vh * 0.5)

        newItems.push({
          id: ++idCounter.current,
          x: startX,
          y: startY,
          emoji,
          size: Math.floor(Math.random() * 12) + (isHeart ? 16 : 20),
          vx: (isLeft ? 1 : -1) * (Math.random() * 1.8 + 0.8),
          vy: Math.random() * -1.5 - 0.5,
          rot: Math.random() * 360,
          vRot: (Math.random() - 0.5) * 8,
        })
      }

      setParticles((prev) => [...prev.slice(-30), ...newItems])
    }

    const handleScroll = () => {
      const currentY = window.scrollY
      const delta = Math.abs(currentY - lastScrollY.current)
      accumulatedDelta += delta
      lastScrollY.current = currentY

      // Every ~75px of scroll, spawn a flutter of 2-3 petals & hearts
      if (accumulatedDelta > 75) {
        const batch = Math.min(Math.floor(accumulatedDelta / 70), 4)
        spawnParticles(batch, 'both')
        accumulatedDelta = 0
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Interactive Tap / Click: burst glowing hearts where finger touched
  useEffect(() => {
    const handleTap = (clientX: number, clientY: number) => {
      const pageX = clientX
      const pageY = clientY
      const newItems: LoveParticle[] = []

      // Burst 4 love particles on tap
      for (let i = 0; i < 4; i++) {
        const isHeart = Math.random() > 0.3
        const emoji = isHeart
          ? HEARTS[Math.floor(Math.random() * HEARTS.length)]
          : FLOWERS[Math.floor(Math.random() * FLOWERS.length)]

        const angle = (Math.PI * 2 * i) / 4 + (Math.random() - 0.5) * 0.5
        const speed = Math.random() * 3 + 2

        newItems.push({
          id: ++idCounter.current,
          x: pageX + (Math.random() - 0.5) * 20,
          y: pageY + (Math.random() - 0.5) * 20,
          emoji,
          size: Math.floor(Math.random() * 10) + 18,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2.5,
          rot: Math.random() * 360,
          vRot: (Math.random() - 0.5) * 12,
        })
      }

      setParticles((prev) => [...prev.slice(-35), ...newItems])
    }

    const onPointerDown = (e: PointerEvent) => {
      // Avoid firing on clickable buttons / inputs to keep UI snappy
      const target = e.target as HTMLElement
      if (
        target.closest('button') ||
        target.closest('input') ||
        target.closest('select') ||
        target.closest('textarea') ||
        target.closest('a')
      ) {
        return
      }
      handleTap(e.clientX, e.clientY)
    }

    window.addEventListener('pointerdown', onPointerDown, { passive: true })
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [])

  // Cleanup old particles automatically
  useEffect(() => {
    if (particles.length === 0) return

    const timer = setTimeout(() => {
      setParticles((prev) => prev.slice(Math.max(prev.length - 15, 0)))
    }, 1800)

    return () => clearTimeout(timer)
  }, [particles])

  return (
    <div className="scroll-love-spreader" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="spreader-particle"
          style={{
            transform: `translate3d(${p.x}px, ${p.y}px, 0) rotate(${p.rot}deg)`,
            fontSize: `${p.size}px`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  )
}

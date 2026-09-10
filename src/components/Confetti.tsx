import { useEffect, useState } from 'react'

const COLORS = [
  '#e8175d', '#ff6b9d', '#ffc02e', '#ff8a00',
  '#7c4dff', '#14c08a', '#ffb32e', '#ff85b1', '#ffd700',
]
const SHAPES = ['circle', 'rect', 'heart'] as const

function makeParticles() {
  return Array.from({ length: 60 }, (_, i) => ({
    id: `${Date.now()}-${i}`,
    shape: SHAPES[i % 3],
    style: {
      '--x-end': `${(Math.random() - 0.5) * 350}px`,
      '--y-end': `${150 + Math.random() * 350}px`,
      '--rotation': `${Math.random() * 720 - 360}deg`,
      '--delay': `${Math.random() * 0.4}s`,
      '--size': `${5 + Math.random() * 9}px`,
      backgroundColor: COLORS[i % COLORS.length],
    } as React.CSSProperties,
  }))
}

export default function Confetti({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<ReturnType<typeof makeParticles>>([])

  useEffect(() => {
    if (!active) return
    setParticles(makeParticles())
    const timer = setTimeout(() => setParticles([]), 3500)
    return () => clearTimeout(timer)
  }, [active])

  if (particles.length === 0) return null

  return (
    <div className="confetti-burst" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className={`confetti-piece confetti-${p.shape}`}
          style={p.style}
        />
      ))}
    </div>
  )
}

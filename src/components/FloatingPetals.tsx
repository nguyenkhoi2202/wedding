import { useMemo } from 'react'

const ITEMS = ['🌸', '✿', '❀', '✨', '💮', '🌸', '✿', '✨']

export default function FloatingPetals() {
  const petals = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        emoji: ITEMS[i % ITEMS.length],
        style: {
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          '--drift-duration': `${18 + Math.random() * 15}s`,
          '--drift-delay': `${Math.random() * 15}s`,
          '--petal-opacity': `${0.12 + Math.random() * 0.28}`,
          fontSize: `${10 + Math.random() * 14}px`,
        } as React.CSSProperties,
      })),
    []
  )

  return (
    <div className="floating-petals" aria-hidden="true">
      {petals.map((p) => (
        <span
          key={p.id}
          className={`float-petal fp-${p.id % 4}`}
          style={p.style}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  )
}

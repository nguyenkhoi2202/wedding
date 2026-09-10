import { useMemo } from 'react'

const HEARTS = ['❤', '💕', '💗', '🤍', '💖', '♡']

export default function HeartRain() {
  const hearts = useMemo(
    () =>
      Array.from({ length: 35 }, (_, i) => ({
        id: i,
        emoji: HEARTS[i % HEARTS.length],
        style: {
          left: `${Math.random() * 100}%`,
          '--fall-duration': `${10 + Math.random() * 12}s`,
          '--fall-delay': `${Math.random() * 10}s`,
          '--heart-opacity': `${0.2 + Math.random() * 0.4}`,
          '--sway-amount': `${15 + Math.random() * 25}px`,
          fontSize: `${10 + Math.random() * 20}px`,
        } as React.CSSProperties,
      })),
    []
  )

  return (
    <div className="heart-rain" aria-hidden="true">
      {hearts.map((h) => (
        <span key={h.id} className="rain-heart" style={h.style}>
          {h.emoji}
        </span>
      ))}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'

interface FloatingLove {
  id: number
  type: 'heart' | 'text'
  content: string
  x: number // percent across container
  color?: string
  scale: number
  swayDir: number
}

const BLESSINGS = [
  'Trăm năm hạnh phúc! 💍',
  'Vĩnh kết đồng tâm! 💐',
  'Xứng đôi vừa lứa! 💖',
  'Mãi mãi bên nhau! ✨',
  'Happy Wedding! 🥂',
  'Răng long đầu bạc! 🤍',
  'Tình yêu ngọt ngào! 🍓',
  'Cặp đôi hoàn hảo! 👑',
]

const HEART_COLORS = [
  '#ff2a6d',
  '#ff5e7e',
  '#ff99c8',
  '#ffd166',
  '#9d4edd',
  '#ff477e',
  '#e8175d',
]

const HEART_ICONS = ['❤️', '💖', '💕', '💗', '💓', '✨', '💐']

export default function LiveLoveReactions() {
  const [count, setCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('wedding_love_count')
      return saved ? parseInt(saved, 10) : 520
    } catch {
      return 520
    }
  })

  const [floaters, setFloaters] = useState<FloatingLove[]>([])
  const [isPulsing, setIsPulsing] = useState(false)
  const idCounter = useRef(0)
  const tapCount = useRef(0)

  const handleSendLove = () => {
    // Haptic vibration on mobile
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([15, 20, 15])
    }

    setIsPulsing(true)
    setTimeout(() => setIsPulsing(false), 200)

    tapCount.current += 1
    const newCount = count + 1
    setCount(newCount)
    try {
      localStorage.setItem('wedding_love_count', String(newCount))
    } catch {
      // Ignore storage errors
    }

    const newItems: FloatingLove[] = []

    // 1. Always spawn 3-4 flying hearts
    const heartCount = Math.floor(Math.random() * 2) + 3
    for (let i = 0; i < heartCount; i++) {
      const randomIcon = HEART_ICONS[Math.floor(Math.random() * HEART_ICONS.length)]
      const randomColor = HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)]
      newItems.push({
        id: ++idCounter.current,
        type: 'heart',
        content: randomIcon,
        x: 50 + (Math.random() - 0.5) * 60,
        color: randomColor,
        scale: 0.8 + Math.random() * 0.6,
        swayDir: (Math.random() - 0.5) * 40,
      })
    }

    // 2. Every 2 taps, spawn a romantic blessing message bubble
    if (tapCount.current % 2 === 1) {
      const randomBlessing = BLESSINGS[Math.floor(Math.random() * BLESSINGS.length)]
      newItems.push({
        id: ++idCounter.current,
        type: 'text',
        content: randomBlessing,
        x: 50 + (Math.random() - 0.5) * 40,
        scale: 1,
        swayDir: (Math.random() - 0.5) * 20,
      })
    }

    setFloaters((prev) => [...prev.slice(-25), ...newItems])
  }

  // Clean up floaters after animation finishes
  useEffect(() => {
    if (floaters.length === 0) return
    const timer = setTimeout(() => {
      setFloaters((prev) => prev.slice(3))
    }, 2800)
    return () => clearTimeout(timer)
  }, [floaters])

  return (
    <div className="live-love-widget" aria-label="Gửi tim chúc phúc cô dâu chú rể">
      {/* Floating hearts and blessings viewport */}
      <div className="live-love-viewport" aria-hidden="true">
        {floaters.map((item) => (
          <div
            key={item.id}
            className={`floating-love-item ${item.type === 'text' ? 'love-bubble' : 'love-heart'}`}
            style={{
              left: `${item.x}%`,
              '--sway-x': `${item.swayDir}px`,
              '--scale-val': item.scale,
              color: item.color,
            } as React.CSSProperties}
          >
            {item.content}
          </div>
        ))}
      </div>

      {/* Floating Reaction Button */}
      <button
        type="button"
        className={`live-love-btn ${isPulsing ? 'btn-pressed' : ''}`}
        onClick={handleSendLove}
        title="Thả tim chúc phúc cho cô dâu & chú rể"
      >
        <span className="live-love-icon">💖</span>
        <span className="live-love-text">Chúc Phúc</span>
        <span className="live-love-badge">{count.toLocaleString('vi-VN')}</span>
      </button>
    </div>
  )
}

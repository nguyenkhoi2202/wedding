import { useEffect, useState } from 'react'
import { useConfigStore } from '../store'

function parseTarget(date: string, time: string) {
  const [d, m, y] = date.split('/').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0).getTime()
}

const UNITS = [
  { key: 'days', label: 'NGÀY', cls: 'u-day' },
  { key: 'hours', label: 'GIỜ', cls: 'u-hour' },
  { key: 'minutes', label: 'PHÚT', cls: 'u-min' },
  { key: 'seconds', label: 'GIÂY', cls: 'u-sec' },
] as const

export default function Countdown() {
  const { config } = useConfigStore()
  const [left, setLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [done, setDone] = useState(false)

  useEffect(() => {
    const target = parseTarget(config.eventDate, config.eventTime)

    const tick = () => {
      const diff = target - Date.now()
      if (!Number.isFinite(target) || diff <= 0) {
        setDone(true)
        setLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }
      setDone(false)
      setLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      })
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [config.eventDate, config.eventTime])

  return (
    <div className={`countdown-block reveal ${done ? 'celebration' : ''}`}>
      <div className="section-head countdown-head">
        <p className="section-script-subtitle">Waiting For The Big Day</p>
        <h2>Đếm Ngược Tới Ngày Vui</h2>
        <div className="section-rule" />
        <p className="section-description">
          Từng khoảnh khắc trôi qua đều đưa chúng tôi đến gần hơn với ngày chung đôi.
        </p>
      </div>

      <div className="card countdown-card">
        <div className="countdown-top-badge pulse-badge">
          <span>⏳ {config.eventBadge}</span>
        </div>

        <p className="countdown-date-str">
          {config.eventWeekday}, ngày {config.eventDate} ({config.eventTime})
        </p>

        {/* 4 tiles kept on a single row with fluid sizing */}
        <div className="countdown-grid">
          {UNITS.map((u) => {
            const currentVal = left[u.key as keyof typeof left]
            return (
              <div key={u.key} className={`countdown-tile ${u.cls}`}>
                <div className="tile-glow" />
                <div className="countdown-number">
                  <span>{String(currentVal).padStart(2, '0')}</span>
                </div>
                <span className="countdown-label">{u.label}</span>
              </div>
            )
          })}
        </div>

        <div className="countdown-footer-note">
          {done ? (
            <span className="countdown-celebrate">✨ Khoảnh khắc hạnh phúc đã đến! ✨</span>
          ) : (
            <span>Hân hạnh được đón tiếp Quý Khách trong ngày trọng đại!</span>
          )}
        </div>
      </div>
    </div>
  )
}

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
    <div className="countdown-block reveal">
      <div className="section-head">
        <h2>Đếm Ngược Tới Ngày Vui</h2>
        <div className="section-rule" />
        <p>Từng khoảnh khắc đều đưa chúng tôi đến gần hơn với ngày tân hôn.</p>
      </div>

      <div className="card countdown-card">
        <span className="countdown-badge">{config.eventBadge}</span>
        <p className="countdown-date">
          {config.eventWeekday}, {config.eventDate}
        </p>

        <div className="countdown-grid">
          {UNITS.map((u) => (
            <div key={u.key} className={`countdown-tile ${u.cls}`}>
              <strong>{String(left[u.key]).padStart(2, '0')}</strong>
              <small>{u.label}</small>
            </div>
          ))}
        </div>

        <p className="countdown-note">
          {done ? 'Khoảnh khắc hạnh phúc đã đến!' : 'Hẹn gặp Quý Khách trong ngày vui!'}
        </p>
      </div>
    </div>
  )
}

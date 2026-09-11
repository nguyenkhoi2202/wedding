import { useEffect, useState } from 'react'
import { useConfigStore } from '../store'

interface WeddingGateProps {
  onOpen: () => void
}

export default function WeddingGate({ onOpen }: WeddingGateProps) {
  const { config } = useConfigStore()
  const [isOpening, setIsOpening] = useState(false)
  const [isGone, setIsGone] = useState(false)

  // Couple initials
  const groomInitial = config.groomName ? config.groomName.trim().slice(-1).toUpperCase() : 'T'
  const brideInitial = config.brideName ? config.brideName.trim().slice(-1).toUpperCase() : 'N'
  const monogram = `${groomInitial} ♡ ${brideInitial}`

  // Personalized guest name from URL params (?to=... or ?guest=...)
  const [guestName, setGuestName] = useState<string>('')

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const to = params.get('to') || params.get('guest') || params.get('name')
      if (to && to.trim()) {
        setGuestName(to.trim())
      }
    } catch {
      // Ignore URL parsing error
    }
  }, [])

  // Lock scroll while gate is visible
  useEffect(() => {
    if (!isGone) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isGone])

  const handleOpenGate = () => {
    if (isOpening) return
    setIsOpening(true)

    // Trigger celebration cannon & music immediately on user click
    window.dispatchEvent(new CustomEvent('wedding:celebrate'))
    onOpen()
    window.dispatchEvent(new CustomEvent('wedding:play-music'))

    // Play full unboxing & gate opening animation, then remove
    setTimeout(() => {
      setIsGone(true)
    }, 1400)
  }

  if (isGone) return null

  return (
    <div className={`wedding-gate-overlay ${isOpening ? 'gate-opening' : ''}`}>
      {/* Ambient romantic glow & sparkles */}
      <div className="gate-ambient-glow" />

      {/* Floating flower petals and sparkles inside gate */}
      <div className="gate-particles" aria-hidden="true">
        {Array.from({ length: 22 }).map((_, i) => (
          <span
            key={i}
            className={`gate-particle particle-${(i % 4) + 1}`}
            style={{
              left: `${(i * 4.6) + (i % 2 ? 3 : 0)}%`,
              animationDelay: `${(i * 0.35) % 4}s`,
              animationDuration: `${7 + (i % 3) * 2}s`,
            }}
          >
            {i % 3 === 0 ? '🌸' : i % 3 === 1 ? '✨' : '💖'}
          </span>
        ))}
      </div>

      {/* 3D Gate Doors */}
      <div className="gate-doors-container">
        {/* Left Floral Gate Door */}
        <div className="gate-door gate-door-left">
          <div className="door-lattice" />
          <div className="door-floral-vines top-left">🌸 🌿 🌺 🍃 🌸</div>
          <div className="door-floral-vines bottom-left">🌺 🍃 🌸 🌿 🌺</div>
          <div className="door-trim gold-trim" />
        </div>

        {/* Right Floral Gate Door */}
        <div className="gate-door gate-door-right">
          <div className="door-lattice" />
          <div className="door-floral-vines top-right">🌸 🍃 🌺 🌿 🌸</div>
          <div className="door-floral-vines bottom-right">🌺 🌿 🌸 🍃 🌺</div>
          <div className="door-trim gold-trim" />
        </div>
      </div>

      {/* Floral Arch Crown Top */}
      <div className="gate-arch-crown">
        <span className="arch-flower f1">🌺</span>
        <span className="arch-flower f2">🌸</span>
        <span className="arch-flower f3">🌹</span>
        <span className="arch-flower fcenter">❀ ❦ ❀</span>
        <span className="arch-flower f4">🌹</span>
        <span className="arch-flower f5">🌸</span>
        <span className="arch-flower f6">🌺</span>
      </div>

      {/* 3D LUXURY ROYAL ENVELOPE UNBOXING */}
      <div className="envelope-3d-scene" onClick={handleOpenGate}>
        <div className="envelope-wrapper">
          {/* Back pocket */}
          <div className="envelope-back" />

          {/* Letter Card sliding out of envelope */}
          <div className="envelope-letter-card">
            {/* Gold Corner Filigrees */}
            <div className="card-filigree top-left">❦</div>
            <div className="card-filigree top-right">❦</div>

            <p className="gate-script-kicker">Save Our Date</p>

            {guestName && (
              <div className="gate-vip-guest-badge">
                <span className="vip-badge-icon">💌</span>
                <span>Kính gửi: <strong>{guestName}</strong></span>
              </div>
            )}

            <h2 className="gate-event-title">LỄ THÀNH HÔN</h2>

            <div className="gate-divider">
              <span className="divider-line" />
              <span className="divider-icon">❦</span>
              <span className="divider-line" />
            </div>

            <h1 className="gate-couple-names">
              {config.groomName} <span className="couple-heart">♡</span> {config.brideName}
            </h1>

            <div className="gate-date-badge">
              <span>🗓️ {config.eventWeekday} • {config.eventDate}</span>
            </div>

            <p className="gate-welcome-note">
              Trân trọng kính mời Quý Khách cùng bước vào không gian ngày hạnh phúc của chúng mình.
            </p>

            <button
              type="button"
              className="btn-open-invitation"
              onClick={handleOpenGate}
              aria-label="Mở thiệp cưới và phát nhạc"
            >
              <span className="open-btn-shimmer" />
              <span className="open-btn-icon">💌</span>
              <span className="open-btn-text">CHẠM ĐỂ MỞ THIỆP</span>
              <span className="open-btn-music-icon">♫</span>
            </button>

            <p className="gate-tap-hint">
              <span>✨ Nhạc nền "Một Đời" sẽ tự động phát khi mở ✨</span>
            </p>
          </div>

          {/* Front Pocket of Envelope */}
          <div className="envelope-front-pocket">
            <div className="pocket-gold-border" />
            <div className="pocket-ribbon" />
          </div>

          {/* 3D Flap of Envelope */}
          <div className="envelope-flap">
            <div className="flap-gold-rim" />
            {/* Royal 3D Wax Seal on flap */}
            <div className="gate-wax-seal">
              <div className="wax-seal-inner">
                <span className="wax-seal-icon">💌</span>
                <span className="wax-seal-text">{monogram}</span>
              </div>
              <div className="wax-seal-glow" />
              <div className="wax-seal-pulse-ring" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

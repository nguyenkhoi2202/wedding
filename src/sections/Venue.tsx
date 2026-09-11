import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useConfigStore } from '../store'

export default function Venue() {
  const { config } = useConfigStore()
  const [searchParams] = useSearchParams()
  const [copied, setCopied] = useState(false)

  // Personalized guest name & salutation from URL if provided (e.g. ?to=Anh+Tuấn, ?sal=Thân+mời)
  const guestQueryName = searchParams.get('to') || searchParams.get('guest') || searchParams.get('name')
  const guestSalutation = searchParams.get('sal') || searchParams.get('salutation') || 'Trân trọng kính mời'
  const recipientName = guestQueryName?.trim() || config.guestName || 'Quý Khách'

  // Determine initial party side from URL params (?side=bride hoặc ?side=groom)
  const initialSide = (() => {
    const s = searchParams.get('side') || searchParams.get('party')
    if (s) {
      const lower = s.toLowerCase()
      if (lower === 'groom' || lower === 'nha-trai' || lower === 'tanhon') return 'groom'
      if (lower === 'bride' || lower === 'nha-gai' || lower === 'vuquy') return 'bride'
    }
    return 'bride'
  })()

  const [activeSide, setActiveSide] = useState<'bride' | 'groom'>(initialSide)

  const currentParty =
    activeSide === 'groom'
      ? config.groomParty || {
          title: 'LỄ TÂN HÔN',
          badge: 'Tiệc Nhà Trai',
          date: '03/05/2027',
          time: '11:30',
          weekday: 'Thứ Hai',
          lunarDate: 'Nhằm ngày 28 tháng 03 năm Đinh Mùi',
          venueName: 'Tư gia Nhà Trai',
          venueAddress: '844 Ấp Bình Thắng, Xã Phú Giáo, TP. HCM',
          venueMapUrl: '',
          venueNotes: 'Gia đình rất hân hạnh được đón tiếp Quý Khách',
        }
      : config.brideParty || {
          title: 'LỄ VU QUY',
          badge: 'Tiệc Nhà Gái',
          date: config.eventDate || '02/05/2027',
          time: config.eventTime || '11:00',
          weekday: config.eventWeekday || 'Chủ Nhật',
          lunarDate: config.eventLunarDate || 'Nhằm ngày 27 tháng 03 năm Đinh Mùi',
          venueName: config.venueName || 'Nhà hàng tiệc cưới Lộc Vừng',
          venueAddress:
            config.venueAddress ||
            'Hẻm 703, K1 - 129 - Đường Bùi Hữu Nghĩa, phường Biên Hòa, tỉnh Đồng Nai',
          venueMapUrl: config.venueMapUrl || '',
          venueNotes: config.venueNotes || 'Vui lòng đến trước giờ cử hành 15 phút',
        }

  const fullAddress = `${currentParty.venueName} - ${currentParty.venueAddress}`

  // Google Maps Direct Navigation (opens directions directly)
  const googleDirectionsUrl =
    currentParty.venueMapUrl ||
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`

  // Apple Maps (iPhone native directions)
  const appleMapsUrl = `maps://?daddr=${encodeURIComponent(fullAddress)}`

  // Grab Rides Direct Link
  const grabUrl = `https://grab.onelink.me/2695613898?pid=wedding&af_dp=grab%3A%2F%2Fopen%3FscreenType%3DTRANSPORT`

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(currentParty.venueAddress).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2600)
    })
  }

  // Google Maps Embed URL
  const embedMapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`

  return (
    <section id="venue" className="section venue-section">
      <div className="section-head reveal">
        <p className="section-script-subtitle">Wedding Location</p>
        <h2>Địa Điểm Tổ Chức</h2>
        <div className="section-rule" />
        <p className="section-description">
          Thân mời Quý Khách đến tham dự và nâng ly chúc phúc cùng gia đình chúng tôi tại{' '}
          {config.groomHometown} và {config.brideHometown}.
        </p>
      </div>

      {/* Dual Venue Switcher: Nhà Gái (Lễ Vu Quy) vs Nhà Trai (Lễ Tân Hôn) */}
      <div className="venue-party-toggle-wrap reveal">
        <div className="venue-party-pills">
          <button
            type="button"
            className={`venue-party-pill ${activeSide === 'bride' ? 'active' : ''}`}
            onClick={() => setActiveSide('bride')}
            aria-label="Xem địa điểm Tiệc Nhà Gái (Lễ Vu Quy)"
          >
            <span className="party-pill-icon">🌸</span>
            <div className="party-pill-text">
              <span className="party-pill-title">{config.brideParty?.title || 'LỄ VU QUY'}</span>
              <small className="party-pill-subtitle">{config.brideParty?.badge || 'Tiệc Nhà Gái'}</small>
            </div>
          </button>

          <button
            type="button"
            className={`venue-party-pill ${activeSide === 'groom' ? 'active' : ''}`}
            onClick={() => setActiveSide('groom')}
            aria-label="Xem địa điểm Tiệc Nhà Trai (Lễ Tân Hôn)"
          >
            <span className="party-pill-icon">🤵</span>
            <div className="party-pill-text">
              <span className="party-pill-title">{config.groomParty?.title || 'LỄ TÂN HÔN'}</span>
              <small className="party-pill-subtitle">{config.groomParty?.badge || 'Tiệc Nhà Trai'}</small>
            </div>
          </button>
        </div>
      </div>

      {/* Main Venue Card with 1-Touch Navigation */}
      <article className="venue-card card reveal">
        <div className="venue-icon-wrapper">
          <span className="venue-icon bounce">📍</span>
        </div>

        <div className="venue-title-header">
          <span className="venue-badge">{currentParty.badge}</span>
          <h4 className="venue-ceremony-type">{currentParty.title}</h4>
        </div>

        <h3 className="venue-name">{currentParty.venueName}</h3>

        <p className="venue-address">
          <span>🏠</span> {currentParty.venueAddress}
        </p>

        {/* Copy Address Pill */}
        <div className="venue-copy-wrap">
          <button
            type="button"
            className={`venue-copy-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopyAddress}
            title="Sao chép địa chỉ vào bộ nhớ tạm"
          >
            <span>{copied ? '✓ Đã sao chép địa chỉ!' : '📋 Sao chép địa chỉ'}</span>
          </button>
        </div>

        <div className="venue-time-pill">
          <span className="time-clock">⏰</span>
          <div className="time-details">
            <strong>{currentParty.time} • {currentParty.weekday}</strong>
            <span>Ngày {currentParty.date}</span>
          </div>
          {currentParty.lunarDate && (
            <small className="venue-lunar">({currentParty.lunarDate})</small>
          )}
        </div>

        {/* Embedded Interactive Map Preview */}
        <div className="venue-map-embed-wrapper">
          <iframe
            title={`Bản đồ địa điểm ${currentParty.venueName}`}
            src={embedMapUrl}
            className="venue-map-iframe"
            loading="lazy"
            allowFullScreen
          />
          <div className="venue-map-pin-overlay">
            <span className="pin-pulse">📍</span>
            <span className="pin-label">{currentParty.venueName}</span>
          </div>
        </div>

        {/* 1-TOUCH DIRECT NAVIGATION ACTION BUTTONS */}
        <div className="venue-actions-1touch">
          <p className="actions-guide-label">CHỈ ĐƯỜNG 1 CHẠM</p>

          <div className="nav-buttons-grid">
            {/* Google Maps Directions */}
            <a
              className="btn-nav-touch google-nav"
              href={googleDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="nav-btn-icon">🗺️</span>
              <div className="nav-btn-text">
                <strong>Google Maps</strong>
                <small>Chỉ đường trực tiếp</small>
              </div>
            </a>

            {/* Apple Maps for iOS */}
            <a
              className="btn-nav-touch apple-nav"
              href={appleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="nav-btn-icon">🍏</span>
              <div className="nav-btn-text">
                <strong>Apple Maps</strong>
                <small>Dành cho iPhone</small>
              </div>
            </a>

            {/* Grab Ride */}
            <a
              className="btn-nav-touch grab-nav"
              href={grabUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="nav-btn-icon">🚕</span>
              <div className="nav-btn-text">
                <strong>Đặt Xe Grab</strong>
                <small>Đi thẳng tới tiệc</small>
              </div>
            </a>
          </div>
        </div>

        {currentParty.venueNotes && (
          <div className="venue-notes card">
            <div className="venue-notes-title">
              <span>✨</span> Lưu ý khi tham dự
            </div>
            <ul>
              {currentParty.venueNotes.split('\n').map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
        )}
      </article>

      {/* Elegant Invitation Envelope Note */}
      <div className="invite-note-wrapper reveal">
        <div className="invite-note card animated-envelope">
          <div className="envelope-flap" />
          <div className="envelope-seal">💌</div>

          <h4 className="invite-note-title">Thư Mời Chung Vui</h4>

          <div className="invite-note-inner">
            <div className="invite-recipient-box">
              <span className="recipient-salutation">{guestSalutation}:</span>
              <h3 className="recipient-highlight">{recipientName}</h3>
            </div>
            <div className="invite-divider">❀ ─── ❦ ─── ❀</div>
            <p className="invite-message">{config.invitationMessage}</p>
          </div>
        </div>
      </div>

      {/* Timeline of Wedding Events */}
      <div className="timeline-block">
        <div className="section-head reveal">
          <p className="section-script-subtitle">Wedding Schedule</p>
          <h2>Lịch Trình Hôn Lễ</h2>
          <div className="section-rule" />
        </div>

        <ol className="timeline">
          {config.timeline.map((item, i) => (
            <li
              key={item.id}
              className={`timeline-row reveal fade-slide-up ${i % 2 ? 'left' : 'right'}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="timeline-dot" />
              <div className="timeline-card card">
                <div className="timeline-chip-wrap">
                  <span className="timeline-chip">
                    ⏰ {item.time} {item.date ? `• ${item.date}` : ''}
                  </span>
                </div>
                <h4 className="timeline-title">{item.title}</h4>
                {item.note && <p className="timeline-note">{item.note}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

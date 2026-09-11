import { useSearchParams } from 'react-router-dom'
import { useConfigStore } from '../store'

export default function Venue() {
  const { config } = useConfigStore()
  const [searchParams] = useSearchParams()

  // Personalized guest name from URL if provided (e.g. ?to=Anh+Tuấn hoặc ?guest=...)
  const guestQueryName = searchParams.get('to') || searchParams.get('guest')
  const recipientName = guestQueryName?.trim() || config.guestName || 'Quý Khách'

  const mapUrl =
    config.venueMapUrl ||
    `https://maps.google.com/?q=${encodeURIComponent(`${config.venueName} ${config.venueAddress}`)}`

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

      {/* Main Venue Card */}
      <article className="venue-card card reveal">
        <div className="venue-icon-wrapper">
          <span className="venue-icon bounce">📍</span>
        </div>

        <span className="venue-badge">{config.eventBadge}</span>
        <h3 className="venue-name">{config.venueName}</h3>
        
        <p className="venue-address">
          <span>🏠</span> {config.venueAddress}
        </p>

        <div className="venue-time-pill">
          <span className="time-clock">⏰</span>
          <div className="time-details">
            <strong>{config.eventTime} • {config.eventWeekday}</strong>
            <span>Ngày {config.eventDate}</span>
          </div>
          {config.eventLunarDate && (
            <small className="venue-lunar">({config.eventLunarDate})</small>
          )}
        </div>

        {config.venueNotes && (
          <div className="venue-notes card">
            <div className="venue-notes-title">
              <span>✨</span> Lưu ý khi tham dự
            </div>
            <ul>
              {config.venueNotes.split('\n').map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="venue-actions">
          <a
            className="btn btn-primary btn-map"
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>🗺️ Mở Bản Đồ Chỉ Đường</span>
          </a>
        </div>
      </article>

      {/* Elegant Invitation Envelope Note */}
      <div className="invite-note-wrapper reveal">
        <div className="invite-note card animated-envelope">
          <div className="envelope-flap" />
          <div className="envelope-seal">💌</div>

          <h4 className="invite-note-title">Thư Mời Chung Vui</h4>

          <div className="invite-note-inner">
            <p className="invite-recipient">
              Trân trọng kính mời:{' '}
              <strong className="recipient-highlight">{recipientName}</strong>
            </p>
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

import { useConfigStore } from '../store'

export default function Venue() {
  const { config } = useConfigStore()
  const mapUrl =
    config.venueMapUrl ||
    `https://maps.google.com/?q=${encodeURIComponent(config.venueAddress)}`

  return (
    <section id="venue" className="section">
      <div className="section-head reveal">
        <h2>Địa Điểm Tổ Chức</h2>
        <div className="section-rule" />
        <p>
          Thân mời Quý Khách đến tham dự ngày vui của gia đình chúng tôi tại{' '}
          {config.groomHometown} và {config.brideHometown}.
        </p>
      </div>

      <article className="venue-card reveal">
        <span className="venue-icon">🥂</span>
        <h3>{config.eventBadge}</h3>
        <div className="section-rule" />

        <p className="venue-name">{config.venueName}</p>
        <p className="venue-address">{config.venueAddress}</p>

        <div className="venue-time">
          <p>
            🗓️ {config.eventTime}, {config.eventWeekday}, {config.eventDate}
          </p>
          {config.eventLunarDate && <small>{config.eventLunarDate}</small>}
        </div>

        {config.venueNotes && (
          <div className="venue-notes">
            <strong>Thông tin thêm</strong>
            <ul>
              {config.venueNotes.split('\n').map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
        )}

        <a className="btn btn-map" href={mapUrl} target="_blank" rel="noreferrer">
          📍 Xem Bản Đồ
        </a>
      </article>

      <div className="invite-note reveal">
        <h4>💌 Lời Mời</h4>
        <p>{config.invitationIntro}</p>
        <div className="invite-note-inner">
          <p>Trân trọng kính mời: {config.guestName}</p>
          <p>{config.invitationMessage}</p>
        </div>
      </div>

      <div className="timeline-block reveal">
        <div className="section-head">
          <h2>Lịch Trình Hôn Lễ</h2>
          <div className="section-rule" />
        </div>

        <ol className="timeline">
          {config.timeline.map((item, i) => (
            <li key={item.id} className={`timeline-row ${i % 2 ? 'left' : 'right'}`}>
              <div className="timeline-card card">
                <span className="timeline-chip">
                  {item.date} - {item.time}
                </span>
                <h4>{item.title}</h4>
                {item.note && <p>{item.note}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

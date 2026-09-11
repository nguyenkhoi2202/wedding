import { useState } from 'react'
import { useConfigStore } from '../store'
import Countdown from '../components/Countdown'
import { getGoogleCalendarUrl, downloadIcsFile } from '../utils/calendar'

const MONTHS = [
  'THÁNG 1', 'THÁNG 2', 'THÁNG 3', 'THÁNG 4', 'THÁNG 5', 'THÁNG 6',
  'THÁNG 7', 'THÁNG 8', 'THÁNG 9', 'THÁNG 10', 'THÁNG 11', 'THÁNG 12',
]

export default function Invitation() {
  const { config } = useConfigStore()
  const [day, month, year] = config.eventDate.split('/')
  const [showCalMenu, setShowCalMenu] = useState(false)

  const handleGoogleCal = () => {
    setShowCalMenu(false)
    const url = getGoogleCalendarUrl({
      title: `Lễ Cưới: ${config.groomName} & ${config.brideName}`,
      details: `${config.invitationIntro}\n${config.invitationMessage}`,
      location: `${config.venueName}, ${config.venueAddress}`,
      dateStr: config.eventDate,
      timeStr: config.eventTime,
    })
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleIcsCal = () => {
    setShowCalMenu(false)
    downloadIcsFile({
      title: `Lễ Cưới: ${config.groomName} & ${config.brideName}`,
      details: `${config.invitationIntro}\n${config.invitationMessage}`,
      location: `${config.venueName}, ${config.venueAddress}`,
      dateStr: config.eventDate,
      timeStr: config.eventTime,
    })
  }

  return (
    <section id="invitation" className="section invitation-section">
      <div className="section-head reveal">
        <p className="section-script-subtitle">Save Our Date</p>
        <h2>Thông Tin Thiệp Cưới</h2>
        <div className="section-rule" />
        <p className="section-description">{config.invitationIntro}</p>
      </div>

      {/* Main Date Card */}
      <div className="date-card card reveal">
        <div className="date-card-header">
          <span className="date-badge">💗 {config.eventBadge.toUpperCase()}</span>
        </div>

        {/* 3-column unified calendar bar that stays on 1 row cleanly */}
        <div className="date-tiles-row">
          <div className="date-tile tile-day">
            <span className="tile-value">{day}</span>
            <span className="tile-label">NGÀY</span>
          </div>

          <div className="date-tile tile-month">
            <span className="tile-value">{MONTHS[Number(month) - 1] ?? `THÁNG ${month}`}</span>
            <span className="tile-year">NĂM {year}</span>
            <span className="tile-label">THÁNG &amp; NĂM</span>
          </div>

          <div className="date-tile tile-time">
            <span className="tile-value">{config.eventTime}</span>
            <span className="tile-label">GIỜ LỄ</span>
          </div>
        </div>

        {/* Weekday & Lunar Date Details */}
        <div className="date-weekday">
          <h3>🗓️ {config.eventWeekday}</h3>
          <div className="weekday-divider" />
          <p className="solar-date">
            Ngày {Number(day)} tháng {Number(month)} năm {year}
          </p>
          {config.eventLunarDate && (
            <p className="lunar-badge">
              <span className="lunar-icon">🌙</span> {config.eventLunarDate}
            </p>
          )}

          {/* Quick Add to Calendar Action */}
          <div className="date-actions">
            <div className="cal-dropdown-wrap">
              <button
                type="button"
                className="btn-add-calendar"
                onClick={() => setShowCalMenu(!showCalMenu)}
              >
                <span>📅 Nhắc Tôi Vào Lịch Điện Thoại</span>
              </button>

              {showCalMenu && (
                <div className="cal-dropdown-menu fade-in">
                  <button type="button" onClick={handleGoogleCal}>
                    <span>📅 Thêm vào Google Calendar</span>
                  </button>
                  <button type="button" onClick={handleIcsCal}>
                    <span>🍏 Thêm vào Apple / Outlook (.ics)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Family Houses */}
      <div className="house-grid reveal">
        <article className="card house-card">
          <div className="house-badge groom-badge">NHÀ TRAI</div>
          <h4>Gia Đình Nhà Trai</h4>
          <div className="house-parents">
            <p>
              Ông: <strong>{config.groomFather}</strong>
            </p>
            <p>
              Bà: <strong>{config.groomMother}</strong>
            </p>
          </div>
          <div className="house-address">
            <span className="house-pin">📍</span>
            <p>{config.groomHouseAddress}</p>
          </div>
        </article>

        <article className="card house-card">
          <div className="house-badge bride-badge">NHÀ GÁI</div>
          <h4>Gia Đình Nhà Gái</h4>
          <div className="house-parents">
            <p>
              Ông: <strong>{config.brideFather}</strong>
            </p>
            <p>
              Bà: <strong>{config.brideMother}</strong>
            </p>
          </div>
          <div className="house-address">
            <span className="house-pin">📍</span>
            <p>{config.brideHouseAddress}</p>
          </div>
        </article>
      </div>

      {/* Countdown Timer */}
      <Countdown />
    </section>
  )
}

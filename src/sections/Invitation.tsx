import { useConfigStore } from '../store'
import Countdown from '../components/Countdown'

const MONTHS = [
  'THÁNG 1', 'THÁNG 2', 'THÁNG 3', 'THÁNG 4', 'THÁNG 5', 'THÁNG 6',
  'THÁNG 7', 'THÁNG 8', 'THÁNG 9', 'THÁNG 10', 'THÁNG 11', 'THÁNG 12',
]

export default function Invitation() {
  const { config } = useConfigStore()
  const [day, month, year] = config.eventDate.split('/')

  return (
    <section id="invitation" className="section">
      <div className="section-head reveal">
        <h2>Thông Tin Thiệp Cưới</h2>
        <div className="section-rule" />
        <p>{config.invitationIntro}</p>
      </div>

      <div className="date-card reveal">
        <span className="date-badge">💗 {config.eventBadge.toUpperCase()}</span>

        <div className="date-tiles">
          <div className="date-tile tile-day">
            <strong>{day}</strong>
            <small>NGÀY</small>
          </div>
          <div className="date-tile tile-month">
            <strong>{MONTHS[Number(month) - 1] ?? month}</strong>
            <span className="tile-year">{year}</span>
            <small>THÁNG &amp; NĂM</small>
          </div>
          <div className="date-tile tile-time">
            <strong>{config.eventTime}</strong>
            <small>GIỜ</small>
          </div>
        </div>

        <div className="date-weekday">
          <h3>🗓️ {config.eventWeekday}</h3>
          <div className="section-rule" />
          <p>
            ngày {Number(day)} tháng {Number(month)}, {year}
          </p>
          {config.eventLunarDate && <p className="lunar">{config.eventLunarDate}</p>}
        </div>
      </div>

      <div className="house-grid reveal">
        <article className="card house-card">
          <h4>Nhà Trai</h4>
          <p>
            Ông: <strong>{config.groomFather}</strong>
          </p>
          <p>
            Bà: <strong>{config.groomMother}</strong>
          </p>
          <p className="house-address">{config.groomHouseAddress}</p>
        </article>

        <article className="card house-card">
          <h4>Nhà Gái</h4>
          <p>
            Ông: <strong>{config.brideFather}</strong>
          </p>
          <p>
            Bà: <strong>{config.brideMother}</strong>
          </p>
          <p className="house-address">{config.brideHouseAddress}</p>
        </article>
      </div>

      <Countdown />
    </section>
  )
}

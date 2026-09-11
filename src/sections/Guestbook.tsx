import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useConfigStore, type GuestWish } from '../store'

const QUICK_WISHES = [
  'Trăm năm hạnh phúc! 💍',
  'Vĩnh kết đồng tâm! 💐',
  'Xứng đôi vừa lứa! 💖',
  'Sớm đón quý tử! 👶',
  'Tình yêu ngọt ngào! ✨',
]

const RELATIONS = ['Bạn Chú Rể', 'Bạn Cô Dâu', 'Bạn Thân', 'Gia Đình', 'Đồng Nghiệp', 'Khách Quý']

export default function Guestbook() {
  const { config, updateConfig } = useConfigStore()
  const [searchParams] = useSearchParams()
  const urlGuestName = searchParams.get('to') || searchParams.get('guest') || ''

  const [name, setName] = useState(urlGuestName)
  const [relation, setRelation] = useState('Bạn Thân')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  // Wishes directly from store (starts empty, no dummy default wishes)
  const wishes: GuestWish[] = config.wishes || []

  // Keep guest name in sync if URL param changes
  useEffect(() => {
    if (urlGuestName && !name) {
      setName(urlGuestName)
    }
  }, [urlGuestName, name])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !message.trim()) return

    const now = new Date()
    const timeFormatted = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} • ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}`

    const newWish: GuestWish = {
      id: `w-${Date.now()}`,
      name: name.trim(),
      relation,
      message: message.trim(),
      time: timeFormatted,
      likes: 1,
      isLiked: true,
    }

    const updated = [newWish, ...wishes]
    updateConfig({ wishes: updated })

    // Celebration cannon burst
    window.dispatchEvent(new CustomEvent('wedding:celebrate'))

    setSubmitted(true)
    setMessage('')
    setTimeout(() => setSubmitted(false), 4000)
  }

  const handleLike = (id: string) => {
    const updated = wishes.map((w) => {
      if (w.id === id) {
        const isLiked = !w.isLiked
        return {
          ...w,
          likes: isLiked ? w.likes + 1 : Math.max(0, w.likes - 1),
          isLiked,
        }
      }
      return w
    })
    updateConfig({ wishes: updated })
  }

  return (
    <section id="guestbook" className="section guestbook-section">
      <div className="section-head reveal">
        <p className="section-script-subtitle">Our Wedding Guestbook</p>
        <h2>Sổ Lưu Bút Kỷ Niệm</h2>
        <div className="section-rule" />
        <p className="section-description">
          Hãy để lại những lời chúc yêu thương và ấm áp nhất để chung vui cùng{' '}
          {config.groomName} &amp; {config.brideName}.
        </p>
      </div>

      {/* Guestbook Form Card */}
      <div className="guestbook-form-card card reveal">
        <div className="guestbook-stamp-corner">💌</div>
        <h3 className="guestbook-form-title">Gửi Lời Chúc Đến Cặp Đôi</h3>

        {submitted && (
          <div className="guestbook-toast success">
            <span>🎉 Cảm ơn bạn! Lời chúc của bạn đã được ghim lên sổ lưu bút!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="guestbook-form">
          <div className="form-row-grid">
            <div className="form-field">
              <label htmlFor="gb-name">Tên của bạn *</label>
              <input
                id="gb-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Bạn Hải, Anh Tuấn..."
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="gb-relation">Mối quan hệ</label>
              <select
                id="gb-relation"
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
              >
                {RELATIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="gb-message">Lời chúc phúc chân thành *</label>
            <textarea
              id="gb-message"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nhập lời chúc phúc tốt đẹp nhất của bạn dành cho cô dâu & chú rể..."
              required
            />
          </div>

          {/* Quick wish pill suggestions */}
          <div className="quick-wishes-wrap">
            <span className="quick-label">Gợi ý nhanh:</span>
            <div className="quick-pills">
              {QUICK_WISHES.map((qw) => (
                <button
                  key={qw}
                  type="button"
                  className="quick-pill-btn"
                  onClick={() => setMessage((prev) => (prev ? `${prev} ${qw}` : qw))}
                >
                  {qw}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-submit-wish">
            <span>✍️ Ký Tên &amp; Ghim Lời Chúc</span>
          </button>
        </form>
      </div>

      {/* Live Wishes Board */}
      <div className="wishes-board reveal">
        <div className="board-header">
          <h4>
            <span>📖</span> Lời Chúc Từ Khách Quý ({wishes.length})
          </h4>
        </div>

        {wishes.length === 0 ? (
          <div className="wishes-empty card reveal">
            <span className="wishes-empty-icon">💌</span>
            <p>Chưa có lời chúc nào được lưu lại.</p>
            <p className="wishes-empty-sub">
              Hãy là người đầu tiên ký tên và gửi gắm những lời chúc phúc ngọt ngào nhất đến cặp đôi nhé!
            </p>
          </div>
        ) : (
          <div className="wishes-grid">
            {wishes.map((w) => (
              <article key={w.id} className="wish-card card">
                <div className="wish-card-pin">📌</div>

                <div className="wish-header">
                  <div className="wish-avatar">
                    {w.name.trim().charAt(0).toUpperCase()}
                  </div>
                  <div className="wish-author-info">
                    <h5 className="wish-author">{w.name}</h5>
                    <div className="wish-meta">
                      <span className="wish-relation-tag">{w.relation}</span>
                      <span className="wish-time">• {w.time}</span>
                    </div>
                  </div>
                </div>

                <p className="wish-content">{w.message}</p>

                <div className="wish-footer">
                  <button
                    type="button"
                    className={`wish-like-btn ${w.isLiked ? 'liked' : ''}`}
                    onClick={() => handleLike(w.id)}
                    title="Thả tim cho lời chúc này"
                  >
                    <span className="like-heart">{w.isLiked ? '❤️' : '🤍'}</span>
                    <span className="like-count">{w.likes}</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

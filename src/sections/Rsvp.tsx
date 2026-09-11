import { useState } from 'react'
import { useConfigStore } from '../store'
import Confetti from '../components/Confetti'

type Status = 'idle' | 'sending' | 'ok' | 'error'

export default function Rsvp() {
  const { config } = useConfigStore()
  const [form, setForm] = useState({ name: '', attendance: '', guests: '1', wish: '' })
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [copied, setCopied] = useState('')
  const [triedSubmit, setTriedSubmit] = useState(false)

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(label)
      setTimeout(() => setCopied(''), 2000)
    } catch {
      // Fallback for older webviews
      const textArea = document.createElement('textarea')
      textArea.value = value
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(label)
      setTimeout(() => setCopied(''), 2000)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTriedSubmit(true)
    if (!form.name.trim() || !form.attendance) return

    const { emailjsServiceId, emailjsTemplateId, emailjsPublicKey } = config
    if (!emailjsServiceId || !emailjsTemplateId || !emailjsPublicKey) {
      setStatus('error')
      setErrorMsg(
        'Chưa cấu hình EmailJS nhận xác nhận. Vào trang /config → tab Email để cài đặt.'
      )
      return
    }

    setStatus('sending')
    setErrorMsg('')

    const attendanceText =
      form.attendance === 'yes'
        ? 'Có tham dự'
        : form.attendance === 'no'
          ? 'Không thể tham dự'
          : 'Chưa chắc chắn'

    try {
      const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: emailjsServiceId,
          template_id: emailjsTemplateId,
          user_id: emailjsPublicKey,
          template_params: {
            to_email: config.emailReceiver,
            guest_name: form.name.trim(),
            attendance: attendanceText,
            guest_count: form.attendance === 'yes' ? form.guests : '0',
            wish: form.wish.trim(),
            couple: `${config.groomName} & ${config.brideName}`,
          },
        }),
      })

      if (!res.ok) throw new Error(await res.text())

      setStatus('ok')
      setForm({ name: '', attendance: '', guests: '1', wish: '' })
      setTriedSubmit(false)
    } catch (err) {
      setStatus('error')
      setErrorMsg(
        err instanceof Error && err.message
          ? `Gửi thất bại: ${err.message.slice(0, 160)}`
          : 'Gửi thất bại. Vui lòng kiểm tra kết nối mạng và thử lại.'
      )
    }
  }

  // Generate VietQR URL if bank information is provided but no custom QR uploaded
  const qrImage =
    config.qrCode ||
    (config.bankName && config.bankAccount
      ? `https://img.vietqr.io/image/${encodeURIComponent(config.bankName.trim())}-${encodeURIComponent(config.bankAccount.trim())}-compact2.png?amount=0&addInfo=${encodeURIComponent(`Mung cuoi ${config.groomName} ${config.brideName}`)}`
      : '')

  return (
    <section id="rsvp" className="section rsvp-section">
      <div className="section-head reveal">
        <p className="section-script-subtitle">Be Our Guest</p>
        <h2>Xác Nhận Tham Dự</h2>
        <div className="section-rule" />
        <p className="section-description">
          Để gia đình có thể đón tiếp Quý Khách một cách chu đáo và trọn vẹn nhất, xin vui lòng gửi xác nhận trước ngày cưới.
        </p>
      </div>

      <div className="rsvp-layout">
        {/* Form Column */}
        <form className="card rsvp-card reveal" onSubmit={submit} noValidate>
          {status === 'ok' && <div className="confetti-overlay" />}
          <Confetti active={status === 'ok'} />

          <div className="rsvp-card-head">
            <span className="rsvp-card-badge">💌 RSVP</span>
            <h3>Thông Tin Khách Mời</h3>
            <p className="rsvp-card-subtitle">Vui lòng điền thông tin bên dưới</p>
          </div>

          {/* Name Field */}
          <div className="form-group">
            <label htmlFor="rsvp-name" className="form-label">
              <span>Họ và tên</span>
              <span className="req-star">*</span>
            </label>
            <input
              id="rsvp-name"
              type="text"
              className={`form-input ${triedSubmit && !form.name.trim() ? 'invalid' : ''}`}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Nhập tên Quý Khách hoặc gia đình"
              autoComplete="name"
              required
            />
            {triedSubmit && !form.name.trim() && (
              <span className="field-error-msg">Vui lòng nhập họ và tên của bạn.</span>
            )}
          </div>

          {/* Attendance Field */}
          <div className="form-group">
            <label htmlFor="rsvp-attendance" className="form-label">
              <span>Quý Khách có tham dự không?</span>
              <span className="req-star">*</span>
            </label>
            <div className="select-wrap">
              <select
                id="rsvp-attendance"
                className={`form-select ${triedSubmit && !form.attendance ? 'invalid' : ''}`}
                value={form.attendance}
                onChange={(e) => set('attendance', e.target.value)}
                required
              >
                <option value="">-- Vui lòng chọn --</option>
                <option value="yes">✨ Có, tôi sẽ tham dự</option>
                <option value="no">💔 Rất tiếc, tôi không thể tham dự</option>
                <option value="maybe">⏳ Tôi chưa chắc chắn, sẽ báo sau</option>
              </select>
              <span className="select-arrow">▼</span>
            </div>
            {triedSubmit && !form.attendance && (
              <span className="field-error-msg">Vui lòng chọn trạng thái tham dự.</span>
            )}
          </div>

          {/* Guest count (if attending) */}
          {form.attendance === 'yes' && (
            <div className="form-group fade-in">
              <label htmlFor="rsvp-guests" className="form-label">
                <span>Số lượng người tham dự</span>
              </label>
              <div className="select-wrap">
                <select
                  id="rsvp-guests"
                  className="form-select"
                  value={form.guests}
                  onChange={(e) => set('guests', e.target.value)}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={String(n)}>
                      {n} người {n === 1 ? '(Đi 1 mình)' : `(Đi cùng ${n - 1} người thân)`}
                    </option>
                  ))}
                </select>
                <span className="select-arrow">▼</span>
              </div>
            </div>
          )}

          {/* Wishes field */}
          <div className="form-group">
            <label htmlFor="rsvp-wish" className="form-label">
              <span>Lời chúc dành cho đôi uyên ương</span>
            </label>
            <textarea
              id="rsvp-wish"
              className="form-textarea"
              value={form.wish}
              onChange={(e) => set('wish', e.target.value)}
              placeholder="Gửi gắm những lời chúc tốt đẹp nhất đến cô dâu & chú rể..."
              rows={4}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary btn-block rsvp-submit-btn"
            disabled={status === 'sending'}
          >
            {status === 'sending' ? (
              <span className="btn-loading">
                <span className="btn-spinner" /> Đang gửi xác nhận...
              </span>
            ) : (
              <span>✉️ Gửi Xác Nhận Tham Dự</span>
            )}
          </button>

          {/* Success / Error Messages */}
          {status === 'ok' && (
            <div className="form-msg ok success-animate">
              <span className="check-icon">✓</span>
              <div>
                <strong>Cảm ơn Quý Khách!</strong>
                <p>Xác nhận và lời chúc đã được gửi thành công đến cô dâu &amp; chú rể.</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="form-msg err">
              <span className="err-icon">⚠️</span>
              <div>
                <strong>Chưa gửi được</strong>
                <p>{errorMsg}</p>
              </div>
            </div>
          )}
        </form>

        {/* Gift Box Column */}
        <aside className="card gift-card reveal">
          <div className="gift-card-head">
            <span className="gift-badge">🎁 HỘP MỪNG CƯỚI</span>
            <h3>Gửi Quà Chúc Phúc</h3>
          </div>

          <p className="gift-lead">
            Sự hiện diện của Quý Khách là món quà ý nghĩa nhất. Nếu muốn gửi lời chúc phúc từ xa qua chuyển khoản, xin vui lòng dùng thông tin dưới đây.
          </p>

          {/* QR Code Container */}
          <div className="gift-qr-container">
            {qrImage ? (
              <div className="qr-image-card">
                <img className="gift-qr" src={qrImage} alt="Mã QR mừng cưới" loading="lazy" />
                <span className="qr-scan-hint">Quét mã bằng ứng dụng ngân hàng hoặc MoMo</span>
              </div>
            ) : (
              <div className="gift-qr-placeholder">
                <span>Chưa có mã QR</span>
              </div>
            )}
          </div>

          {/* Bank details with 1-tap copy button */}
          <dl className="gift-info">
            <div className="gift-info-row">
              <dt>Ngân hàng</dt>
              <dd>
                <strong>{config.bankName}</strong>
              </dd>
            </div>

            <div className="gift-info-row">
              <dt>Chủ tài khoản</dt>
              <dd>
                <strong className="bank-owner">{config.bankOwner}</strong>
              </dd>
            </div>

            <div className="gift-info-row">
              <dt>Số tài khoản</dt>
              <dd className="account-number-row">
                <span className="mono account-num">{config.bankAccount}</span>
                <button
                  type="button"
                  className={`copy-chip ${copied === 'stk' ? 'copied' : ''}`}
                  onClick={() => copy('stk', config.bankAccount)}
                  title="Sao chép số tài khoản"
                >
                  {copied === 'stk' ? '✓ Đã chép' : '📋 Sao chép'}
                </button>
              </dd>
            </div>

            {config.phoneContact && (
              <div className="gift-info-row">
                <dt>Số điện thoại</dt>
                <dd className="phone-row">
                  <span className="mono">{config.phoneContact}</span>
                  <a
                    href={`tel:${config.phoneContact}`}
                    className="call-chip"
                    title="Gọi điện trực tiếp"
                  >
                    📞 Gọi ngay
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </aside>
      </div>

      {/* Luxury Site Footer */}
      <footer className="site-footer reveal">
        <div className="footer-floral">❀ ─── ❦ ─── ❀</div>
        <p className="footer-couple">
          {config.groomName} <span className="footer-heart">♡</span> {config.brideName}
        </p>
        <p className="footer-thank">
          Trân trọng cảm ơn Quý Khách đã luôn đồng hành và chia vui cùng chúng tôi!
        </p>
        <span className="footer-tagline">Happy Wedding • 2027</span>
      </footer>
    </section>
  )
}

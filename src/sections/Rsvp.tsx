import { useState } from 'react'
import { useConfigStore } from '../store'

type Status = 'idle' | 'sending' | 'ok' | 'error'

export default function Rsvp() {
  const { config } = useConfigStore()
  const [form, setForm] = useState({ name: '', attendance: '', guests: '1', wish: '' })
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [copied, setCopied] = useState('')

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const copy = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value)
    setCopied(label)
    setTimeout(() => setCopied(''), 1800)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.attendance) return

    const { emailjsServiceId, emailjsTemplateId, emailjsPublicKey } = config
    if (!emailjsServiceId || !emailjsTemplateId || !emailjsPublicKey) {
      setStatus('error')
      setErrorMsg(
        'Chưa cấu hình EmailJS. Vào /config → tab Email để nhập Service ID, Template ID và Public Key.'
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
    } catch (err) {
      setStatus('error')
      setErrorMsg(
        err instanceof Error && err.message
          ? `Gửi thất bại: ${err.message.slice(0, 160)}`
          : 'Gửi thất bại. Vui lòng thử lại.'
      )
    }
  }

  return (
    <section id="rsvp" className="section">
      <div className="section-head reveal">
        <h2>Xác Nhận Tham Dự</h2>
        <div className="section-rule" />
        <p>Quý Khách vui lòng để lại thông tin để gia đình chúng tôi chuẩn bị chu đáo hơn.</p>
      </div>

      <div className="rsvp-layout">
        <form className="card rsvp-card reveal" onSubmit={submit}>
          <h3>Thông Tin Khách Mời</h3>

          <label className="field">
            <span>Họ và tên *</span>
            <input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Họ và tên"
              required
            />
          </label>

          <label className="field">
            <span>Quý Khách có tham dự không? *</span>
            <select
              value={form.attendance}
              onChange={(e) => set('attendance', e.target.value)}
              required
            >
              <option value="">Vui lòng chọn</option>
              <option value="yes">Có, tôi sẽ tham dự</option>
              <option value="no">Rất tiếc, tôi không thể tham dự</option>
              <option value="maybe">Tôi chưa chắc chắn</option>
            </select>
          </label>

          {form.attendance === 'yes' && (
            <label className="field">
              <span>Số người tham dự</span>
              <select value={form.guests} onChange={(e) => set('guests', e.target.value)}>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={String(n)}>
                    {n} người
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="field">
            <span>Lời chúc dành cho cô dâu chú rể</span>
            <textarea
              value={form.wish}
              onChange={(e) => set('wish', e.target.value)}
              placeholder="Để lại lời chúc của bạn..."
              rows={5}
            />
          </label>

          <button className="btn btn-primary btn-block" disabled={status === 'sending'}>
            {status === 'sending' ? 'Đang gửi...' : 'Gửi Xác Nhận'}
          </button>

          {status === 'ok' && (
            <p className="form-msg ok">
              Cảm ơn Quý Khách! Xác nhận đã được gửi tới gia đình chúng tôi.
            </p>
          )}
          {status === 'error' && <p className="form-msg err">{errorMsg}</p>}
        </form>

        <aside className="card gift-card reveal">
          <h3>🎁 Hộp Mừng Cưới</h3>
          <p className="gift-lead">
            Sự hiện diện của Quý Khách đã là món quà quý giá nhất. Nếu muốn gửi lời chúc
            qua chuyển khoản, xin dùng thông tin dưới đây.
          </p>

          {config.qrCode ? (
            <img className="gift-qr" src={config.qrCode} alt="QR chuyển tiền" />
          ) : (
            <div className="gift-qr placeholder">Chưa tải QR</div>
          )}

          <dl className="gift-info">
            <div>
              <dt>Ngân hàng</dt>
              <dd>{config.bankName}</dd>
            </div>
            <div>
              <dt>Chủ tài khoản</dt>
              <dd>{config.bankOwner}</dd>
            </div>
            <div>
              <dt>Số tài khoản</dt>
              <dd className="mono">
                {config.bankAccount}
                <button
                  type="button"
                  className="copy-chip"
                  onClick={() => copy('stk', config.bankAccount)}
                >
                  {copied === 'stk' ? 'Đã copy' : 'Copy'}
                </button>
              </dd>
            </div>
            <div>
              <dt>Liên hệ</dt>
              <dd>
                <a href={`tel:${config.phoneContact}`}>{config.phoneContact}</a>
              </dd>
            </div>
          </dl>
        </aside>
      </div>

      <footer className="site-footer reveal">
        <p>
          {config.groomName} &amp; {config.brideName}
        </p>
        <span>Trân trọng cảm ơn Quý Khách 💗</span>
      </footer>
    </section>
  )
}

import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  useConfigStore,
  compressImage,
  defaultConfig,
  type TimelineItem,
  type WeddingConfig,
} from '../store'
import { buildShareUrl } from '../shareLink'
import '../styles/layout.css'
import '../styles/config.css'

type TabId = 'couple' | 'event' | 'venue' | 'timeline' | 'album' | 'gift' | 'email' | 'theme'

const TABS: { id: TabId; label: string }[] = [
  { id: 'couple', label: '💕 Cô dâu chú rể' },
  { id: 'event', label: '📅 Thiệp mời' },
  { id: 'venue', label: '📍 Địa điểm' },
  { id: 'timeline', label: '🕘 Lịch trình' },
  { id: 'album', label: '📸 Album' },
  { id: 'gift', label: '🎁 Mừng cưới' },
  { id: 'email', label: '✉️ Email' },
  { id: 'theme', label: '🎨 Giao diện' },
]

export default function ConfigPage() {
  const { config, updateConfig, resetConfig, replaceConfig } = useConfigStore()
  const [tab, setTab] = useState<TabId>('couple')
  const [toast, setToast] = useState('')
  const importRef = useRef<HTMLInputElement>(null)

  const set = <K extends keyof WeddingConfig>(key: K, value: WeddingConfig[K]) =>
    updateConfig({ [key]: value } as Partial<WeddingConfig>)

  const flash = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }

  const pickImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
    key: 'qrCode' | 'groomImage' | 'brideImage'
  ) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      set(key, await compressImage(file, key === 'qrCode' ? 700 : 900))
    } catch {
      flash('Không đọc được ảnh')
    }
  }

  const addAlbum = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!files.length) return
    try {
      const next = await Promise.all(files.map((f) => compressImage(f)))
      set('album', [...config.album, ...next])
      flash(`Đã thêm ${next.length} ảnh`)
    } catch {
      flash('Có ảnh không tải được')
    }
  }

  const moveAlbum = (from: number, to: number) => {
    if (to < 0 || to >= config.album.length) return
    const next = [...config.album]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    set('album', next)
  }

  const setTimelineField = (id: string, field: keyof TimelineItem, value: string) =>
    set(
      'timeline',
      config.timeline.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    )

  const addTimeline = () =>
    set('timeline', [
      ...config.timeline,
      {
        id: `t${Date.now()}`,
        date: config.eventDate,
        time: '10:00',
        title: 'Sự kiện mới',
        note: '',
      },
    ])

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'wedding-config.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const importJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      replaceConfig(JSON.parse(await file.text()))
      flash('Đã nhập cấu hình')
    } catch {
      flash('Tệp JSON không hợp lệ')
    }
  }

  const copyShare = async () => {
    await navigator.clipboard.writeText(buildShareUrl(config))
    flash('Đã copy link chia sẻ (không gồm ảnh)')
  }

  return (
    <div className="cfg-page">
      <header className="cfg-top">
        <div>
          <h1>Cấu hình thiệp cưới</h1>
          <p>Mọi thay đổi lưu tự động vào trình duyệt này.</p>
        </div>
        <div className="cfg-top-actions">
          <button className="cfg-btn ghost" onClick={exportJson}>
            ⬇️ Xuất JSON
          </button>
          <button className="cfg-btn ghost" onClick={() => importRef.current?.click()}>
            ⬆️ Nhập JSON
          </button>
          <button className="cfg-btn ghost" onClick={copyShare}>
            🔗 Copy link
          </button>
          <button
            className="cfg-btn danger"
            onClick={() => {
              if (confirm('Đặt lại toàn bộ về mặc định?')) {
                resetConfig()
                flash('Đã đặt lại')
              }
            }}
          >
            Đặt lại
          </button>
          <Link className="cfg-btn primary" to="/">
            Xem thiệp →
          </Link>
        </div>
        <input
          ref={importRef}
          type="file"
          accept="application/json"
          hidden
          onChange={importJson}
        />
      </header>

      <div className="cfg-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`cfg-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="cfg-body">
        {tab === 'couple' && (
          <>
            <section className="cfg-card">
              <h2>Chú rể</h2>
              <div className="cfg-grid-2">
                <TextField cfg={config} set={set} label="Tên gọi ngắn" field="groomName" />
                <TextField cfg={config} set={set} label="Họ tên đầy đủ" field="groomFullName" />
                <TextField cfg={config} set={set} label="Vai (Chú Rể)" field="groomRole" />
                <TextField cfg={config} set={set} label="Thứ tự trong gia đình" field="groomOrder" />
                <TextField cfg={config} set={set} label="Tên cha" field="groomFather" />
                <TextField cfg={config} set={set} label="Tên mẹ" field="groomMother" />
                <TextField cfg={config} set={set} label="Quê / nơi sống" field="groomHometown" />
              </div>
              <ImageField
                label="Ảnh chú rể"
                value={config.groomImage}
                onPick={(e) => pickImage(e, 'groomImage')}
                onClear={() => set('groomImage', '')}
              />
            </section>

            <section className="cfg-card">
              <h2>Cô dâu</h2>
              <div className="cfg-grid-2">
                <TextField cfg={config} set={set} label="Tên gọi ngắn" field="brideName" />
                <TextField cfg={config} set={set} label="Họ tên đầy đủ" field="brideFullName" />
                <TextField cfg={config} set={set} label="Vai (Cô Dâu)" field="brideRole" />
                <TextField cfg={config} set={set} label="Thứ tự trong gia đình" field="brideOrder" />
                <TextField cfg={config} set={set} label="Tên cha" field="brideFather" />
                <TextField cfg={config} set={set} label="Tên mẹ" field="brideMother" />
                <TextField cfg={config} set={set} label="Quê / nơi sống" field="brideHometown" />
              </div>
              <ImageField
                label="Ảnh cô dâu"
                value={config.brideImage}
                onPick={(e) => pickImage(e, 'brideImage')}
                onClear={() => set('brideImage', '')}
              />
            </section>

            <section className="cfg-card">
              <h2>Trang chủ</h2>
              <TextField cfg={config} set={set} label="Tiêu đề lớn" field="heroTitle" />
              <TextField cfg={config} set={set} label="Câu phụ dưới tên" field="heroSubtitle" rows={2} />
              <TextField cfg={config} set={set} label="Câu đối / lời chúc" field="coupleQuote" rows={3} />
            </section>
          </>
        )}

        {tab === 'event' && (
          <section className="cfg-card">
            <h2>Thông tin lễ cưới</h2>
            <TextField cfg={config} set={set} label="Lời dẫn đầu mục thiệp" field="invitationIntro" rows={2} />
            <div className="cfg-grid-2">
              <TextField cfg={config} set={set} label="Nhãn sự kiện" field="eventBadge" placeholder="Ngày Nhà Gái" />
              <TextField cfg={config} set={set} label="Ngày (dd/mm/yyyy)" field="eventDate" placeholder="03/05/2026" />
              <TextField cfg={config} set={set} label="Giờ (HH:mm)" field="eventTime" placeholder="11:00" />
              <TextField cfg={config} set={set} label="Thứ" field="eventWeekday" placeholder="Chủ Nhật" />
            </div>
            <TextField cfg={config} set={set} label="Ngày âm lịch" field="eventLunarDate" />
            <h2 className="cfg-sub">Nhà trai / nhà gái</h2>
            <TextField cfg={config} set={set} label="Địa chỉ nhà trai" field="groomHouseAddress" rows={2} />
            <TextField cfg={config} set={set} label="Địa chỉ nhà gái" field="brideHouseAddress" rows={2} />
            <h2 className="cfg-sub">Lời mời</h2>
            <TextField cfg={config} set={set} label="Kính mời" field="guestName" placeholder="Quý khách" />
            <TextField cfg={config} set={set} label="Câu mời" field="invitationMessage" rows={2} />
          </section>
        )}

        {tab === 'venue' && (
          <section className="cfg-card">
            <h2>Địa điểm tiệc</h2>
            <TextField cfg={config} set={set} label="Tên nhà hàng" field="venueName" />
            <TextField cfg={config} set={set} label="Địa chỉ" field="venueAddress" rows={2} />
            <TextField
              cfg={config}
              set={set}
              label="Link Google Maps (bỏ trống sẽ tự tìm theo địa chỉ)"
              field="venueMapUrl"
              placeholder="https://maps.app.goo.gl/..."
            />
            <TextField
              cfg={config}
              set={set}
              label="Ghi chú (mỗi dòng một gạch đầu dòng)"
              field="venueNotes"
              rows={4}
            />
          </section>
        )}

        {tab === 'timeline' && (
          <section className="cfg-card">
            <div className="cfg-card-head">
              <h2>Lịch trình hôn lễ</h2>
              <button className="cfg-btn primary sm" onClick={addTimeline}>
                + Thêm mốc
              </button>
            </div>

            {config.timeline.length === 0 && (
              <p className="cfg-empty">Chưa có mốc nào.</p>
            )}

            <div className="cfg-list">
              {config.timeline.map((item, i) => (
                <div key={item.id} className="cfg-row">
                  <div className="cfg-grid-2">
                    <label className="cfg-field">
                      <span>Ngày</span>
                      <input
                        value={item.date}
                        onChange={(e) => setTimelineField(item.id, 'date', e.target.value)}
                      />
                    </label>
                    <label className="cfg-field">
                      <span>Giờ</span>
                      <input
                        value={item.time}
                        onChange={(e) => setTimelineField(item.id, 'time', e.target.value)}
                      />
                    </label>
                  </div>
                  <label className="cfg-field">
                    <span>Tên sự kiện</span>
                    <input
                      value={item.title}
                      onChange={(e) => setTimelineField(item.id, 'title', e.target.value)}
                    />
                  </label>
                  <label className="cfg-field">
                    <span>Ghi chú</span>
                    <input
                      value={item.note}
                      onChange={(e) => setTimelineField(item.id, 'note', e.target.value)}
                    />
                  </label>
                  <div className="cfg-row-actions">
                    <button
                      className="cfg-btn ghost sm"
                      onClick={() => {
                        const next = [...config.timeline]
                        if (i === 0) return
                        ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
                        set('timeline', next)
                      }}
                    >
                      ↑
                    </button>
                    <button
                      className="cfg-btn ghost sm"
                      onClick={() => {
                        const next = [...config.timeline]
                        if (i === next.length - 1) return
                        ;[next[i + 1], next[i]] = [next[i], next[i + 1]]
                        set('timeline', next)
                      }}
                    >
                      ↓
                    </button>
                    <button
                      className="cfg-btn danger sm"
                      onClick={() =>
                        set(
                          'timeline',
                          config.timeline.filter((t) => t.id !== item.id)
                        )
                      }
                    >
                      Xoá
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === 'album' && (
          <section className="cfg-card">
            <div className="cfg-card-head">
              <h2>Album ảnh cưới ({config.album.length})</h2>
              <label className="cfg-btn primary sm">
                + Tải ảnh lên
                <input type="file" accept="image/*" multiple hidden onChange={addAlbum} />
              </label>
            </div>
            <p className="cfg-hint">
              Ảnh được nén về chiều dài tối đa 1400px trước khi lưu. Nên giữ dưới 25 ảnh
              để không vượt dung lượng lưu trữ của trình duyệt.
            </p>

            {config.album.length === 0 ? (
              <p className="cfg-empty">Chưa có ảnh nào.</p>
            ) : (
              <div className="cfg-album">
                {config.album.map((src, i) => (
                  <figure key={i} className="cfg-thumb">
                    <img src={src} alt={`Ảnh ${i + 1}`} />
                    <figcaption>
                      <button onClick={() => moveAlbum(i, i - 1)} title="Sang trước">
                        ←
                      </button>
                      <button onClick={() => moveAlbum(i, i + 1)} title="Sang sau">
                        →
                      </button>
                      <button
                        className="del"
                        onClick={() => set('album', config.album.filter((_, k) => k !== i))}
                        title="Xoá"
                      >
                        ✕
                      </button>
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}

            {config.album.length > 0 && (
              <button
                className="cfg-btn danger"
                onClick={() => {
                  if (confirm('Xoá toàn bộ album?')) set('album', [])
                }}
              >
                Xoá toàn bộ album
              </button>
            )}
          </section>
        )}

        {tab === 'gift' && (
          <section className="cfg-card">
            <h2>Thông tin mừng cưới</h2>
            <div className="cfg-grid-2">
              <TextField cfg={config} set={set} label="Ngân hàng" field="bankName" />
              <TextField cfg={config} set={set} label="Số tài khoản" field="bankAccount" />
              <TextField cfg={config} set={set} label="Chủ tài khoản" field="bankOwner" />
              <TextField cfg={config} set={set} label="Số điện thoại liên hệ" field="phoneContact" />
            </div>
            <ImageField
              label="Ảnh QR chuyển tiền"
              value={config.qrCode}
              onPick={(e) => pickImage(e, 'qrCode')}
              onClear={() => set('qrCode', '')}
            />
          </section>
        )}

        {tab === 'email' && (
          <section className="cfg-card">
            <h2>Nhận xác nhận qua email</h2>
            <TextField cfg={config} set={set} label="Email nhận thông báo" field="emailReceiver" />
            <div className="cfg-grid-2">
              <TextField cfg={config} set={set} label="EmailJS Service ID" field="emailjsServiceId" placeholder="service_xxx" />
              <TextField cfg={config} set={set} label="EmailJS Template ID" field="emailjsTemplateId" placeholder="template_xxx" />
            </div>
            <TextField cfg={config} set={set} label="EmailJS Public Key" field="emailjsPublicKey" placeholder="xxxxxxxxxxxx" />

            <div className="cfg-note">
              <strong>Cách lấy 3 mã trên</strong>
              <ol>
                <li>
                  Tạo tài khoản tại <a href="https://www.emailjs.com" target="_blank" rel="noreferrer">emailjs.com</a> (miễn phí 200 email/tháng).
                </li>
                <li>Email Services → Add Service → chọn Gmail → lấy <code>Service ID</code>.</li>
                <li>
                  Email Templates → Create → dùng các biến:{' '}
                  <code>{'{{guest_name}}'}</code>, <code>{'{{attendance}}'}</code>,{' '}
                  <code>{'{{guest_count}}'}</code>, <code>{'{{wish}}'}</code>,{' '}
                  <code>{'{{couple}}'}</code>. Ô <em>To Email</em> đặt{' '}
                  <code>{'{{to_email}}'}</code>. Lấy <code>Template ID</code>.
                </li>
                <li>Account → General → copy <code>Public Key</code>.</li>
                <li>
                  Trong EmailJS: Account → Security → bật <em>Allow requests from browser</em>.
                </li>
              </ol>
            </div>
          </section>
        )}

        {tab === 'theme' && (
          <section className="cfg-card">
            <h2>Giao diện</h2>
            <div className="cfg-grid-2">
              <label className="cfg-field">
                <span>Màu chủ đạo</span>
                <div className="cfg-color">
                  <input
                    type="color"
                    value={config.accentColor}
                    onChange={(e) => set('accentColor', e.target.value)}
                  />
                  <input
                    value={config.accentColor}
                    onChange={(e) => set('accentColor', e.target.value)}
                  />
                </div>
              </label>
              <label className="cfg-field">
                <span>Màu nền</span>
                <div className="cfg-color">
                  <input
                    type="color"
                    value={config.backgroundColor}
                    onChange={(e) => set('backgroundColor', e.target.value)}
                  />
                  <input
                    value={config.backgroundColor}
                    onChange={(e) => set('backgroundColor', e.target.value)}
                  />
                </div>
              </label>
            </div>

            <div className="cfg-swatches">
              {[
                ['#E8175D', '#FFF5F7'],
                ['#C2185B', '#FDF4F7'],
                ['#B8860B', '#FFFBF2'],
                ['#0A7A56', '#F2FBF7'],
                ['#4A3AFF', '#F5F4FF'],
              ].map(([accent, bg]) => (
                <button
                  key={accent}
                  className="cfg-swatch"
                  style={{ background: accent }}
                  title={accent}
                  onClick={() => updateConfig({ accentColor: accent, backgroundColor: bg })}
                />
              ))}
              <button
                className="cfg-btn ghost sm"
                onClick={() =>
                  updateConfig({
                    accentColor: defaultConfig.accentColor,
                    backgroundColor: defaultConfig.backgroundColor,
                  })
                }
              >
                Mặc định
              </button>
            </div>
          </section>
        )}
      </div>

      {toast && <div className="cfg-toast">{toast}</div>}
    </div>
  )
}

function ImageField({
  label,
  value,
  onPick,
  onClear,
}: {
  label: string
  value: string
  onPick: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClear: () => void
}) {
  return (
    <div className="cfg-image">
      <span className="cfg-image-label">{label}</span>
      <div className="cfg-image-row">
        {value ? (
          <img src={value} alt={label} />
        ) : (
          <div className="cfg-image-empty">Chưa có</div>
        )}
        <div className="cfg-image-actions">
          <label className="cfg-btn primary sm">
            Chọn ảnh
            <input type="file" accept="image/*" hidden onChange={onPick} />
          </label>
          {value && (
            <button className="cfg-btn danger sm" onClick={onClear}>
              Xoá
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function TextField({
  cfg,
  set,
  label,
  field,
  placeholder,
  rows,
}: {
  cfg: WeddingConfig
  set: <K extends keyof WeddingConfig>(key: K, value: WeddingConfig[K]) => void
  label: string
  field: keyof WeddingConfig
  placeholder?: string
  rows?: number
}) {
  const value = String(cfg[field] ?? '')
  return (
    <label className="cfg-field">
      <span>{label}</span>
      {rows ? (
        <textarea
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(e) => set(field, e.target.value as never)}
        />
      ) : (
        <input
          value={value}
          placeholder={placeholder}
          onChange={(e) => set(field, e.target.value as never)}
        />
      )}
    </label>
  )
}

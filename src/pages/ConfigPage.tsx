import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  useConfigStore,
  defaultConfig,
  type TimelineItem,
  type WeddingConfig,
} from '../store'
import { buildShareUrl, isSharedMode } from '../shareLink'
import { uploadImageToCloudinary } from '../cloudinary'
import '../styles/layout.css'
import '../styles/config.css'

type TabId = 'couple' | 'event' | 'venue' | 'timeline' | 'album' | 'gift' | 'email' | 'theme'

interface ShareModalState {
  open: boolean
  link: string
}

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
  const [shareModal, setShareModal] = useState<ShareModalState>({ open: false, link: '' })
  const importRef = useRef<HTMLInputElement>(null)
  const shared = isSharedMode()

  // Trang cấu hình chỉ dành cho chủ thiệp: cần mật khẩu khi truy cập trực tiếp.
  // Link chia sẻ (shared=true) là chế độ chỉ xem nên bỏ qua bước này.
  const [authed, setAuthed] = useState(() => shared || sessionStorage.getItem('cfg-authed') === '1')
  const [passInput, setPassInput] = useState('')
  const [passError, setPassError] = useState(false)

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
      flash('Đang upload ảnh lên Cloudinary...')
      const cloudinaryUrl = await uploadImageToCloudinary(file)
      set(key, cloudinaryUrl)
      flash('✓ Upload ảnh thành công')
    } catch (error) {
      console.error('Upload error:', error)
      flash('Không upload được ảnh')
    }
  }

  const addAlbum = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!files.length) return
    try {
      flash(`Đang upload ${files.length} ảnh lên Cloudinary...`)
      const urls = await Promise.all(files.map(f => uploadImageToCloudinary(f)))
      set('album', [...config.album, ...urls])
      flash(`✓ Đã thêm ${urls.length} ảnh`)
    } catch (error) {
      console.error('Upload error:', error)
      flash('Có ảnh không upload được')
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

  const copyShare = () => {
    const link = buildShareUrl(config)
    setShareModal({ open: true, link })
  }

  if (!shared && !authed) {
    return (
      <div className="cfg-page">
        <div className="cfg-card cfg-gate">
          <h2>🔒 Khu vực cấu hình</h2>
          <p className="cfg-hint">Nhập mật khẩu để vào chỉnh sửa thiệp.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (passInput === 'khoitn') {
                sessionStorage.setItem('cfg-authed', '1')
                setAuthed(true)
              } else {
                setPassError(true)
              }
            }}
          >
            <div className="cfg-field">
              <input
                type="password"
                value={passInput}
                autoFocus
                placeholder="Mật khẩu"
                onChange={(e) => {
                  setPassInput(e.target.value)
                  setPassError(false)
                }}
              />
            </div>
            {passError && (
              <p style={{ color: '#c01745', fontSize: 13, marginBottom: 12 }}>
                Sai mật khẩu, vui lòng thử lại.
              </p>
            )}
            <button type="submit" className="cfg-btn primary" style={{ width: '100%' }}>
              Vào cấu hình
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="cfg-page">
      <header className="cfg-top">
        <div>
          <h1>Cấu hình thiệp cưới {shared && <span className="shared-badge">👁️ Chỉ xem</span>}</h1>
          <p>{shared ? '📌 Đây là link chia sẻ - bạn chỉ có thể xem, không thể chỉnh sửa.' : 'Mọi thay đổi lưu tự động vào trình duyệt này.'}</p>
        </div>
        <div className="cfg-top-actions">
          {!shared && (
            <>
              <button className="cfg-btn ghost" onClick={exportJson}>
                ⬇️ Xuất JSON
              </button>
              <button className="cfg-btn ghost" onClick={() => importRef.current?.click()}>
                ⬆️ Nhập JSON
              </button>
            </>
          )}
          <button className="cfg-btn ghost" onClick={copyShare}>
            🔗 Copy link
          </button>
          {!shared && (
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
          )}
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
                <TextField cfg={config} set={set} label="Tên gọi ngắn" field="groomName" disabled={shared} />
                <TextField cfg={config} set={set} label="Họ tên đầy đủ" field="groomFullName" disabled={shared} />
                <TextField cfg={config} set={set} label="Vai (Chú Rể)" field="groomRole" disabled={shared} />
                <TextField cfg={config} set={set} label="Thứ tự trong gia đình" field="groomOrder" disabled={shared} />
                <TextField cfg={config} set={set} label="Tên cha" field="groomFather" disabled={shared} />
                <TextField cfg={config} set={set} label="Tên mẹ" field="groomMother" disabled={shared} />
                <TextField cfg={config} set={set} label="Quê / nơi sống" field="groomHometown" disabled={shared} />
              </div>
              {!shared && (
                <ImageField
                  label="Ảnh chú rể"
                  value={config.groomImage}
                  onPick={(e) => pickImage(e, 'groomImage')}
                  onClear={() => set('groomImage', '')}
                />
              )}
            </section>

            <section className="cfg-card">
              <h2>Cô dâu</h2>
              <div className="cfg-grid-2">
                <TextField cfg={config} set={set} label="Tên gọi ngắn" field="brideName" disabled={shared} />
                <TextField cfg={config} set={set} label="Họ tên đầy đủ" field="brideFullName" disabled={shared} />
                <TextField cfg={config} set={set} label="Vai (Cô Dâu)" field="brideRole" disabled={shared} />
                <TextField cfg={config} set={set} label="Thứ tự trong gia đình" field="brideOrder" disabled={shared} />
                <TextField cfg={config} set={set} label="Tên cha" field="brideFather" disabled={shared} />
                <TextField cfg={config} set={set} label="Tên mẹ" field="brideMother" disabled={shared} />
                <TextField cfg={config} set={set} label="Quê / nơi sống" field="brideHometown" disabled={shared} />
              </div>
              {!shared && (
                <ImageField
                  label="Ảnh cô dâu"
                  value={config.brideImage}
                  onPick={(e) => pickImage(e, 'brideImage')}
                  onClear={() => set('brideImage', '')}
                />
              )}
            </section>

            <section className="cfg-card">
              <h2>Trang chủ</h2>
              <TextField cfg={config} set={set} label="Tiêu đề lớn" field="heroTitle" disabled={shared} />
              <TextField cfg={config} set={set} label="Câu phụ dưới tên" field="heroSubtitle" rows={2} disabled={shared} />
              <TextField cfg={config} set={set} label="Câu đối / lời chúc" field="coupleQuote" rows={3} disabled={shared} />
            </section>
          </>
        )}

        {tab === 'event' && (
          <section className="cfg-card">
            <h2>Thông tin lễ cưới</h2>
            <TextField cfg={config} set={set} label="Lời dẫn đầu mục thiệp" field="invitationIntro" rows={2} disabled={shared} />
            <div className="cfg-grid-2">
              <TextField cfg={config} set={set} label="Nhãn sự kiện" field="eventBadge" placeholder="Ngày Nhà Gái" disabled={shared} />
              <TextField cfg={config} set={set} label="Ngày (dd/mm/yyyy)" field="eventDate" placeholder="03/05/2026" disabled={shared} />
              <TextField cfg={config} set={set} label="Giờ (HH:mm)" field="eventTime" placeholder="11:00" disabled={shared} />
              <TextField cfg={config} set={set} label="Thứ" field="eventWeekday" placeholder="Chủ Nhật" disabled={shared} />
            </div>
            <TextField cfg={config} set={set} label="Ngày âm lịch" field="eventLunarDate" disabled={shared} />
            <h2 className="cfg-sub">Nhà trai / nhà gái</h2>
            <TextField cfg={config} set={set} label="Địa chỉ nhà trai" field="groomHouseAddress" rows={2} disabled={shared} />
            <TextField cfg={config} set={set} label="Địa chỉ nhà gái" field="brideHouseAddress" rows={2} disabled={shared} />
            <h2 className="cfg-sub">Lời mời</h2>
            <TextField cfg={config} set={set} label="Kính mời" field="guestName" placeholder="Quý khách" disabled={shared} />
            <TextField cfg={config} set={set} label="Câu mời" field="invitationMessage" rows={2} disabled={shared} />
          </section>
        )}

        {tab === 'venue' && (
          <section className="cfg-card">
            <h2>Địa điểm tiệc</h2>
            <TextField cfg={config} set={set} label="Tên nhà hàng" field="venueName" disabled={shared} />
            <TextField cfg={config} set={set} label="Địa chỉ" field="venueAddress" rows={2} disabled={shared} />
            <TextField
              cfg={config}
              set={set}
              label="Link Google Maps (bỏ trống sẽ tự tìm theo địa chỉ)"
              field="venueMapUrl"
              placeholder="https://maps.app.goo.gl/..."
              disabled={shared}
            />
            <TextField
              cfg={config}
              set={set}
              label="Ghi chú (mỗi dòng một gạch đầu dòng)"
              field="venueNotes"
              rows={4}
              disabled={shared}
            />
          </section>
        )}

        {tab === 'timeline' && !shared && (
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

        {tab === 'album' && !shared && (
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

      {shareModal.open && (
        <div className="share-modal-overlay" onClick={() => setShareModal({ open: false, link: '' })}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <button className="share-modal-close" onClick={() => setShareModal({ open: false, link: '' })}>
              ✕
            </button>
            <h2>🔗 Chia sẻ thiệp cưới</h2>
            <p className="share-modal-note">
              ✓ Link này <strong>gồm toàn bộ cấu hình và ảnh từ Cloudinary</strong>. Người nhận chỉ xem được thiệp (không chỉnh sửa được).
            </p>
            <div className="share-modal-link">
              <input
                type="text"
                readOnly
                value={shareModal.link}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                className="cfg-btn primary"
                onClick={() => {
                  navigator.clipboard.writeText(shareModal.link).then(() => {
                    flash('✓ Đã copy vào clipboard')
                    setTimeout(() => setShareModal({ open: false, link: '' }), 1000)
                  })
                }}
              >
                📋 Copy
              </button>
            </div>
            <div className="share-modal-preview">
              <p><strong>Sao chép link:</strong></p>
              <button
                className="cfg-btn primary"
                style={{ width: '100%', marginTop: '8px' }}
                onClick={() => {
                  navigator.clipboard.writeText(shareModal.link).then(() => {
                    flash('✓ Đã copy vào clipboard')
                    setTimeout(() => setShareModal({ open: false, link: '' }), 1000)
                  }).catch(() => {
                    flash('Không copy được, vui lòng copy thủ công')
                  })
                }}
              >
                📋 Copy Link
              </button>
            </div>
          </div>
        </div>
      )}
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
  disabled,
}: {
  cfg: WeddingConfig
  set: <K extends keyof WeddingConfig>(key: K, value: WeddingConfig[K]) => void
  label: string
  field: keyof WeddingConfig
  placeholder?: string
  rows?: number
  disabled?: boolean
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
          disabled={disabled}
        />
      ) : (
        <input
          value={value}
          placeholder={placeholder}
          onChange={(e) => set(field, e.target.value as never)}
          disabled={disabled}
        />
      )}
    </label>
  )
}

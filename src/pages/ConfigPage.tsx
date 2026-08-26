import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  useConfigStore,
  defaultConfig,
  DEFAULT_CONFIG_ID,
  type TimelineItem,
  type WeddingConfig,
} from '../store'
import { buildShareUrl } from '../shareLink'
import {
  normalizeConfigId,
  RemoteError,
  saveRemoteConfig,
  verifyPassword,
} from '../remoteConfig'
import { isGuest, leaveGuestMode } from '../viewMode'
import { uploadImageToCloudinary } from '../cloudinary'
import '../styles/layout.css'
import '../styles/config.css'

type TabId =
  | 'couple'
  | 'event'
  | 'venue'
  | 'timeline'
  | 'album'
  | 'gift'
  | 'email'
  | 'theme'
  | 'share'

type SyncState = 'idle' | 'saving' | 'saved' | 'error'

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
  { id: 'share', label: '🔗 Chia sẻ' },
]

const PASS_KEY = 'cfg-pass'
/** Mật khẩu dự phòng khi chạy `npm run dev` (chưa có serverless function). */
const OFFLINE_PASSWORD = 'khoitn'
/** Chờ ngừng gõ bao lâu thì tự đẩy cấu hình lên server. */
const AUTOSAVE_DELAY = 2000

export default function ConfigPage() {
  const { config, configId, updateConfig, resetConfig, replaceConfig, setConfigId } =
    useConfigStore()
  const [tab, setTab] = useState<TabId>('couple')
  const [toast, setToast] = useState('')
  const [shareModal, setShareModal] = useState<ShareModalState>({ open: false, link: '' })
  const importRef = useRef<HTMLInputElement>(null)

  // Trang cấu hình chỉ dành cho chủ thiệp. Mật khẩu được xác thực ở server nên
  // không nằm trong bundle; giữ lại trong sessionStorage để tự lưu về sau.
  const [password, setPassword] = useState(() => sessionStorage.getItem(PASS_KEY) ?? '')
  const [authed, setAuthed] = useState(() => Boolean(sessionStorage.getItem(PASS_KEY)))
  const [passInput, setPassInput] = useState('')
  const [passError, setPassError] = useState('')
  const [checking, setChecking] = useState(false)

  // Trạng thái đồng bộ với server (Vercel Blob).
  const [sync, setSync] = useState<SyncState>('idle')
  const [syncError, setSyncError] = useState('')
  const [idDraft, setIdDraft] = useState(configId)
  const mountedRef = useRef(false)

  const set = <K extends keyof WeddingConfig>(key: K, value: WeddingConfig[K]) =>
    updateConfig({ [key]: value } as Partial<WeddingConfig>)

  const flash = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }

  /** Đẩy cấu hình hiện tại lên server và ghi nhận mốc thời gian server trả về. */
  const publish = async (silent = false) => {
    if (!password) return
    setSync('saving')
    setSyncError('')
    try {
      const updatedAt = await saveRemoteConfig(configId, config, password)
      // Chỉ ghi nhận mốc thời gian, không thay object config, nếu không effect tự
      // lưu sẽ thấy config "mới" và lặp vô hạn.
      useConfigStore.getState().markSynced(updatedAt)
      setSync('saved')
      if (!silent) flash('✓ Đã phát hành lên link chia sẻ')
    } catch (err) {
      const local =
        err instanceof RemoteError && err.status === 404
          ? 'Đang chạy local nên chưa có API — cấu hình chỉ lưu trong máy này.'
          : null
      const message = local ?? (err instanceof Error ? err.message : 'Lỗi không xác định')
      setSync('error')
      setSyncError(message)
      if (!silent) flash(local ? message : `Không lưu được: ${message}`)
    }
  }

  // Tự lưu sau khi ngừng chỉnh sửa, để không phải nhớ bấm nút.
  useEffect(() => {
    if (isGuest || !authed || !password) return
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }
    const timer = setTimeout(() => void publish(true), AUTOSAVE_DELAY)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, configId, authed, password])

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setChecking(true)
    setPassError('')
    try {
      const ok = await verifyPassword(passInput)
      if (!ok) {
        setPassError('Sai mật khẩu, vui lòng thử lại.')
        return
      }
      sessionStorage.setItem(PASS_KEY, passInput)
      setPassword(passInput)
      setAuthed(true)
    } catch (err) {
      // Không có serverless function (chạy vite dev) thì cho vào chế độ offline.
      if (err instanceof RemoteError && err.status === 404) {
        if (passInput === OFFLINE_PASSWORD) {
          sessionStorage.setItem(PASS_KEY, passInput)
          setPassword(passInput)
          setAuthed(true)
          return
        }
        setPassError('Sai mật khẩu, vui lòng thử lại.')
        return
      }
      setPassError(err instanceof Error ? err.message : 'Không kiểm tra được mật khẩu')
    } finally {
      setChecking(false)
    }
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
      const urls = await Promise.all(files.map((f) => uploadImageToCloudinary(f)))
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

  const commitId = () => {
    const next = normalizeConfigId(idDraft) || DEFAULT_CONFIG_ID
    setIdDraft(next)
    if (next !== configId) {
      setConfigId(next)
      flash(`Đã đổi mã thiệp thành "${next}"`)
    }
  }

  const copyShare = () => setShareModal({ open: true, link: buildShareUrl(configId) })

  const copyToClipboard = (link: string) =>
    navigator.clipboard
      .writeText(link)
      .then(() => {
        flash('✓ Đã copy vào clipboard')
        setTimeout(() => setShareModal({ open: false, link: '' }), 1000)
      })
      .catch(() => flash('Không copy được, vui lòng copy thủ công'))

  // Khách vào bằng link chia sẻ thì không được xem khu vực cấu hình.
  if (isGuest) {
    return (
      <div className="cfg-page">
        <div className="cfg-card cfg-gate">
          <h2>👁️ Chỉ xem</h2>
          <p className="cfg-hint">
            Bạn đang mở thiệp bằng link chia sẻ nên không truy cập được khu vực cấu hình.
          </p>
          <Link className="cfg-btn primary" to="/" style={{ width: '100%' }}>
            ← Về xem thiệp
          </Link>
          <button
            className="cfg-btn ghost"
            style={{ width: '100%', marginTop: 8 }}
            onClick={leaveGuestMode}
          >
            Tôi là chủ thiệp, vào cấu hình
          </button>
        </div>
      </div>
    )
  }

  if (!authed) {
    return (
      <div className="cfg-page">
        <div className="cfg-card cfg-gate">
          <h2>🔒 Khu vực cấu hình</h2>
          <p className="cfg-hint">Nhập mật khẩu để vào chỉnh sửa thiệp.</p>
          <form onSubmit={submitPassword}>
            <div className="cfg-field">
              <input
                type="password"
                value={passInput}
                autoFocus
                placeholder="Mật khẩu"
                onChange={(e) => {
                  setPassInput(e.target.value)
                  setPassError('')
                }}
              />
            </div>
            {passError && (
              <p style={{ color: '#c01745', fontSize: 13, marginBottom: 12 }}>{passError}</p>
            )}
            <button
              type="submit"
              className="cfg-btn primary"
              style={{ width: '100%' }}
              disabled={checking}
            >
              {checking ? 'Đang kiểm tra...' : 'Vào cấu hình'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  const syncLabel =
    sync === 'saving'
      ? '☁️ Đang lưu...'
      : sync === 'saved'
        ? '✓ Đã lưu lên server'
        : sync === 'error'
          ? '⚠️ Lưu thất bại'
          : '☁️ Lưu & phát hành'

  return (
    <div className="cfg-page">
      <header className="cfg-top">
        <div>
          <h1>Cấu hình thiệp cưới</h1>
          <p>
            Thay đổi được lưu vào máy này và tự đẩy lên server sau vài giây. Link chia sẻ
            luôn hiển thị bản mới nhất.
          </p>
          {sync === 'error' && <p className="cfg-sync-error">⚠️ {syncError}</p>}
        </div>
        <div className="cfg-top-actions">
          <button
            className={`cfg-btn ${sync === 'error' ? 'danger' : 'ghost'}`}
            onClick={() => void publish()}
            disabled={sync === 'saving'}
          >
            {syncLabel}
          </button>
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

            {config.timeline.length === 0 && <p className="cfg-empty">Chưa có mốc nào.</p>}

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
                        if (i === 0) return
                        const next = [...config.timeline]
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
              Ảnh được tải lên Cloudinary nên link chia sẻ chỉ chứa đường dẫn ảnh, không
              chứa dữ liệu ảnh.
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

        {tab === 'share' && (
          <section className="cfg-card">
            <h2>Link chia sẻ</h2>
            <p className="cfg-hint">
              Cấu hình được lưu trên server theo <strong>mã thiệp</strong> dưới đây. Link
              chia sẻ không đổi: bạn sửa nội dung bất cứ lúc nào, khách mở lại đúng link cũ
              là thấy bản mới nhất. Nhớ mã này: muốn chỉnh thiệp từ máy khác, bạn nhập lại
              đúng mã ở đây là cấu hình cũ tự tải về.
            </p>

            <label className="cfg-field">
              <span>Mã thiệp (chỉ chữ thường, số, dấu gạch ngang)</span>
              <input
                value={idDraft}
                placeholder={DEFAULT_CONFIG_ID}
                onChange={(e) => setIdDraft(e.target.value)}
                onBlur={commitId}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    commitId()
                  }
                }}
              />
            </label>

            <label className="cfg-field">
              <span>Link gửi cho khách</span>
              <input readOnly value={buildShareUrl(configId)} onClick={(e) => (e.target as HTMLInputElement).select()} />
            </label>

            <div className="cfg-row-actions">
              <button className="cfg-btn primary" onClick={() => copyToClipboard(buildShareUrl(configId))}>
                📋 Copy link
              </button>
              <button
                className="cfg-btn ghost"
                onClick={() => window.open(buildShareUrl(configId), '_blank')}
              >
                👁️ Xem như khách
              </button>
              <button
                className="cfg-btn ghost"
                onClick={() => void publish()}
                disabled={sync === 'saving'}
              >
                {syncLabel}
              </button>
            </div>

            <div className="cfg-note">
              <strong>Cần bật một lần trên Vercel</strong>
              <ol>
                <li>
                  Vercel Dashboard → chọn project → tab <em>Storage</em> → <em>Create Database</em>{' '}
                  → chọn <strong>Blob</strong> → <em>Connect to Project</em>. Vercel tự thêm biến{' '}
                  <code>BLOB_READ_WRITE_TOKEN</code>.
                </li>
                <li>
                  Tab <em>Settings → Environment Variables</em>: thêm{' '}
                  <code>CONFIG_PASSWORD</code> = mật khẩu bạn muốn dùng cho trang{' '}
                  <code>/config</code>.
                </li>
                <li>Redeploy lại project để các biến trên có hiệu lực.</li>
              </ol>
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
              Link này <strong>cố định</strong>. Mọi thay đổi bạn lưu ở trang cấu hình sẽ tự
              hiện ra với người đã nhận link, kể cả trên máy tính hay điện thoại khác.
            </p>
            <div className="share-modal-link">
              <input
                type="text"
                readOnly
                value={shareModal.link}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button className="cfg-btn primary" onClick={() => copyToClipboard(shareModal.link)}>
                📋 Copy
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

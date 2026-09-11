import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  useConfigStore,
  defaultConfig,
  DEFAULT_CONFIG_ID,
  imageToBase64,
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
import { uploadImageToCloudinary, uploadAudioToCloudinary } from '../cloudinary'
import '../styles/layout.css'
import '../styles/config.css'

type TabId =
  | 'couple'
  | 'event'
  | 'venue'
  | 'timeline'
  | 'album'
  | 'gift'
  | 'guestbook'
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
  { id: 'guestbook', label: '📖 Sổ lưu bút' },
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

  // Cấu hình Nhà Gái / Nhà Trai trong tab Địa Điểm
  const [venuePartyTab, setVenuePartyTab] = useState<'bride' | 'groom'>('bride')

  // Chọn loại link chung (Nhà Gái / Nhà Trai / Cả 2 bên)
  const [commonLinkSide, setCommonLinkSide] = useState<'bride' | 'groom' | 'both'>('bride')

  // Tạo link custom cho từng khách
  const [guestNameInput, setGuestNameInput] = useState('')
  const [salutationInput, setSalutationInput] = useState('Kính gửi')
  const [guestSideInput, setGuestSideInput] = useState<'bride' | 'groom' | 'both'>('bride')
  const [batchGuestsInput, setBatchGuestsInput] = useState('')
  const [batchSideInput, setBatchSideInput] = useState<'bride' | 'groom' | 'both'>('bride')
  const [guestSearch, setGuestSearch] = useState('')
  const [showBatchModal, setShowBatchModal] = useState(false)

  const set = <K extends keyof WeddingConfig>(key: K, value: WeddingConfig[K]) =>
    updateConfig({ [key]: value } as Partial<WeddingConfig>)

  const updateParty = (sideKey: 'bride' | 'groom', updates: Partial<typeof defaultConfig.brideParty>) => {
    const key = sideKey === 'bride' ? 'brideParty' : 'groomParty'
    const cur = config[key] || defaultConfig[key]
    const updated = { ...cur, ...updates }
    if (sideKey === 'bride') {
      updateConfig({
        brideParty: updated,
        venueName: updated.venueName,
        venueAddress: updated.venueAddress,
        venueMapUrl: updated.venueMapUrl,
        venueNotes: updated.venueNotes,
      })
    } else {
      updateConfig({
        groomParty: updated,
      })
    }
  }

  const flash = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }

  const buildInvitationMessage = (
    guestName: string,
    salutation = 'Kính gửi',
    side: 'bride' | 'groom' | 'both' = 'bride'
  ) => {
    const link = buildShareUrl(configId, guestName, side, salutation)
    const displayName = guestName || 'Quý Khách'

    if (side === 'both') {
      const bride = config.brideParty || defaultConfig.brideParty
      const groom = config.groomParty || defaultConfig.groomParty
      return `${salutation} ${displayName}!

Trân trọng kính mời ${displayName} đến tham dự và nâng ly chúc mừng Lễ Cưới của ${config.groomName} & ${config.brideName}.

🌸 TIỆC NHÀ GÁI (${bride.title || 'LỄ VU QUY'}):
🗓️ ${bride.weekday}, ngày ${bride.date} lúc ${bride.time}
📍 ${bride.venueName} - ${bride.venueAddress}

🤵 TIỆC NHÀ TRAI (${groom.title || 'LỄ TÂN HÔN'}):
🗓️ ${groom.weekday}, ngày ${groom.date} lúc ${groom.time}
📍 ${groom.venueName} - ${groom.venueAddress}

Xem thiệp cưới & chỉ đường 1 chạm tại:
${link}

Sự hiện diện của ${displayName} là niềm vinh hạnh lớn cho gia đình chúng mình! 💖`
    }

    const party =
      side === 'groom'
        ? config.groomParty || defaultConfig.groomParty
        : config.brideParty || defaultConfig.brideParty

    const ceremonyTitle = party.title || (side === 'groom' ? 'LỄ TÂN HÔN' : 'LỄ VU QUY')
    const partyDate = party.date || config.eventDate
    const partyWeekday = party.weekday || config.eventWeekday
    const partyTime = party.time || config.eventTime
    const venueName = party.venueName || config.venueName
    const venueAddress = party.venueAddress || config.venueAddress

    return `${salutation} ${displayName}!

Trân trọng kính mời ${displayName} đến tham dự và nâng ly chúc mừng ${ceremonyTitle} của ${config.groomName} & ${config.brideName} vào ${partyWeekday}, ngày ${partyDate} lúc ${partyTime} tại ${venueName} (${venueAddress}).

Xem thiệp cưới & chỉ đường 1 chạm tại:
${link}

Sự hiện diện của ${displayName} là niềm vinh hạnh cho gia đình chúng mình! 💖`
  }

  const copyInvitationText = (
    guestName: string,
    salutation = 'Kính gửi',
    side: 'bride' | 'groom' | 'both' = 'bride'
  ) => {
    const text = buildInvitationMessage(guestName, salutation, side)
    navigator.clipboard
      .writeText(text)
      .then(() => flash(`✓ Đã copy tin nhắn mời cho "${guestName}"`))
      .catch(() => flash('Không copy được, vui lòng copy thủ công'))
  }

  const addCustomGuest = (
    nameToAdd: string,
    salutation = 'Kính gửi',
    side: 'bride' | 'groom' | 'both' = 'bride'
  ) => {
    const trimmed = nameToAdd.trim()
    if (!trimmed) return
    const guests = config.customGuests || []
    if (guests.some((g) => g.name.toLowerCase() === trimmed.toLowerCase())) {
      flash(`Khách "${trimmed}" đã có trong danh sách`)
      return
    }
    const newGuest = {
      id: `g-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: trimmed,
      salutation,
      side,
    }
    set('customGuests', [newGuest, ...guests])
    setGuestNameInput('')
    flash(`✓ Đã thêm "${trimmed}" vào danh sách khách mời`)
  }

  const handleAddBatchGuests = () => {
    const lines = batchGuestsInput
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    if (lines.length === 0) return

    const guests = [...(config.customGuests || [])]
    let addedCount = 0

    lines.forEach((line) => {
      let cleanName = line
      let sal = salutationInput
      let s = batchSideInput
      if (line.includes(':')) {
        const parts = line.split(':')
        sal = parts[0].trim()
        cleanName = parts.slice(1).join(':').trim()
      }
      if (cleanName && !guests.some((g) => g.name.toLowerCase() === cleanName.toLowerCase())) {
        guests.push({
          id: `g-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: cleanName,
          salutation: sal,
          side: s,
        })
        addedCount++
      }
    })

    set('customGuests', guests)
    setBatchGuestsInput('')
    setShowBatchModal(false)
    flash(`✓ Đã tạo link cho ${addedCount} khách mời mới!`)
  }

  const removeCustomGuest = (id: string) => {
    const guests = (config.customGuests || []).filter((g) => g.id !== id)
    set('customGuests', guests)
    flash('✓ Đã xóa khách khỏi danh sách')
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
    key: 'qrCode' | 'groomImage' | 'brideImage' | 'backgroundImage'
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

  const pickAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    try {
      flash('Đang tải tệp nhạc lên Cloudinary...')
      const audioUrl = await uploadAudioToCloudinary(file)
      set('musicUrl', audioUrl)
      flash('✓ Tải nhạc thành công!')
    } catch (err) {
      console.warn('Cloudinary audio upload failed, trying fallback:', err)
      if (file.size < 2.5 * 1024 * 1024) {
        try {
          const dataUrl = await imageToBase64(file)
          set('musicUrl', dataUrl)
          flash('✓ Đã lưu tệp nhạc vào cấu hình!')
        } catch {
          flash('Không đọc được tệp âm thanh này')
        }
      } else {
        flash('Không upload được tệp nhạc, hãy kiểm tra dung lượng hoặc kết nối')
      }
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
              <DatePickerField
                label="Ngày cưới chính (dd/mm/yyyy)"
                value={config.eventDate}
                onChange={(val) => set('eventDate', val)}
                onWeekdayChange={(wd) => set('eventWeekday', wd)}
                placeholder="02/05/2027"
              />
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
            <div className="cfg-party-toggle-bar">
              <button
                type="button"
                className={`cfg-party-tab-btn ${venuePartyTab === 'bride' ? 'active' : ''}`}
                onClick={() => setVenuePartyTab('bride')}
              >
                <span>🌸 Cấu hình Nhà Gái (Lễ Vu Quy)</span>
              </button>
              <button
                type="button"
                className={`cfg-party-tab-btn ${venuePartyTab === 'groom' ? 'active' : ''}`}
                onClick={() => setVenuePartyTab('groom')}
              >
                <span>🤵 Cấu hình Nhà Trai (Lễ Tân Hôn)</span>
              </button>
            </div>

            <div className="cfg-party-header-info">
              <h3>
                {venuePartyTab === 'bride'
                  ? '🌸 Địa điểm & Thông tin Tiệc Nhà Gái (Lễ Vu Quy)'
                  : '🤵 Địa điểm & Thông tin Tiệc Nhà Trai (Lễ Tân Hôn)'}
              </h3>
              <p className="cfg-hint">
                {venuePartyTab === 'bride'
                  ? 'Cấu hình này dành cho thiệp gửi khách Nhà Gái (Vu Quy) hoặc khi khách chọn tab Nhà Gái.'
                  : 'Cấu hình này dành cho thiệp gửi khách Nhà Trai (Tân Hôn) hoặc khi khách chọn tab Nhà Trai.'}
              </p>
            </div>

            {(() => {
              const cur =
                venuePartyTab === 'bride'
                  ? config.brideParty || defaultConfig.brideParty
                  : config.groomParty || defaultConfig.groomParty
              return (
                <div className="cfg-party-form">
                  <div className="cfg-grid-2">
                    <label className="cfg-field">
                      <span>Tiêu đề buổi lễ</span>
                      <input
                        value={cur.title}
                        onChange={(e) => updateParty(venuePartyTab, { title: e.target.value })}
                        placeholder={venuePartyTab === 'bride' ? 'LỄ VU QUY' : 'LỄ TÂN HÔN'}
                      />
                    </label>
                    <label className="cfg-field">
                      <span>Huy hiệu phân loại</span>
                      <input
                        value={cur.badge}
                        onChange={(e) => updateParty(venuePartyTab, { badge: e.target.value })}
                        placeholder={venuePartyTab === 'bride' ? 'Tiệc Nhà Gái' : 'Tiệc Nhà Trai'}
                      />
                    </label>
                  </div>

                  <div className="cfg-grid-3">
                    <DatePickerField
                      label="Ngày tổ chức (dd/mm/yyyy)"
                      value={cur.date}
                      onChange={(val) => updateParty(venuePartyTab, { date: val })}
                      onWeekdayChange={(wd) => updateParty(venuePartyTab, { weekday: wd })}
                      placeholder="02/05/2027"
                    />
                    <label className="cfg-field">
                      <span>Thứ trong tuần</span>
                      <input
                        value={cur.weekday}
                        onChange={(e) => updateParty(venuePartyTab, { weekday: e.target.value })}
                        placeholder="Chủ Nhật"
                      />
                    </label>
                    <label className="cfg-field">
                      <span>Giờ tổ chức</span>
                      <input
                        value={cur.time}
                        onChange={(e) => updateParty(venuePartyTab, { time: e.target.value })}
                        placeholder="11:00"
                      />
                    </label>
                  </div>

                  <label className="cfg-field">
                    <span>Ngày âm lịch</span>
                    <input
                      value={cur.lunarDate}
                      onChange={(e) => updateParty(venuePartyTab, { lunarDate: e.target.value })}
                      placeholder="Nhằm ngày 27 tháng 03 năm Đinh Mùi"
                    />
                  </label>

                  <label className="cfg-field">
                    <span>Tên nhà hàng / địa điểm</span>
                    <input
                      value={cur.venueName}
                      onChange={(e) => updateParty(venuePartyTab, { venueName: e.target.value })}
                      placeholder={venuePartyTab === 'bride' ? 'Nhà hàng tiệc cưới Lộc Vừng' : 'Tư gia Nhà Trai'}
                    />
                  </label>

                  <label className="cfg-field">
                    <span>Địa chỉ tổ chức</span>
                    <textarea
                      rows={2}
                      value={cur.venueAddress}
                      onChange={(e) => updateParty(venuePartyTab, { venueAddress: e.target.value })}
                      placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                    />
                  </label>

                  <label className="cfg-field">
                    <span>Link Google Maps (bỏ trống sẽ tự tìm theo địa chỉ)</span>
                    <input
                      value={cur.venueMapUrl}
                      onChange={(e) => updateParty(venuePartyTab, { venueMapUrl: e.target.value })}
                      placeholder="https://maps.app.goo.gl/..."
                    />
                  </label>

                  <label className="cfg-field">
                    <span>Ghi chú khi tham dự (mỗi dòng một gạch đầu dòng)</span>
                    <textarea
                      rows={3}
                      value={cur.venueNotes}
                      onChange={(e) => updateParty(venuePartyTab, { venueNotes: e.target.value })}
                      placeholder="Vui lòng đến trước giờ cử hành 15 phút..."
                    />
                  </label>
                </div>
              )
            })()}
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
                    <DatePickerField
                      label="Ngày (dd/mm/yyyy)"
                      value={item.date}
                      onChange={(val) => setTimelineField(item.id, 'date', val)}
                      placeholder="02/05/2027"
                    />
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

        {tab === 'guestbook' && (
          <section className="cfg-card">
            <div className="cfg-card-header-row">
              <div>
                <h2>Quản lý Sổ Lưu Bút ({config.wishes?.length || 0})</h2>
                <p className="cfg-hint">
                  Xem và xóa các lời chúc phúc của khách mời đã gửi trên trang thiệp cưới.
                </p>
              </div>
              {config.wishes && config.wishes.length > 0 && (
                <button
                  type="button"
                  className="cfg-btn cfg-btn-danger"
                  onClick={() => {
                    if (window.confirm('Bạn có chắc chắn muốn xoá TOÀN BỘ lời chúc trong sổ lưu bút không?')) {
                      set('wishes', [])
                      flash('✓ Đã xoá toàn bộ lời chúc')
                    }
                  }}
                >
                  🗑️ Xoá tất cả ({config.wishes.length})
                </button>
              )}
            </div>

            {(!config.wishes || config.wishes.length === 0) ? (
              <div className="cfg-empty-wishes">
                <p>Chưa có lời chúc nào từ khách mời.</p>
                <small>Khi khách ký tên gửi lời chúc trên web, danh sách sẽ hiển thị tại đây để bạn kiểm duyệt và quản lý.</small>
              </div>
            ) : (
              <div className="cfg-wishes-list">
                {config.wishes.map((w) => (
                  <div key={w.id} className="cfg-wish-item">
                    <div className="cfg-wish-item-head">
                      <div className="cfg-wish-author-info">
                        <strong>{w.name}</strong>
                        <span className="cfg-wish-relation">{w.relation}</span>
                        <span className="cfg-wish-time">• {w.time}</span>
                        <span className="cfg-wish-likes">❤️ {w.likes || 0}</span>
                      </div>
                      <button
                        type="button"
                        className="cfg-btn cfg-btn-danger-sm"
                        onClick={() => {
                          const remaining = config.wishes.filter((item) => item.id !== w.id)
                          set('wishes', remaining)
                          flash(`✓ Đã xoá lời chúc của "${w.name}"`)
                        }}
                        title="Xoá lời chúc này"
                      >
                        🗑️ Xoá
                      </button>
                    </div>
                    <p className="cfg-wish-item-msg">{w.message}</p>
                  </div>
                ))}
              </div>
            )}
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

            <h2 className="cfg-sub">Hình nền trang thiệp</h2>
            <p className="cfg-hint">
              Chọn một hình nền sẽ hiển thị mờ phía sau toàn bộ trang thiệp, tạo cảm giác sang trọng hơn.
              Nên dùng ảnh có tông màu nhẹ hoặc ảnh phong cảnh. Bỏ trống nếu không muốn dùng hình nền.
            </p>
            <ImageField
              label="Hình nền (khuyến nghị ≥ 1920px chiều rộng)"
              value={config.backgroundImage}
              onPick={(e) => pickImage(e, 'backgroundImage')}
              onClear={() => set('backgroundImage', '')}
            />
            {config.backgroundImage && (
              <div style={{
                marginTop: 12,
                borderRadius: 12,
                overflow: 'hidden',
                position: 'relative',
                height: 180,
              }}>
                <img
                  src={config.backgroundImage}
                  alt="Preview hình nền"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: 'blur(2px) brightness(0.9)',
                  }}
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(255,255,255,0.55)',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#333',
                  fontSize: 14,
                  fontWeight: 600,
                }}>
                  Preview hiệu ứng mờ — nội dung thiệp sẽ hiển thị phía trên
                </div>
              </div>
            )}
            {/* Cấu hình nhạc nền */}
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px dashed #e0d8dc' }}>
              <h3 style={{ fontSize: 18, color: '#e8175d', marginBottom: 6 }}>Nhạc Nền Đám Cưới</h3>
              <p className="cfg-hint" style={{ marginTop: 0 }}>
                Bài hát tự động phát khi khách mở thiệp. Mặc định là bài <strong>"Một Đời" (14 Casper &amp; Bon Nghiêm)</strong>. Bạn có thể tải tệp nhạc từ máy tính/điện thoại lên.
              </p>

              <div style={{
                marginTop: 12,
                padding: 14,
                borderRadius: 12,
                background: '#fff',
                border: '1px solid #eee',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>🎵</span>
                    <div>
                      <strong style={{ fontSize: 14, color: '#333' }}>
                        {config.musicUrl === '/mot-doi.mp3' || !config.musicUrl
                          ? 'Một Đời — 14 Casper & Bon Nghiêm (Mặc định)'
                          : config.musicUrl.startsWith('data:')
                          ? 'Tệp nhạc tải lên từ máy'
                          : 'Nhạc nền tùy chỉnh'}
                      </strong>
                      <p style={{ margin: 0, fontSize: 12, color: '#888', wordBreak: 'break-all' }}>
                        {config.musicUrl || '/mot-doi.mp3'}
                      </p>
                    </div>
                  </div>
                </div>

                <audio
                  key={config.musicUrl || '/mot-doi.mp3'}
                  src={config.musicUrl || '/mot-doi.mp3'}
                  controls
                  style={{ width: '100%', height: 38, marginTop: 4 }}
                />
              </div>

              {/* Nút bấm tải tệp từ máy / đặt lại / xóa */}
              <div className="cfg-row-actions" style={{ marginTop: 14 }}>
                <label className="cfg-btn primary" style={{ cursor: 'pointer' }}>
                  <span>📁 Chọn tệp MP3 từ máy</span>
                  <input
                    type="file"
                    accept="audio/mp3,audio/mpeg,audio/m4a,audio/wav,audio/*"
                    style={{ display: 'none' }}
                    onChange={pickAudio}
                  />
                </label>

                <button
                  type="button"
                  className="cfg-btn ghost"
                  onClick={() => {
                    set('musicUrl', '/mot-doi.mp3')
                    flash('✓ Đã đặt lại về bài "Một Đời"')
                  }}
                  title="Đặt lại bài Một Đời"
                >
                  ↺ Đặt lại: Một Đời
                </button>

                {config.musicUrl && config.musicUrl !== '/mot-doi.mp3' && (
                  <button
                    type="button"
                    className="cfg-btn ghost"
                    onClick={() => {
                      set('musicUrl', '')
                      flash('Đã tắt nhạc nền')
                    }}
                  >
                    ✕ Tắt nhạc
                  </button>
                )}
              </div>

              {/* Nhập link trực tiếp nếu có */}
              <label className="cfg-field" style={{ marginTop: 14 }}>
                <span>Hoặc nhập đường dẫn bài hát trực tiếp</span>
                <input
                  value={config.musicUrl ?? ''}
                  placeholder="/mot-doi.mp3 hoặc https://.../bai-hat.mp3"
                  onChange={(e) => set('musicUrl', e.target.value)}
                />
              </label>
            </div>
          </section>
        )}

        {tab === 'share' && (
          <>
            {/* Card 1: Link Chung Phân Biệt Nhà Gái / Nhà Trai / Cả 2 Bên */}
            <section className="cfg-card">
              <h2>Link thiệp chung (Gửi nhiều người)</h2>
              <p className="cfg-hint">
                Chọn đối tượng khách mời để lấy đúng link và nội dung tin nhắn phù hợp:
              </p>

              {/* Nút gạt chọn 3 loại link chung */}
              <div className="cfg-party-toggle-bar">
                <button
                  type="button"
                  className={`cfg-party-tab-btn ${commonLinkSide === 'bride' ? 'active' : ''}`}
                  onClick={() => setCommonLinkSide('bride')}
                >
                  <span>🌸 Khách Nhà Gái (Vu Quy)</span>
                </button>
                <button
                  type="button"
                  className={`cfg-party-tab-btn ${commonLinkSide === 'groom' ? 'active' : ''}`}
                  onClick={() => setCommonLinkSide('groom')}
                >
                  <span>🤵 Khách Nhà Trai (Tân Hôn)</span>
                </button>
                <button
                  type="button"
                  className={`cfg-party-tab-btn ${commonLinkSide === 'both' ? 'active' : ''}`}
                  onClick={() => setCommonLinkSide('both')}
                >
                  <span>💖 Cả Hai Bên (Lễ Cưới)</span>
                </button>
              </div>

              {/* Ghi chú trực quan cho link đang chọn */}
              <div style={{ marginBottom: 14, padding: '10px 14px', background: '#fdf7f9', borderRadius: 10, border: '1px solid #f5e1ea' }}>
                {commonLinkSide === 'bride' && (
                  <p className="cfg-hint" style={{ margin: 0, color: '#8a1d3f' }}>
                    🌸 <strong>Khách mở link này sẽ thấy:</strong> Tiêu đề <strong>{config.brideParty?.title || 'LỄ VU QUY'}</strong>, ngày {config.brideParty?.date || config.eventDate} lúc {config.brideParty?.time || '11:00'} và bản đồ tại {config.brideParty?.venueName || config.venueName}.
                  </p>
                )}
                {commonLinkSide === 'groom' && (
                  <p className="cfg-hint" style={{ margin: 0, color: '#1565c0' }}>
                    🤵 <strong>Khách mở link này sẽ thấy:</strong> Tiêu đề <strong>{config.groomParty?.title || 'LỄ TÂN HÔN'}</strong>, ngày {config.groomParty?.date || '03/05/2027'} lúc {config.groomParty?.time || '11:30'} và bản đồ tại {config.groomParty?.venueName || 'Tư gia Nhà Trai'}.
                  </p>
                )}
                {commonLinkSide === 'both' && (
                  <p className="cfg-hint" style={{ margin: 0, color: '#7b1fa2' }}>
                    💖 <strong>Khách mở link này sẽ thấy:</strong> Tiêu đề <strong>LỄ CƯỚI</strong> (không hiện Tân Hôn hay Vu Quy) và bao gồm thông tin địa điểm cả 2 nhà.
                  </p>
                )}
              </div>

              <label className="cfg-field">
                <span>
                  Đường dẫn thiệp ({commonLinkSide === 'bride' ? 'Nhà Gái' : commonLinkSide === 'groom' ? 'Nhà Trai' : 'Cả 2 bên'})
                </span>
                <input
                  readOnly
                  value={buildShareUrl(configId, '', commonLinkSide)}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
              </label>

              <div className="cfg-row-actions">
                <button
                  className="cfg-btn primary"
                  onClick={() => copyToClipboard(buildShareUrl(configId, '', commonLinkSide))}
                >
                  📋 Copy link {commonLinkSide === 'bride' ? 'Nhà Gái' : commonLinkSide === 'groom' ? 'Nhà Trai' : 'Cả 2 bên'}
                </button>

                <button
                  className="cfg-btn success-btn"
                  onClick={() => copyInvitationText('Quý Khách', 'Kính gửi', commonLinkSide)}
                >
                  💬 Copy tin nhắn Zalo / SMS
                </button>

                <button
                  className="cfg-btn ghost"
                  onClick={() => window.open(buildShareUrl(configId, '', commonLinkSide), '_blank')}
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

              {/* Mã thiệp & Cấu hình máy chủ */}
              <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid #eee' }}>
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
              </div>
            </section>

            {/* Card 2: Tạo Link Cá Nhân Hóa Từng Khách Mời (VIP) */}
            <section className="cfg-card cfg-custom-guest-card">
              <div className="cfg-card-header-row">
                <div>
                  <h2>💌 Tạo link riêng cho từng khách mời</h2>
                  <p className="cfg-hint">
                    Khi khách mở link riêng, thiệp cưới sẽ hiện đích danh tên khách: <strong>"Kính gửi: Anh Tuấn"</strong> trên phong bì hoàng gia 3D và thư mời!
                  </p>
                </div>
                <button
                  type="button"
                  className="cfg-btn ghost"
                  onClick={() => setShowBatchModal(!showBatchModal)}
                >
                  ⚡ {showBatchModal ? 'Đóng nhập nhanh' : 'Nhập nhanh nhiều khách'}
                </button>
              </div>

              {/* Form tạo nhanh 1 khách */}
              <div className="cfg-guest-creator-box">
                <div className="cfg-grid-3">
                  <div className="cfg-field">
                    <span>Xưng hô</span>
                    <select
                      value={salutationInput}
                      onChange={(e) => setSalutationInput(e.target.value)}
                    >
                      <option value="Kính gửi">Kính gửi (Lịch sự, trang trọng)</option>
                      <option value="Thân gửi">Thân gửi (Bạn bè thân thiết)</option>
                      <option value="Thân mời">Thân mời (Anh chị, bạn bè)</option>
                      <option value="Gửi tặng">Gửi tặng</option>
                    </select>
                  </div>

                  <div className="cfg-field">
                    <span>Tên khách mời *</span>
                    <input
                      value={guestNameInput}
                      placeholder="VD: Anh Tuấn, Chị Mai & Người Thương..."
                      onChange={(e) => setGuestNameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addCustomGuest(guestNameInput, salutationInput, guestSideInput)
                        }
                      }}
                    />
                  </div>

                  <div className="cfg-field">
                    <span>Mời tiệc bên nào</span>
                    <select
                      value={guestSideInput}
                      onChange={(e) => setGuestSideInput(e.target.value as 'bride' | 'groom' | 'both')}
                    >
                      <option value="bride">🌸 Nhà Gái (Lễ Vu Quy)</option>
                      <option value="groom">🤵 Nhà Trai (Lễ Tân Hôn)</option>
                      <option value="both">💖 Cả Hai Bên</option>
                    </select>
                  </div>
                </div>

                {/* Live Preview of Custom Link */}
                {guestNameInput.trim() && (
                  <div className="cfg-guest-preview-box">
                    <div className="preview-url-row">
                      <span className="preview-label">Link riêng:</span>
                      <code className="preview-url">
                        {buildShareUrl(configId, guestNameInput, guestSideInput, salutationInput)}
                      </code>
                    </div>

                    <div className="cfg-guest-creator-actions">
                      <button
                        type="button"
                        className="cfg-btn primary"
                        onClick={() =>
                          copyToClipboard(
                            buildShareUrl(configId, guestNameInput, guestSideInput, salutationInput)
                          )
                        }
                      >
                        📋 Copy link
                      </button>

                      <button
                        type="button"
                        className="cfg-btn success-btn"
                        onClick={() =>
                          copyInvitationText(guestNameInput, salutationInput, guestSideInput)
                        }
                      >
                        💬 Copy tin nhắn Zalo / SMS
                      </button>

                      <button
                        type="button"
                        className="cfg-btn ghost"
                        onClick={() =>
                          window.open(
                            buildShareUrl(configId, guestNameInput, guestSideInput, salutationInput),
                            '_blank'
                          )
                        }
                      >
                        👁️ Xem thử
                      </button>

                      <button
                        type="button"
                        className="cfg-btn ghost"
                        onClick={() =>
                          addCustomGuest(guestNameInput, salutationInput, guestSideInput)
                        }
                      >
                        ➕ Lưu vào danh sách
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Hộp nhập nhanh hàng loạt (Batch input) */}
              {showBatchModal && (
                <div className="cfg-batch-box">
                  <h4>⚡ Nhập nhanh danh sách nhiều khách (Mỗi khách 1 dòng)</h4>
                  <div className="cfg-field" style={{ marginBottom: 10 }}>
                    <span>Chọn tiệc cho danh sách này:</span>
                    <select
                      value={batchSideInput}
                      onChange={(e) => setBatchSideInput(e.target.value as 'bride' | 'groom' | 'both')}
                    >
                      <option value="bride">🌸 Khách Nhà Gái (Lễ Vu Quy)</option>
                      <option value="groom">🤵 Khách Nhà Trai (Lễ Tân Hôn)</option>
                      <option value="both">💖 Cả Hai Bên</option>
                    </select>
                  </div>
                  <p className="cfg-hint">
                    Bạn có thể copy từ file Excel hoặc ghi chú rồi dán vào đây:
                  </p>
                  <textarea
                    rows={5}
                    value={batchGuestsInput}
                    onChange={(e) => setBatchGuestsInput(e.target.value)}
                    placeholder={'Anh Hải\nChị Thảo & Bạn\nGia Đình Bác Tư\nBạn Hùng Đại Học...'}
                  />
                  <div className="cfg-row-actions" style={{ marginTop: 10 }}>
                    <button
                      type="button"
                      className="cfg-btn primary"
                      onClick={handleAddBatchGuests}
                    >
                      ✓ Tạo link cho tất cả khách này
                    </button>
                    <button
                      type="button"
                      className="cfg-btn ghost"
                      onClick={() => setShowBatchModal(false)}
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}

              {/* Bảng Danh Sách Khách Mời Đã Lưu */}
              <div className="cfg-guest-list-wrap">
                <div className="cfg-card-header-row" style={{ marginTop: 24, marginBottom: 14 }}>
                  <h3>
                    👥 Danh sách khách mời đã tạo ({config.customGuests?.length || 0})
                  </h3>

                  {(config.customGuests && config.customGuests.length > 0) && (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="🔍 Tìm tên khách..."
                        value={guestSearch}
                        onChange={(e) => setGuestSearch(e.target.value)}
                        style={{ padding: '6px 12px', fontSize: 13, borderRadius: 8, border: '1px solid #ccc' }}
                      />
                      <button
                        type="button"
                        className="cfg-btn cfg-btn-danger-sm"
                        onClick={() => {
                          if (window.confirm('Bạn có chắc muốn xoá toàn bộ danh sách khách mời?')) {
                            set('customGuests', [])
                            flash('✓ Đã xoá toàn bộ danh sách khách')
                          }
                        }}
                      >
                        Xoá tất cả
                      </button>
                    </div>
                  )}
                </div>

                {(!config.customGuests || config.customGuests.length === 0) ? (
                  <div className="cfg-empty-wishes">
                    <p>Chưa có khách mời nào trong danh sách lưu sẵn.</p>
                    <small>Bạn có thể nhập tên khách ở trên để tạo link và bấm "Lưu vào danh sách" để gửi dần.</small>
                  </div>
                ) : (
                  <div className="cfg-guest-items-grid">
                    {config.customGuests
                      .filter((g) =>
                        !guestSearch ||
                        g.name.toLowerCase().includes(guestSearch.toLowerCase())
                      )
                      .map((g) => {
                        const guestUrl = buildShareUrl(configId, g.name, g.side, g.salutation)
                        return (
                          <div key={g.id} className="cfg-guest-card-item">
                            <div className="cfg-guest-card-header">
                              <div>
                                <span className="cfg-guest-salutation">{g.salutation || 'Kính gửi'}</span>
                                <strong className="cfg-guest-name">{g.name}</strong>
                                <span
                                  className={`cfg-guest-side-badge ${
                                    g.side === 'groom' ? 'side-groom' : g.side === 'both' ? 'side-both' : 'side-bride'
                                  }`}
                                >
                                  {g.side === 'groom'
                                    ? '🤵 Nhà Trai'
                                    : g.side === 'both'
                                    ? '💖 Cả 2 bên'
                                    : '🌸 Nhà Gái'}
                                </span>
                              </div>
                              <button
                                type="button"
                                className="cfg-btn cfg-btn-danger-sm"
                                onClick={() => removeCustomGuest(g.id)}
                                title="Xoá khách này khỏi danh sách"
                              >
                                ✕
                              </button>
                            </div>

                            <div className="cfg-guest-link-field">
                              <input
                                readOnly
                                value={guestUrl}
                                onClick={(e) => (e.target as HTMLInputElement).select()}
                              />
                            </div>

                            <div className="cfg-guest-card-actions">
                              <button
                                type="button"
                                className="cfg-btn primary"
                                style={{ padding: '6px 12px', fontSize: 12.5 }}
                                onClick={() => copyToClipboard(guestUrl)}
                              >
                                📋 Copy Link
                              </button>

                              <button
                                type="button"
                                className="cfg-btn success-btn"
                                style={{ padding: '6px 12px', fontSize: 12.5 }}
                                onClick={() => copyInvitationText(g.name, g.salutation, g.side)}
                              >
                                💬 Copy Lời Mời
                              </button>

                              <button
                                type="button"
                                className="cfg-btn ghost"
                                style={{ padding: '6px 12px', fontSize: 12.5 }}
                                onClick={() => window.open(guestUrl, '_blank')}
                              >
                                👁️ Mở
                              </button>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
              </div>
            </section>

            {/* Hướng dẫn cấu hình Vercel */}
            <div className="cfg-note" style={{ marginTop: 24 }}>
              <strong>Lưu ý đồng bộ Vercel Blob</strong>
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
          </>
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

function toInputDateFormat(dmyStr: string): string {
  if (!dmyStr) return ''
  const parts = dmyStr.trim().split('/')
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0')
    const month = parts[1].padStart(2, '0')
    const year = parts[2]
    if (year.length === 4) {
      return `${year}-${month}-${day}`
    }
  }
  return ''
}

function fromInputDateFormat(ymdStr: string): string {
  if (!ymdStr) return ''
  const parts = ymdStr.trim().split('-')
  if (parts.length === 3) {
    const year = parts[0]
    const month = parts[1]
    const day = parts[2]
    return `${day}/${month}/${year}`
  }
  return ymdStr
}

function getVietnameseWeekday(dateStr: string): string {
  let date: Date | null = null
  if (dateStr.includes('/')) {
    const [d, m, y] = dateStr.split('/').map(Number)
    date = new Date(y, m - 1, d)
  } else if (dateStr.includes('-')) {
    const [y, m, d] = dateStr.split('-').map(Number)
    date = new Date(y, m - 1, d)
  }
  if (!date || isNaN(date.getTime())) return ''
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
  return days[date.getDay()]
}

function DatePickerField({
  label,
  value,
  onChange,
  onWeekdayChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (val: string) => void
  onWeekdayChange?: (weekday: string) => void
  placeholder?: string
}) {
  return (
    <label className="cfg-field cfg-date-picker-field">
      <span>{label}</span>
      <div className="cfg-date-picker-group">
        <input
          type="text"
          value={value}
          placeholder={placeholder || 'DD/MM/YYYY'}
          onChange={(e) => onChange(e.target.value)}
          className="cfg-date-text-input"
        />
        <div className="cfg-calendar-btn-wrap">
          <div className="cfg-calendar-trigger-btn">
            <span>📅</span>
            <span>Mở lịch</span>
          </div>
          <input
            type="date"
            className="cfg-hidden-date-picker"
            value={toInputDateFormat(value)}
            onChange={(e) => {
              if (e.target.value) {
                const dmy = fromInputDateFormat(e.target.value)
                onChange(dmy)
                if (onWeekdayChange) {
                  const wd = getVietnameseWeekday(e.target.value)
                  if (wd) onWeekdayChange(wd)
                }
              }
            }}
            title="Bấm để mở lịch chọn ngày"
          />
        </div>
      </div>
    </label>
  )
}


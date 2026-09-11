import { useEffect, useState } from 'react'
import { useConfigStore } from '../store'

const SECTIONS = [
  { id: 'home', label: 'Trang Chủ', icon: '🏠' },
  { id: 'couple', label: 'Cô Dâu & Chú Rể', icon: '💕' },
  { id: 'invitation', label: 'Thiệp Mời', icon: '💌' },
  { id: 'venue', label: 'Địa Điểm', icon: '📍' },
  { id: 'album', label: 'Album Ảnh', icon: '📸' },
  { id: 'rsvp', label: 'Xác Nhận', icon: '✉️' },
]

export default function Nav() {
  const { config } = useConfigStore()
  const [active, setActive] = useState('home')
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Derive initials, e.g., "T" from "Quốc Thịnh" & "N" from "Giai Nhân"
  const groomInitial = config.groomName ? config.groomName.trim().slice(-1).toUpperCase() : 'T'
  const brideInitial = config.brideName ? config.brideName.trim().slice(-1).toUpperCase() : 'N'
  const monogram = `${groomInitial} ♡ ${brideInitial}`

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: '-30% 0px -40% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    )

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const go = (id: string) => {
    setIsOpen(false)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <>
      {/* Top Navbar */}
      <header className={`site-nav-header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          {/* Couple Monogram Badge */}
          <button 
            type="button" 
            className="nav-monogram" 
            onClick={() => go('home')}
            aria-label="Về đầu trang"
          >
            <span className="monogram-ring" />
            <span className="monogram-text">{monogram}</span>
          </button>

          {/* Desktop Nav Pills */}
          <nav className="nav-desktop" aria-label="Menu chính">
            <div className="nav-inner">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`nav-link ${active === s.id ? 'active' : ''}`}
                  onClick={() => go(s.id)}
                >
                  <span className="nav-link-icon">{s.icon}</span>
                  <span className="nav-link-text">{s.label}</span>
                </button>
              ))}
            </div>
          </nav>

          {/* Mobile Actions: RSVP quick button + Hamburger */}
          <div className="nav-mobile-actions">
            <button
              type="button"
              className="mobile-rsvp-pill"
              onClick={() => go('rsvp')}
            >
              ✉️ Xác Nhận
            </button>

            <button
              type="button"
              className={`nav-toggle ${isOpen ? 'open' : ''}`}
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? 'Đóng menu' : 'Mở menu'}
              aria-expanded={isOpen}
            >
              <span className="hamburger-box">
                <span className="hamburger-inner" />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div 
          className="nav-backdrop fade-in" 
          onClick={() => setIsOpen(false)}
          aria-hidden="true" 
        />
      )}

      {/* Mobile Menu Drawer */}
      <div className={`nav-drawer ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen}>
        <div className="drawer-header">
          <div className="drawer-monogram">
            <span className="drawer-monogram-text">{monogram}</span>
          </div>
          <p className="drawer-couple-names">
            {config.groomName} &amp; {config.brideName}
          </p>
          <div className="drawer-floral-divider">❀ ─── ❦ ─── ❀</div>
        </div>

        <nav className="drawer-nav">
          {SECTIONS.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              className={`drawer-link ${active === s.id ? 'active' : ''}`}
              style={{ animationDelay: `${idx * 50}ms` }}
              onClick={() => go(s.id)}
            >
              <span className="drawer-link-icon">{s.icon}</span>
              <span className="drawer-link-label">{s.label}</span>
              {active === s.id && <span className="drawer-active-dot" />}
            </button>
          ))}
        </nav>

        <div className="drawer-footer">
          <p className="drawer-date">🗓️ {config.eventWeekday}, {config.eventDate}</p>
          <button 
            type="button" 
            className="drawer-close-btn" 
            onClick={() => setIsOpen(false)}
          >
            ✕ Đóng Menu
          </button>
        </div>
      </div>
    </>
  )
}

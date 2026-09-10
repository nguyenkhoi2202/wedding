import { useEffect, useState } from 'react'

const SECTIONS = [
  { id: 'home', label: '🏠 Trang Chủ' },
  { id: 'couple', label: '💕 Cô Dâu Chú Rể' },
  { id: 'invitation', label: '📅 Thiệp Mời' },
  { id: 'venue', label: '📍 Địa Điểm' },
  { id: 'album', label: '📸 Hình Cưới' },
  { id: 'rsvp', label: '✉️ Xác Nhận' },
]

export default function Nav() {
  const [active, setActive] = useState('home')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] }
    )

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  const go = (id: string) => {
    setIsOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <button 
        className={`nav-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Navigation"
      >
        <span className="hamburger"></span>
      </button>

      <nav className={`nav ${isOpen ? 'nav-open' : ''}`}>
        <div className="nav-inner">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              className={`nav-link ${active === s.id ? 'active' : ''}`}
              onClick={() => go(s.id)}
            >
              {s.label}
              {active === s.id && <span className="active-dot" />}
            </button>
          ))}
        </div>
      </nav>
      {isOpen && <div className="nav-backdrop" onClick={() => setIsOpen(false)} />}
    </>
  )
}

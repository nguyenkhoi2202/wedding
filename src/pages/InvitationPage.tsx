import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Nav from '../components/Nav'
import Hero from '../sections/Hero'
import Couple from '../sections/Couple'
import Invitation from '../sections/Invitation'
import Venue from '../sections/Venue'
import Album from '../sections/Album'
import Rsvp from '../sections/Rsvp'
import { useConfigStore } from '../store'
import { useReveal } from '../hooks/useReveal'
import { readConfigFromUrl } from '../shareLink'

import '../styles/layout.css'
import '../styles/hero.css'
import '../styles/couple.css'
import '../styles/invitation.css'
import '../styles/venue.css'
import '../styles/album.css'
import '../styles/rsvp.css'

export default function InvitationPage() {
  const { config, replaceConfig } = useConfigStore()

  useEffect(() => {
    const fromUrl = readConfigFromUrl()
    if (fromUrl) replaceConfig({ ...config, ...fromUrl })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useReveal([config])

  return (
    <>
      <style>{`:root{--accent:${config.accentColor};--bg:${config.backgroundColor};}`}</style>
      <Nav />
      <Hero />
      <Couple />
      <Invitation />
      <Venue />
      <Album />
      <Rsvp />

      <div className="fab-stack">
        <Link to="/config" className="fab accent" title="Cài đặt">
          ⚙️
        </Link>
        <button
          className="fab"
          title="Lên đầu trang"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          ⬆️
        </button>
      </div>
    </>
  )
}

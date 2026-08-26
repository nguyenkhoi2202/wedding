import { useSearchParams } from 'react-router-dom'
import Nav from '../components/Nav'
import Hero from '../sections/Hero'
import Couple from '../sections/Couple'
import Invitation from '../sections/Invitation'
import Venue from '../sections/Venue'
import Album from '../sections/Album'
import Rsvp from '../sections/Rsvp'
import { useConfigStore } from '../store'
import { useReveal } from '../hooks/useReveal'
import { isSharedMode } from '../shareLink'

import '../styles/layout.css'
import '../styles/hero.css'
import '../styles/couple.css'
import '../styles/invitation.css'
import '../styles/venue.css'
import '../styles/album.css'
import '../styles/rsvp.css'

export default function InvitationPage() {
  const { config } = useConfigStore()
  const [searchParams] = useSearchParams()
  const isPreview = searchParams.has('preview')
  const isShared = isSharedMode()

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

      {!isPreview && !isShared && (
        <div className="fab-stack">
          <button
            className="fab"
            title="Lên đầu trang"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            ⬆️
          </button>
        </div>
      )}
      {!isPreview && isShared && (
        <div className="fab-stack">
          <button
            className="fab"
            title="Chế độ xem"
            disabled
            style={{ opacity: 0.6, cursor: 'not-allowed' }}
          >
            👁️
          </button>
          <button
            className="fab"
            title="Lên đầu trang"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            ⬆️
          </button>
        </div>
      )}
      {isPreview && (
        <button
          className="fab"
          title="Lên đầu trang"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{ right: '20px' }}
        >
          ⬆️
        </button>
      )}
    </>
  )
}

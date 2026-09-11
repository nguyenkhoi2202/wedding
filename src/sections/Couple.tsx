import { useConfigStore } from '../store'

function capitalizeWords(str: string): string {
  return str
    .split('\n')
    .map((line) =>
      line
        .split(' ')
        .map((word) => {
          if (!word) return ''
          return word.charAt(0).toLocaleUpperCase('vi') + word.slice(1)
        })
        .join(' ')
    )
    .join('\n')
}

export default function Couple() {
  const { config } = useConfigStore()

  return (
    <section id="couple" className="section couple-section">
      <div className="section-head reveal">
        <p className="section-script-subtitle">The Happy Couple</p>
        <h2>Cô Dâu &amp; Chú Rể</h2>
        <div className="heart-divider">
          <span className="line" />
          <span className="heart">❦</span>
          <span className="line" />
        </div>
        <p className="section-description">
          Hân hoan giới thiệu hai nhân vật chính trong ngày vui trọng đại của gia đình chúng tôi.
        </p>
      </div>

      <div className="couple-grid">
        {/* Groom Card */}
        <article className="couple-card groom-card reveal fade-slide-left">
          <div className="couple-photo-wrapper">
            <div className="couple-photo groom">
              {config.groomImage ? (
                <img src={config.groomImage} alt={config.groomFullName} loading="lazy" />
              ) : (
                <span className="photo-placeholder">🤵</span>
              )}
            </div>
            <div className="photo-flourish" />
          </div>

          <div className="couple-role groom-role">
            <span>CHÚ RỂ</span>
          </div>

          <h3 className="couple-name">{config.groomFullName}</h3>

          <div className="couple-parents">
            <p className="order-text">{config.groomOrder}</p>
            <p className="parent-names">
              Ông <strong>{config.groomFather}</strong>
              <br />
              Bà <strong>{config.groomMother}</strong>
            </p>
            <p className="hometown-badge">
              <span>📍 {config.groomHometown}</span>
            </p>
          </div>
        </article>

        {/* Center Connection Ornament */}
        <div className="couple-link reveal fade-scale" aria-hidden="true">
          <div className="couple-link-line" />
          <div className="couple-link-badge heart pulse">
            <span>💗</span>
          </div>
          <div className="couple-link-line" />
        </div>

        {/* Bride Card */}
        <article className="couple-card bride-card reveal fade-slide-right">
          <div className="couple-photo-wrapper">
            <div className="couple-photo bride">
              {config.brideImage ? (
                <img src={config.brideImage} alt={config.brideFullName} loading="lazy" />
              ) : (
                <span className="photo-placeholder">👰</span>
              )}
            </div>
            <div className="photo-flourish" />
          </div>

          <div className="couple-role bride-role">
            <span>CÔ DÂU</span>
          </div>

          <h3 className="couple-name">{config.brideFullName}</h3>

          <div className="couple-parents">
            <p className="order-text">{config.brideOrder}</p>
            <p className="parent-names">
              Ông <strong>{config.brideFather}</strong>
              <br />
              Bà <strong>{config.brideMother}</strong>
            </p>
            <p className="hometown-badge">
              <span>📍 {config.brideHometown}</span>
            </p>
          </div>
        </article>
      </div>

      {/* Love Quote Card */}
      {config.coupleQuote && (
        <blockquote className="couple-quote card reveal">
          <div className="quote-flourish-corner tl">❀</div>
          <div className="quote-flourish-corner tr">❀</div>
          <div className="quote-flourish-corner bl">❀</div>
          <div className="quote-flourish-corner br">❀</div>

          <div className="quote-ornament top" />
          <div className="quote-lines">
            {capitalizeWords(config.coupleQuote).split('\n').map((line, i) => (
              <p key={i} className="quote-text-line">
                {line}
              </p>
            ))}
          </div>
          <div className="quote-ornament bottom" />
        </blockquote>
      )}
    </section>
  )
}

import { useConfigStore } from '../store'

export default function Couple() {
  const { config } = useConfigStore()

  return (
    <section id="couple" className="section">
      <div className="section-head reveal">
        <h2>Cô Dâu &amp; Chú Rể</h2>
        <div className="heart-divider">
          <span className="line"></span>
          <span className="heart">❦</span>
          <span className="line"></span>
        </div>
        <p>Hân hoan giới thiệu hai nhân vật chính trong ngày vui trọng đại của gia đình chúng tôi.</p>
      </div>

      <div className="couple-grid reveal">
        <article className="couple-card reveal fade-slide-left">
          <div className="couple-photo bride">
            {config.brideImage ? (
              <img src={config.brideImage} alt={config.brideFullName} />
            ) : (
              <span>👰</span>
            )}
            <div className="photo-flourish"></div>
          </div>
          <h3>{config.brideFullName}</h3>
          <p className="couple-role bride-role">{config.brideRole}</p>
          <p className="couple-parents">
            {config.brideOrder}
            <br />
            ông <strong>{config.brideFather}</strong> và bà{' '}
            <strong>{config.brideMother}</strong>,
            <br />
            hiện đang sinh sống tại {config.brideHometown}.
          </p>
        </article>

        <div className="couple-link reveal">
          <span className="couple-link-badge">👰</span>
          <span className="couple-link-badge heart pulse">💗</span>
          <span className="couple-link-badge">🤵</span>
        </div>

        <article className="couple-card reveal fade-slide-right">
          <div className="couple-photo groom">
            {config.groomImage ? (
              <img src={config.groomImage} alt={config.groomFullName} />
            ) : (
              <span>🤵</span>
            )}
            <div className="photo-flourish"></div>
          </div>
          <h3>{config.groomFullName}</h3>
          <p className="couple-role groom-role">{config.groomRole}</p>
          <p className="couple-parents">
            {config.groomOrder}
            <br />
            ông <strong>{config.groomFather}</strong> và bà{' '}
            <strong>{config.groomMother}</strong>,
            <br />
            hiện đang sinh sống tại {config.groomHometown}.
          </p>
        </article>
      </div>

      {config.coupleQuote && (
        <blockquote className="couple-quote card reveal quote-frame">
          <div className="quote-ornament top"></div>
          {config.coupleQuote.split('\n').map((line, i) => (
            <span key={i}>{line}</span>
          ))}
          <div className="quote-ornament bottom"></div>
        </blockquote>
      )}
    </section>
  )
}

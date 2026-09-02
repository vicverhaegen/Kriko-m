import Link from 'next/link'
import { getPublicCalendarEvents, getSettings, getSiteContent } from '@/lib/db'
import HeroCTA from '@/components/HeroCTA'
import UpcomingEvent from '@/components/EventDetailModal'
import EditableText from '@/components/editing/EditableText'
import EditableImage from '@/components/editing/EditableImage'
import { CalendarEvent } from '@/lib/types'

export default async function HomePage() {
  const [allEvents, settings, siteContent] = await Promise.all([
    getPublicCalendarEvents() as Promise<CalendarEvent[]>,
    getSettings(),
    getSiteContent(),
  ])

  const welcomeBlock = siteContent['home.welcome_title'] || siteContent['home.welcome'] || {}
  const joinBlock = siteContent['home.join_title'] || siteContent['home.join'] || {}

  const rawWelcomeTitle = welcomeBlock.title || 'Welkom bij Kriko\u2011M!'
  const welcomeTitle = typeof rawWelcomeTitle === 'string' ? rawWelcomeTitle.replace(/Kriko-M/gi, 'Kriko\u2011M') : rawWelcomeTitle
  const welcomeContent = welcomeBlock.content || 'Wat fijn dat je een kijkje komt nemen! Bij Kriko-M draait alles om avontuur, vriendschap en samen ontdekken. Elke week staat onze enthousiaste leidingsploeg klaar om onze leden een onvergetelijke tijd vol uitdagende spelen, bosrafels en fantastische herinneringen te bezorgen.'

  const joinTitle = joinBlock.title || 'Zin om mee te doen?'
  const joinContent = joinBlock.content || 'Wil je lid worden of kom je graag een keertje proberen? Neem een kijkje op onze inschrijvingspagina om je aan te melden! Benieuwd waar en wanneer jouw tak afspreekt? De maandelijkse planningen en verzamelplekken vind je overzichtelijk in onze Kriko Echo.'

  const homeLeidingFoto = welcomeBlock.image_url || siteContent['home.welcome.photo']?.image_url || settings?.home_leiding_foto || '/images/leiding_25-26.jpg'

  // Toon enkel aankomende activiteiten (vanaf vandaag), max. 3.
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const events = allEvents
    .filter((e: CalendarEvent) => (e.datum_tot || e.date) >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3)

  return (
    <>
      {/* 1. Hero */}
      <section className="hero" style={{ position: 'relative', overflow: 'hidden' }}>
        <EditableImage
          blockKey="home.hero.photo"
          page="home"
          section="hero"
          defaultSrc="/images/hero-nieuw.webp"
          alt="Scouts Kriko-M"
          fill
          priority
          uploadType="home-hero-foto"
          className="hero-img"
          imageStyle={{ objectFit: 'cover' }}
        />
        <div className="hero-overlay" style={{ zIndex: 2 }}>
          <div className="hero-text">
            <EditableText
              blockKey="home.hero.sub"
              page="home"
              section="hero"
              defaultValue="Scouts"
              as="span"
              className="hero-sub"
            />
            <EditableText
              blockKey="home.hero.title"
              page="home"
              section="hero"
              defaultValue="Kriko-M"
              as="span"
              className="hero-title"
            />
            <HeroCTA />
          </div>
        </div>
      </section>

      {/* 2. Welkom & Foto */}
      <section className="home-section home-welcome-section container" id="welkom">
        <div className="welcome-grid" style={{ alignItems: 'stretch' }}>
          
          {/* Linker kolom: Welkomsttekst */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <EditableText
              blockKey="home.welcome.title"
              page="home"
              section="welcome"
              field="title"
              defaultValue={welcomeTitle}
              as="h2"
              style={{
                fontSize: '2.4rem',
                marginBottom: 16,
                color: 'var(--color-primary-dark)',
                fontWeight: 800,
                lineHeight: 1.2,
                letterSpacing: '-0.5px'
              }}
            />

            <EditableText
              blockKey="home.welcome.content"
              page="home"
              section="welcome"
              field="content"
              defaultValue={welcomeContent}
              as="p"
              multiline
              style={{ marginBottom: 20, fontSize: '1.05rem', color: '#2B2B2B', lineHeight: 1.65, whiteSpace: 'pre-line' }}
            />

            <div>
              <EditableText
                blockKey="home.join.title"
                page="home"
                section="join"
                field="title"
                defaultValue={joinTitle}
                as="h3"
                style={{ fontSize: '1.2rem', color: 'var(--color-primary-dark)', fontWeight: 800, marginBottom: 6 }}
              />

              <EditableText
                blockKey="home.join.content"
                page="home"
                section="join"
                field="content"
                defaultValue={joinContent}
                as="p"
                multiline
                style={{ marginBottom: 20, fontSize: '1.05rem', color: '#2B2B2B', lineHeight: 1.65, whiteSpace: 'pre-line' }}
              />

              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <Link href="/inschrijven" className="btn btn-secondary" style={{ padding: '10px 20px', fontWeight: 700 }}>
                  <EditableText
                    blockKey="home.join.btn1_text"
                    page="home"
                    section="join"
                    defaultValue="Naar de Inschrijvingen"
                  />
                </Link>
                <Link href="/echos" className="btn btn-outline" style={{ padding: '10px 20px', fontWeight: 700 }}>
                  <EditableText
                    blockKey="home.join.btn2_text"
                    page="home"
                    section="join"
                    defaultValue="Bekijk de Kriko Echo"
                  />
                </Link>
              </div>
            </div>
          </div>

          {/* Rechter kolom: Foto */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EditableImage
              blockKey="home.welcome.photo"
              page="home"
              section="welcome"
              defaultSrc={homeLeidingFoto}
              alt="Scouts Kriko-M Leiding"
              width={800}
              height={533}
              uploadType="home-leiding-foto"
              imageStyle={{
                width: '100%',
                height: 'auto',
                borderRadius: 'var(--border-radius-lg)',
                boxShadow: 'var(--shadow-md)',
                border: '1px solid rgba(101, 11, 25, 0.12)',
                display: 'block'
              }}
            />
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* 3. Onze Takken */}
      <section className="home-section vic-takken-section">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <EditableText
            blockKey="home.takken.section_title"
            page="home"
            section="takken"
            defaultValue="Onze Takken"
            as="h2"
            className="page-header-title"
            style={{ margin: 0 }}
          />
        </div>
        <div className="vic-takken-grid">
          {[
            { slug: 'kapoenen',   label: 'Kapoenen' },
            { slug: 'welpen',     label: 'Welpen' },
            { slug: 'jonggivers', label: 'Jonggivers' },
            { slug: 'givers',     label: 'Givers' },
          ].map(({ slug, label }) => (
            <Link
              key={slug}
              href={`/takken/${slug}`}
              className={`vic-tak-card tak-${slug}`}
              style={{ backgroundImage: `url(/images/tak_${slug}.jpg)` }}
            >
              <EditableText
                blockKey={`takken.${slug}.label`}
                page="home"
                section="takken"
                defaultValue={label}
                as="span"
                className="vic-tak-name"
              />
            </Link>
          ))}
        </div>
      </section>

      <hr className="section-divider" />

      {/* 4. Aankomende Activiteiten */}
      <section className="home-section home-events-wrapper container">
        <div className="home-events-section">
          <div className="home-events-header">
            <h3 className="home-events-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg style={{ width: 28, height: 28, fill: 'none', stroke: 'currentColor' }} strokeWidth={2.2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <EditableText
                blockKey="home.events.title"
                page="home"
                section="events"
                defaultValue="Aankomende Activiteiten"
              />
            </h3>
            <Link href="/kalender" className="btn btn-outline" style={{ fontWeight: 700, padding: '9px 20px', fontSize: '0.92rem' }}>
              <EditableText
                blockKey="home.events.btn_text"
                page="home"
                section="events"
                defaultValue="Bekijk volledige kalender →"
              />
            </Link>
          </div>

          {events.length === 0 ? (
            <p className="cal-upcoming-empty" style={{ textAlign: 'center', padding: '30px 0' }}>
              <EditableText
                blockKey="home.events.empty"
                page="home"
                section="events"
                defaultValue="Er zijn momenteel geen geplande groepsactiviteiten."
              />
            </p>
          ) : (
            <div className="home-events-grid">
              {events.map((event: CalendarEvent) => (
                <UpcomingEvent
                  key={event.id}
                  event={event}
                  todayMs={today.getTime()}
                  showCountdown={false}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}

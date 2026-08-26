'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import CopyButton from '@/components/CopyButton'
import ProtectedEmail from '@/components/anti-scraping/ProtectedEmail'
import EditableText from '@/components/editing/EditableText'
import EditableImage from '@/components/editing/EditableImage'

interface InfoTabbedContentProps {
  email: string
  address: string
  siteContent?: Record<string, { title?: string; content?: string; image_url?: string }>
}

type TabType = 'praktisch' | 'takken' | 'uniform' | 'op-maat' | 'oudertak'

export default function InfoTabbedContent({ email, address: _address }: InfoTabbedContentProps) {
  const [activeTab, setActiveTab] = useState<TabType>('praktisch')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const tabParam = params.get('tab') as TabType | null
      if (tabParam && ['praktisch', 'takken', 'uniform', 'op-maat', 'oudertak'].includes(tabParam)) {
        setActiveTab(tabParam)
      } else if (window.location.hash) {
        const hash = window.location.hash.replace('#', '') as TabType
        if (['praktisch', 'takken', 'uniform', 'op-maat', 'oudertak'].includes(hash)) {
          setActiveTab(hash)
        }
      }
    }
  }, [])

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('tab', tab)
      window.history.replaceState({}, '', url.toString())
    }
  }

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'praktisch', label: 'Praktisch & Werking', icon: 'fa-compass' },
    { id: 'takken', label: 'Onze Takken', icon: 'fa-users' },
    { id: 'uniform', label: 'Uniform & Webshop', icon: 'fa-shirt' },
    { id: 'op-maat', label: 'Scouting op Maat', icon: 'fa-hand-holding-heart' },
    { id: 'oudertak', label: 'Oudertak', icon: 'fa-people-group' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Horizontal Navigation Tabs */}
      <div 
        className="info-tabs-nav-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 8,
          backgroundColor: 'var(--color-bg-white)',
          padding: 8,
          borderRadius: 'var(--border-radius-lg)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
          width: '100%',
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              type="button"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 16px',
                borderRadius: 'var(--border-radius-md)',
                border: 'none',
                backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--color-text-dark)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.95rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                outline: 'none',
                width: '100%',
              }}
            >
              <i className={`fa-solid ${tab.icon}`} style={{ color: isActive ? '#ffffff' : 'var(--color-secondary)' }}></i>
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content Cards */}
      <div className="info-tab-card-body" style={{ backgroundColor: 'var(--color-bg-white)', borderRadius: 'var(--border-radius-lg)', padding: 36, border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)', minHeight: 380 }}>
        
        {/* TAB 1: Praktisch & Werking */}
        {activeTab === 'praktisch' && (
          <div style={{ animation: 'fadeIn 0.25s ease', display: 'flex', flexDirection: 'column', gap: 24, fontSize: '1.05rem', lineHeight: 1.7, color: 'var(--color-text-dark)' }}>
            
            {/* Block 1.1: Welcome */}
            <div>
              <EditableText
                blockKey="info.welcome.title"
                page="info"
                section="praktisch"
                field="title"
                defaultValue="Welkom bij Scouts Kriko-M"
                as="h2"
                style={{ fontSize: '1.75rem', color: 'var(--color-primary-dark)', marginBottom: 12, fontWeight: 800 }}
              />

              <EditableText
                blockKey="info.welcome.content"
                page="info"
                section="praktisch"
                field="content"
                defaultValue="Wij zijn Scouts Kriko-M, een gezellige en betrokken scoutsgroep uit Sint-Niklaas voor jongens én meisjes. Onze enthousiaste leidingsploeg staat elke week klaar om van de zondag een onvergetelijke dag te maken: samen spelen, ravotten, uitdagingen aangaan en hechte vriendschappen opbouwen voor het leven!"
                as="p"
                multiline
                style={{ margin: '0 0 16px 0', whiteSpace: 'pre-line' }}
              />

              <EditableText
                blockKey="info.welcome.p2"
                page="info"
                section="praktisch"
                field="content"
                defaultValue="Naast onze wekelijkse activiteiten op zondag organiseren we doorheen het jaar ook heel wat gezellige evenementen voor de hele familie — zoals onze jaarlijkse barbecue, ouderavonden en feestelijke bijeenkomsten. Nieuwsgierig naar wat er op de planning staat? Alle evenementen en data kan je terugvinden op onze kalenderpagina."
                as="p"
                multiline
                style={{ margin: 0, whiteSpace: 'pre-line' }}
              />
            </div>

            {/* Block 1.2: Leeftijd */}
            <div>
              <EditableText
                blockKey="info.leeftijd.title"
                page="info"
                section="praktisch"
                field="title"
                defaultValue="Vanaf welke leeftijd?"
                as="h3"
                style={{ fontSize: '1.35rem', color: 'var(--color-primary-dark)', marginBottom: 10, fontWeight: 700 }}
              />
              <EditableText
                blockKey="info.leeftijd.content"
                page="info"
                section="praktisch"
                field="content"
                defaultValue="Iedereen die 6 jaar wordt vóór 1 januari van het lopende scoutsjaar of reeds in het eerste leerjaar zit, kan lid worden van onze scouts. Nieuwe leden mogen bovendien altijd 3 keer gratis komen proberen vooraleer ze definitief inschrijven!"
                as="p"
                multiline
                style={{ margin: 0, whiteSpace: 'pre-line' }}
              />
            </div>

            {/* Block 1.3: Waar vind je wat */}
            <div>
              <EditableText
                blockKey="info.waariswat.title"
                page="info"
                section="praktisch"
                field="title"
                defaultValue="Waar vind je wat?"
                as="h3"
                style={{ fontSize: '1.35rem', color: 'var(--color-primary-dark)', marginBottom: 10, fontWeight: 700 }}
              />

              <EditableText
                blockKey="info.waariswat.intro"
                page="info"
                section="praktisch"
                field="content"
                defaultValue="Omdat we alle praktische zaken al overzichtelijk elders op de website tonen, sturen we je graag door naar de juiste plek:"
                as="p"
                style={{ margin: '0 0 12px 0' }}
              />

              <ul style={{ margin: 0, paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li>
                  📅 <strong><Link href="/kalender" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Kalender</Link>:</strong>{' '}
                  <EditableText
                    blockKey="info.waariswat.kalender"
                    page="info"
                    section="praktisch"
                    defaultValue="Bekijk wanneer de vergaderingen vallen en wanneer onze familie-evenementen plaatsvinden."
                  />
                </li>
                <li>
                  📖 <strong><Link href="/echos" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Kriko Echo</Link>:</strong>{' '}
                  <EditableText
                    blockKey="info.waariswat.echo"
                    page="info"
                    section="praktisch"
                    defaultValue="Ons maandelijkse programmaboekje met het concrete programma en uren per tak."
                  />
                </li>
                <li>
                  ⚜️ <strong><button type="button" onClick={() => handleTabChange('takken')} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', textDecoration: 'underline', font: 'inherit', cursor: 'pointer', padding: 0 }}>Onze Takken</button>:</strong>{' '}
                  <EditableText
                    blockKey="info.waariswat.takken"
                    page="info"
                    section="praktisch"
                    defaultValue="Ontdek alle leeftijdsgroepen en hoe lang je in dezelfde tak blijft."
                  />
                </li>
                <li>
                  📝 <strong><Link href="/inschrijven" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Inschrijven &amp; Lidgeld</Link>:</strong>{' '}
                  <EditableText
                    blockKey="info.waariswat.inschrijven"
                    page="info"
                    section="praktisch"
                    defaultValue="Alle info over de inschrijvingsfiche, steekkaart en het jaarlijks lidgeld."
                  />
                </li>
                <li>
                  💚 <strong><button type="button" onClick={() => handleTabChange('op-maat')} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', textDecoration: 'underline', font: 'inherit', cursor: 'pointer', padding: 0 }}>Scouting op Maat</button>:</strong>{' '}
                  <EditableText
                    blockKey="info.waariswat.opmaat"
                    page="info"
                    section="praktisch"
                    defaultValue="Alles over verminderd lidgeld (€10), Fonds op Maat en kortingen via het ziekenfonds."
                  />
                </li>
                <li>
                  👔 <strong><button type="button" onClick={() => handleTabChange('uniform')} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', textDecoration: 'underline', font: 'inherit', cursor: 'pointer', padding: 0 }}>Uniform &amp; Webshop</button>:</strong>{' '}
                  <EditableText
                    blockKey="info.waariswat.uniform"
                    page="info"
                    section="praktisch"
                    defaultValue="Info over onze das, kledij en bestellen via de shop."
                  />
                </li>
                <li>
                  👨‍👩‍👧‍👦 <strong><button type="button" onClick={() => handleTabChange('oudertak')} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', textDecoration: 'underline', font: 'inherit', cursor: 'pointer', padding: 0 }}>Oudertak</button>:</strong>{' '}
                  <EditableText
                    blockKey="info.waariswat.oudertak"
                    page="info"
                    section="praktisch"
                    defaultValue="De kritische vriend van onze groep: hoe ouders en oud-leiding Kriko-M ondersteunen."
                  />
                </li>
              </ul>
            </div>

            {/* Block 1.4: Vragen */}
            <div>
              <EditableText
                blockKey="info.vragen.title"
                page="info"
                section="praktisch"
                field="title"
                defaultValue="Heb je nog vragen?"
                as="h3"
                style={{ fontSize: '1.35rem', color: 'var(--color-primary-dark)', marginBottom: 10, fontWeight: 700 }}
              />
              <EditableText
                blockKey="info.vragen.content"
                page="info"
                section="praktisch"
                field="content"
                defaultValue="Heb je specifieke vragen over onze scouts of wil je een keertje komen proberen? Neem dan gerust een kijkje op onze contactpagina om een berichtje te sturen of een van de leiding aan te spreken!"
                as="p"
                multiline
                style={{ margin: 0, whiteSpace: 'pre-line' }}
              />
            </div>

          </div>
        )}

        {/* TAB 2: Takken */}
        {activeTab === 'takken' && (
          <div style={{ animation: 'fadeIn 0.25s ease', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Block 2.1: Intro */}
            <div>
              <EditableText
                blockKey="info.takken.intro.title"
                page="info"
                section="takken"
                field="title"
                defaultValue="Takken, wat is dat?"
                as="h2"
                style={{ fontSize: '1.75rem', color: 'var(--color-primary-dark)', marginBottom: 12 }}
              />
              <EditableText
                blockKey="info.takken.intro.content"
                page="info"
                section="takken"
                field="content"
                defaultValue="Bij Scouts Kriko-M speel je niet in één grote groep, maar worden de leden opgedeeld volgens leeftijd. Dat noemen we takken. Zo sluiten de spelletjes, uitdagingen, technieken en kamplengte naadloos aan bij de leefwereld van elk kind."
                as="p"
                multiline
                style={{ fontSize: '1.05rem', lineHeight: 1.7, color: 'var(--color-text-dark)', margin: 0, whiteSpace: 'pre-line' }}
              />
            </div>

            {/* Block 2.2: Takduur */}
            <div style={{ backgroundColor: 'var(--color-bg-linen)', padding: '16px 20px', borderRadius: 'var(--border-radius-md)', borderLeft: '4px solid var(--color-secondary)', fontSize: '0.96rem', lineHeight: 1.6, color: 'var(--color-text-dark)' }}>
              <strong>
                <EditableText
                  blockKey="info.takken.duur.title"
                  page="info"
                  section="takken"
                  field="title"
                  defaultValue="Hoe lang zit je in een tak?"
                  as="span"
                />
              </strong>{' '}
              <EditableText
                blockKey="info.takken.duur.content"
                page="info"
                section="takken"
                field="content"
                defaultValue="Leden blijven in principe drie jaar bij elke tak (Welpen, Jonggivers en Givers). Uitzondering zijn onze allerjongste leden, de Kapoenen: in deze tak zit je twee jaar (1e & 2e leerjaar)."
                as="span"
              />
            </div>

            {/* Grid van 4 Takken Kaarten */}
            <div className="info-takken-grid info-two-col-grid">
              {[
                { slug: 'kapoenen', defaultName: 'Kapoenen', defaultAge: '6 tot 8 jaar (1e & 2e leerjaar)', color: 'var(--color-kapoenen, #eab308)', bgTint: 'rgba(234, 179, 8, 0.08)', border: 'rgba(234, 179, 8, 0.4)', defaultImg: '/images/tak_kapoenen.jpg', defaultKamp: '5 dagen kamp (in een gebouw)', defaultSfeer: 'Spel, fantasie & de allereerste scoutservaring.', defaultUitleg: 'Bij de kapoenen staat verbeelding en samen spelen centraal. Alles kan en niets moet! Van een zoektocht naar een verloren piratenschat tot knutselen of verkleden.' },
                { slug: 'welpen', defaultName: 'Welpen', defaultAge: '8 tot 11 jaar (3e, 4e & 5e leerjaar)', color: 'var(--color-welpen, #16a34a)', bgTint: 'rgba(22, 163, 74, 0.08)', border: 'rgba(22, 163, 74, 0.4)', defaultImg: '/images/tak_welpen.jpg', defaultKamp: '7 dagen kamp (in een gebouw)', defaultSfeer: 'Ravotten in het bos, nesten & scoutstechnieken.', defaultUitleg: 'Welpen duiken vol avontuur het bos in. Ze spelen in kleine groepjes (nesten) en leren samenwerken, geheime geheimtalen ontcijferen en bosspelen spelen.' },
                { slug: 'jonggivers', defaultName: 'Jonggivers', defaultAge: '11 tot 14 jaar (6e lj & 1e-2e middelbaar)', color: 'var(--color-jonggivers, #ea580c)', bgTint: 'rgba(234, 88, 12, 0.08)', border: 'rgba(234, 88, 12, 0.4)', defaultImg: '/images/tak_jonggivers.jpg', defaultKamp: '11 dagen tentenkamp', defaultSfeer: 'Sjorren, tenten opzetten & koken op houtvuur.', defaultUitleg: 'Bij de jonggivers begint het échte outdoor avontuur! Ze leren sjorren met palen en touw, koken maaltijden op hun eigen houtvuur en slapen in tenten.' },
                { slug: 'givers', defaultName: 'Givers', defaultAge: '14 tot 17 jaar (3e, 4e & 5e middelbaar)', color: 'var(--color-givers, #2563eb)', bgTint: 'rgba(37, 99, 235, 0.08)', border: 'rgba(37, 99, 235, 0.4)', defaultImg: '/images/tak_givers.jpg', defaultKamp: '11 dagen tentenkamp (1x/3j buitenlands kamp)', defaultSfeer: 'Zelfstandigheid, avontuur & hechte vriendschappen.', defaultUitleg: 'Givers krijgen de vrijheid om hun eigen programma mede te bepalen. Ze gaan uitdagende hikes aan, organiseren grote projecten en vormen een vriendengroep voor het leven.' },
              ].map((tak) => {
                return (
                  <div 
                    key={tak.slug}
                    style={{
                      backgroundColor: 'var(--color-bg-linen)',
                      borderRadius: 'var(--border-radius-lg)',
                      border: `2px solid ${tak.border}`,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: 'var(--shadow-sm)',
                      height: '100%',
                    }}
                  >
                    <div style={{ height: 160, position: 'relative', overflow: 'hidden', borderBottom: `2px solid ${tak.border}` }}>
                      <EditableImage
                        blockKey={`info.takken.${tak.slug}.photo`}
                        page="info"
                        section="takken"
                        defaultSrc={tak.defaultImg}
                        alt={`Illustratie ${tak.defaultName}`}
                        fill
                        badgePosition="top-left"
                        imageStyle={{ objectFit: 'cover', objectPosition: 'center' }}
                      />
                      <span 
                        style={{ 
                          position: 'absolute', top: 12, right: 12, backgroundColor: tak.color, color: '#ffffff', fontSize: '0.8rem', fontWeight: 800, padding: '5px 12px', borderRadius: 20, boxShadow: '0 2px 6px rgba(0,0,0,0.3)', whiteSpace: 'nowrap', zIndex: 10
                        }}
                      >
                        <EditableText
                          blockKey={`info.takken.${tak.slug}.age`}
                          page="info"
                          section="takken"
                          defaultValue={tak.defaultAge}
                        />
                      </span>
                    </div>

                    <div style={{ padding: 22, display: 'flex', flexDirection: 'column', flex: 1, gap: 12 }}>
                      <div>
                        <EditableText
                          blockKey={`info.takken.${tak.slug}.title`}
                          page="info"
                          section="takken"
                          field="title"
                          defaultValue={tak.defaultName}
                          as="h3"
                          style={{ fontSize: '1.45rem', color: tak.color, margin: '0 0 4px 0', fontWeight: 800 }}
                        />
                        <EditableText
                          blockKey={`info.takken.${tak.slug}.sfeer`}
                          page="info"
                          section="takken"
                          defaultValue={tak.defaultSfeer}
                          as="p"
                          style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-text-dark)', margin: 0 }}
                        />
                      </div>

                      <EditableText
                        blockKey={`info.takken.${tak.slug}.uitleg`}
                        page="info"
                        section="takken"
                        defaultValue={tak.defaultUitleg}
                        as="p"
                        multiline
                        style={{ fontSize: '0.94rem', lineHeight: 1.6, color: 'var(--color-text-dark)', margin: 0, whiteSpace: 'pre-line' }}
                      />

                      <div style={{ backgroundColor: tak.bgTint, padding: '10px 14px', borderRadius: 'var(--border-radius-md)', fontSize: '0.88rem', color: 'var(--color-primary-dark)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto' }}>
                        <span>
                          <strong>Zomerkamp:</strong>{' '}
                          <EditableText
                            blockKey={`info.takken.${tak.slug}.kamp`}
                            page="info"
                            section="takken"
                            defaultValue={tak.defaultKamp}
                          />
                        </span>
                      </div>

                      <Link 
                        href={`/takken/${tak.slug}`}
                        className="btn btn-outline"
                        style={{ fontSize: '0.88rem', fontWeight: 700, justifyContent: 'center', borderColor: tak.color, color: tak.color, marginTop: 4 }}
                      >
                        <EditableText
                          blockKey={`info.takken.${tak.slug}.btn_text`}
                          page="info"
                          section="takken"
                          defaultValue={`Meer over de ${tak.defaultName} »`}
                        />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* TAB 3: Uniform & Webshop */}
        {activeTab === 'uniform' && (
          <div style={{ animation: 'fadeIn 0.25s ease', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Block 3.1: Intro */}
            <div>
              <EditableText
                blockKey="info.uniform.intro.title"
                page="info"
                section="uniform"
                field="title"
                defaultValue="Uniform &amp; Aankoop"
                as="h2"
                style={{ fontSize: '1.75rem', color: 'var(--color-primary-dark)', margin: 0 }}
              />
              <EditableText
                blockKey="info.uniform.intro.content"
                page="info"
                section="uniform"
                field="content"
                defaultValue="Met het dragen van het uniform toon je dat je scout of gids bent. Het geeft leden en leiding de mogelijkheid om hun verbondenheid te tonen en laat toch ruimte voor een persoonlijke touch."
                as="p"
                multiline
                style={{ fontSize: '1.05rem', lineHeight: 1.7, color: 'var(--color-text-dark)', marginTop: 10, whiteSpace: 'pre-line' }}
              />
            </div>

            {/* Block 3.2: Details */}
            <div style={{ backgroundColor: 'var(--color-bg-linen)', padding: 24, borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <EditableText
                blockKey="info.uniform.details.title"
                page="info"
                section="uniform"
                field="title"
                defaultValue="Waaruit bestaat ons uniform?"
                as="h3"
                style={{ fontSize: '1.25rem', color: 'var(--color-primary-dark)', margin: 0, fontWeight: 700 }}
              />
              <EditableText
                blockKey="info.uniform.details.content"
                page="info"
                section="uniform"
                field="content"
                defaultValue="Het uniform bestaat voor iedereen vanaf de jonggivers uit 3 basisstukken: een das, een scoutshemd en een groene broek of rok. Kapoenen en welpen hebben geen voorgeschreven uniform: speelkleren die vuil mogen worden zijn ideaal om wekelijks in te ravotten. Wel vragen we om een das van onze groep aan te kopen."
                as="p"
                multiline
                style={{ fontSize: '1.02rem', lineHeight: 1.7, color: 'var(--color-text-dark)', margin: 0, whiteSpace: 'pre-line' }}
              />
            </div>

            <div className="info-two-col-grid">
              {/* Block 3.3: Webshop Card */}
              <div style={{ backgroundColor: 'var(--color-bg-linen)', padding: 22, borderRadius: 'var(--border-radius-md)', border: '2px solid var(--color-secondary)', display: 'flex', flexDirection: 'column', height: '100%' }}>
                <EditableText
                  blockKey="info.uniform.webshop.title"
                  page="info"
                  section="uniform"
                  field="title"
                  defaultValue="Onze Webshop"
                  as="h3"
                  style={{ fontSize: '1.15rem', color: 'var(--color-primary-dark)', marginBottom: 8 }}
                />
                <EditableText
                  blockKey="info.uniform.webshop.uitleg"
                  page="info"
                  section="uniform"
                  defaultValue="Bestel de officiële groepsdas (bordeaux-beige), Kriko T-shirts/truien en tweedehands uniformstukken rechtstreeks via onze webshop!"
                  as="p"
                  multiline
                  style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: 12, whiteSpace: 'pre-line' }}
                />
                <EditableText
                  blockKey="info.uniform.webshop.contact"
                  page="info"
                  section="uniform"
                  defaultValue="Vragen over bestellingen? Neem contact op met de webshopverantwoordelijke."
                  as="p"
                  style={{ fontSize: '0.85rem', color: 'var(--color-text-dark)', marginBottom: 16 }}
                />
                <div style={{ marginTop: 'auto' }}>
                  <Link href="/shop" className="btn btn-secondary" style={{ fontSize: '0.9rem', width: '100%', justifyContent: 'center' }}>
                    <EditableText
                      blockKey="info.uniform.webshop.btn_text"
                      page="info"
                      section="uniform"
                      defaultValue="Naar onze Webshop »"
                    />
                  </Link>
                </div>
              </div>

              {/* Block 3.4: Hopper Card */}
              <div style={{ backgroundColor: 'var(--color-bg-linen)', padding: 22, borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', height: '100%' }}>
                <EditableText
                  blockKey="info.uniform.hopper.title"
                  page="info"
                  section="uniform"
                  field="title"
                  defaultValue="Hopper Scoutswinkel"
                  as="h3"
                  style={{ fontSize: '1.15rem', color: 'var(--color-primary-dark)', marginBottom: 8 }}
                />
                <EditableText
                  blockKey="info.uniform.hopper.content"
                  page="info"
                  section="uniform"
                  field="content"
                  defaultValue="Het beige scoutshemd, de groene broek/rok en de kentekens koop je in een officiële Hopper winkel of online."
                  as="p"
                  multiline
                  style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: 14, whiteSpace: 'pre-line' }}
                />
                <div style={{ marginTop: 'auto' }}>
                  <a href="https://www.hopper.be/nl/shop" target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ fontSize: '0.85rem', width: '100%', justifyContent: 'center' }}>
                    <EditableText
                      blockKey="info.uniform.hopper.btn_text"
                      page="info"
                      section="uniform"
                      defaultValue="Bezoek Hopper.be »"
                    />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Scouting op Maat */}
        {activeTab === 'op-maat' && (
          <div style={{ animation: 'fadeIn 0.25s ease', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Box 4.1: Intro Quote */}
            <div>
              <EditableText
                blockKey="info.opmaat.intro.title"
                page="info"
                section="opmaat"
                field="title"
                defaultValue="Scouting op Maat"
                as="h2"
                style={{ fontSize: '1.75rem', color: 'var(--color-primary-dark)', margin: 0 }}
              />
              <div style={{ backgroundColor: 'var(--color-bg-linen)', padding: 24, borderRadius: 'var(--border-radius-md)', borderLeft: '5px solid var(--color-secondary)', marginTop: 14 }}>
                <EditableText
                  blockKey="info.opmaat.intro.quote"
                  page="info"
                  section="opmaat"
                  defaultValue="We weten dat de prijs van een jaar scouting voor uw kind(eren) een belangrijke hap uit uw gezinsbudget kan zijn. Maar we vinden ook dat dit voor niemand een reden mag zijn om thuis te blijven."
                  as="p"
                  multiline
                  style={{ fontSize: '1.08rem', lineHeight: 1.7, color: 'var(--color-text-dark)', margin: 0, fontStyle: 'italic', whiteSpace: 'pre-line' }}
                />
              </div>
            </div>

            {/* Box 4.2: Verminderd Lidgeld */}
            <div style={{ backgroundColor: 'var(--color-bg-linen)', padding: 28, borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border)' }}>
              <EditableText
                blockKey="info.opmaat.verminderd.title"
                page="info"
                section="opmaat"
                field="title"
                defaultValue="Verminderd Lidgeld"
                as="h3"
                style={{ fontSize: '1.3rem', color: 'var(--color-primary-dark)', marginBottom: 12 }}
              />
              <EditableText
                blockKey="info.opmaat.verminderd.content"
                page="info"
                section="opmaat"
                field="content"
                defaultValue="We vragen jaarlijks om voor elk kind lidgeld te betalen. Dankzij dit bedrag is uw zoon/dochter verzekerd tijdens onze scoutsactiviteiten. Een ander deel van dit bedrag gaat naar de algemene werkingskosten. We begrijpen dat dit lidgeld voor u misschien een groot bedrag is om te betalen. Wij hebben dan ook de mogelijkheid om hierop een korting te bieden, voor wie dit nodig heeft. Je betaalt dan €10 voor het gehele scoutsjaar (na 1 maart: €5). Spreek hiervoor simpelweg een (groeps)leid(st)er aan!"
                as="p"
                multiline
                style={{ fontSize: '1.02rem', lineHeight: 1.7, color: 'var(--color-text-dark)', margin: 0, whiteSpace: 'pre-line' }}
              />
            </div>

            {/* Box 4.3: Voordelen bij Ziekenfondsen */}
            <div style={{ backgroundColor: 'var(--color-bg-linen)', padding: 28, borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border)' }}>
              <EditableText
                blockKey="info.opmaat.ziekenfondsen.title"
                page="info"
                section="opmaat"
                field="title"
                defaultValue="Voordelen bij Ziekenfondsen"
                as="h3"
                style={{ fontSize: '1.3rem', color: 'var(--color-primary-dark)', marginBottom: 12 }}
              />
              <EditableText
                blockKey="info.opmaat.ziekenfondsen.content"
                page="info"
                section="opmaat"
                field="content"
                defaultValue="Mutualiteiten dragen vaak ook bij aan de kosten van vrijetijdsbesteding van uw kinderen. Welke voordelen dit precies zijn, hangt af van bij welk ziekenfonds u bent. Klik op het juiste ziekenfonds om meer informatie te verkrijgen omtrent terugbetalingen:"
                as="p"
                multiline
                style={{ fontSize: '1.02rem', lineHeight: 1.7, color: 'var(--color-text-dark)', marginBottom: 16, whiteSpace: 'pre-line' }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <a href="https://www.cm.be/diensten-en-voordelen" target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ fontSize: '0.9rem', padding: '8px 16px' }}>
                  CM &raquo;
                </a>
                <a href="https://www.helan.be/nl/" target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ fontSize: '0.9rem', padding: '8px 16px' }}>
                  Helan &raquo;
                </a>
                <a href="https://www.solidaris-vlaanderen.be" target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ fontSize: '0.9rem', padding: '8px 16px' }}>
                  Solidaris &raquo;
                </a>
                <a href="https://www.lm.be" target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ fontSize: '0.9rem', padding: '8px 16px' }}>
                  Liberale Mutualiteit (LM) &raquo;
                </a>
                <a href="https://www.vnz.be/voordelen" target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ fontSize: '0.9rem', padding: '8px 16px' }}>
                  VNZ &raquo;
                </a>
              </div>
            </div>

            {/* Box 4.4: Belastingsvoordelen */}
            <div style={{ backgroundColor: 'var(--color-bg-linen)', padding: 28, borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border)' }}>
              <EditableText
                blockKey="info.opmaat.belastingen.title"
                page="info"
                section="opmaat"
                field="title"
                defaultValue="Belastingsvoordelen"
                as="h3"
                style={{ fontSize: '1.3rem', color: 'var(--color-primary-dark)', marginBottom: 12 }}
              />
              <EditableText
                blockKey="info.opmaat.belastingen.content"
                page="info"
                section="opmaat"
                field="content"
                defaultValue="De kostprijs voor kampen en weekends van alle kinderen jonger dan 12 jaar kan door middel van een fiscaal attest afgetrokken worden van de belastingen. Hiervoor moet de groepsleiding het ‘Attest inzake uitgaven voor de opvang van kinderen’ invullen en aan u bezorgen. U moet dit formulier dan bij uw belastingaangifte voegen. Neem gerust contact op met de groepsleiding indien u interesse heeft."
                as="p"
                multiline
                style={{ fontSize: '1.02rem', lineHeight: 1.7, color: 'var(--color-text-dark)', margin: 0, whiteSpace: 'pre-line' }}
              />
            </div>

            {/* Box 4.5: Fonds op Maat */}
            <div style={{ backgroundColor: 'var(--color-bg-linen)', padding: 28, borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border)' }}>
              <EditableText
                blockKey="info.opmaat.fonds.title"
                page="info"
                section="opmaat"
                field="title"
                defaultValue="Fonds op Maat"
                as="h3"
                style={{ fontSize: '1.3rem', color: 'var(--color-primary-dark)', marginBottom: 12 }}
              />
              <EditableText
                blockKey="info.opmaat.fonds.content"
                page="info"
                section="opmaat"
                field="content"
                defaultValue="Voor activiteiten zoals uitstappen, weekends en kampen kan er gebruik gemaakt worden van Fonds op Maat. Het kostenplaatje wordt verdeeld volgens de derdenregel: 1/3 door het gezin, 1/3 door Scouts Kriko-M en 1/3 door Scouts & Gidsen Vlaanderen."
                as="p"
                multiline
                style={{ fontSize: '1.02rem', lineHeight: 1.7, color: 'var(--color-text-dark)', margin: 0, whiteSpace: 'pre-line' }}
              />
            </div>

            {/* Box 4.6: Uniform en Materiaal */}
            <div style={{ backgroundColor: 'var(--color-bg-linen)', padding: 28, borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border)' }}>
              <EditableText
                blockKey="info.opmaat.materiaal.title"
                page="info"
                section="opmaat"
                field="title"
                defaultValue="Uniform en Materiaal"
                as="h3"
                style={{ fontSize: '1.3rem', color: 'var(--color-primary-dark)', marginBottom: 12 }}
              />
              <EditableText
                blockKey="info.opmaat.materiaal.content"
                page="info"
                section="opmaat"
                field="content"
                defaultValue="Ook een uniform kan een grote uitgave zijn. Wij verwachten dan ook niet dat iedereen het volledige scoutsuniform aankoopt. Bij de kapoenen en welpen vragen we enkel een das van onze scouts aan te kopen. Vanaf de jonggivers vragen we ook een T-shirt aan te kopen. Deze kleren bieden we ook tweedehands aan."
                as="p"
                multiline
                style={{ fontSize: '1.02rem', lineHeight: 1.7, color: 'var(--color-text-dark)', margin: 0, whiteSpace: 'pre-line' }}
              />
            </div>

          </div>
        )}

        {/* TAB 5: Oudertak */}
        {activeTab === 'oudertak' && (
          <div style={{ animation: 'fadeIn 0.25s ease', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Box 5.1: Intro */}
            <div>
              <EditableText
                blockKey="info.oudertak.heading"
                page="info"
                section="oudertak"
                defaultValue="Oudertak"
                as="h2"
                style={{ fontSize: '1.75rem', color: 'var(--color-primary-dark)', marginBottom: 14, fontWeight: 800 }}
              />
              <div style={{ backgroundColor: 'var(--color-bg-linen)', padding: 24, borderRadius: 'var(--border-radius-md)', borderLeft: '5px solid var(--color-primary)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <EditableText
                  blockKey="info.oudertak.intro.title"
                  page="info"
                  section="oudertak"
                  field="title"
                  defaultValue="Wat is de Oudertak?"
                  as="h3"
                  style={{ fontSize: '1.3rem', color: 'var(--color-primary-dark)', margin: 0, fontWeight: 700 }}
                />
                <EditableText
                  blockKey="info.oudertak.intro.content"
                  page="info"
                  section="oudertak"
                  field="content"
                  defaultValue="De oudertak is de 'kritische vriend' van onze scoutsgroep. Ouders en oudleiding ondersteunen de leiding en groepsleiding, en zetten samen hun schouders onder Kriko-M. Gezamenlijk helpen ze evenementen op poten te zetten en zoeken ze naar oplossingen voor praktische zaken."
                  as="p"
                  multiline
                  style={{ fontSize: '1.02rem', lineHeight: 1.7, color: 'var(--color-text-dark)', margin: 0, whiteSpace: 'pre-line' }}
                />
              </div>
            </div>

            {/* Concrete taken grid */}
            <div>
              <EditableText
                blockKey="info.oudertak.taken_title"
                page="info"
                section="oudertak"
                defaultValue="Wat doet de Oudertak concreet?"
                as="h3"
                style={{ fontSize: '1.35rem', color: 'var(--color-primary-dark)', marginBottom: 16, fontWeight: 700 }}
              />
              
              <div className="info-oudertak-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                {[
                  { icon: 'fa-comments', defaultTitle: 'Vergaderingen & overleg', defaultDesc: 'Enkele keren per jaar samenkomen om terug te blikken op wat is gebeurd en vooruit te kijken.' },
                  { icon: 'fa-calendar-check', defaultTitle: 'Hulp bij evenementen', defaultDesc: 'Praktische voorbereiding en ondersteuning bij grote evenementen zoals onze BBQ, Souphé, Bidong.' },
                  { icon: 'fa-wrench', defaultTitle: 'Onderhoud van lokaal & terrein', defaultDesc: 'Actief mee de handen uit de mouwen steken voor het onderhoud van onze scoutslokalen.' },
                  { icon: 'fa-hammer', defaultTitle: 'Bouwen aan de toekomst', defaultDesc: 'Meedenken, plannen en meebouwen aan de vernieuwing van onze scoutslokalen (Ploegje Bouw).' },
                  { icon: 'fa-user-graduate', defaultTitle: 'Ouders in leiding (Examens)', defaultDesc: 'Om de studerende leiding te ontlasten tijdens de examenperiode, bokst de oudertak 1x per jaar een vergadering in elkaar!' },
                  { icon: 'fa-heart', defaultTitle: 'Een dikke merci!', defaultDesc: 'Zonder de inzet van al onze fantastische ouders zou Kriko-M niet staan waar het nu staat. Bedankt!' },
                ].map((item, idx) => (
                  <div key={idx} style={{ backgroundColor: 'var(--color-bg-linen)', padding: 20, borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border)', display: 'flex', gap: 16, alignItems: 'flex-start', height: '100%' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'rgba(26, 61, 42, 0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                      <i className={`fa-solid ${item.icon}`}></i>
                    </div>
                    <div style={{ flex: 1 }}>
                      <EditableText
                        blockKey={`info.oudertak.item_${idx}.title`}
                        page="info"
                        section="oudertak"
                        field="title"
                        defaultValue={item.defaultTitle}
                        as="h4"
                        style={{ fontSize: '1.05rem', color: 'var(--color-primary-dark)', margin: '0 0 6px 0', fontWeight: 700 }}
                      />
                      <EditableText
                        blockKey={`info.oudertak.item_${idx}.content`}
                        page="info"
                        section="oudertak"
                        field="content"
                        defaultValue={item.defaultDesc}
                        as="p"
                        multiline
                        style={{ fontSize: '0.94rem', lineHeight: 1.6, color: 'var(--color-text-dark)', margin: 0, whiteSpace: 'pre-line' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Call to action box */}
            <div className="info-cta-box" style={{ backgroundColor: 'var(--color-bg-linen)', padding: 24, borderRadius: 'var(--border-radius-md)', border: '2px solid var(--color-primary)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
              <EditableText
                blockKey="info.oudertak.cta.title"
                page="info"
                section="oudertak"
                field="title"
                defaultValue="Interesse om aan te sluiten of mee te helpen?"
                as="h3"
                style={{ fontSize: '1.25rem', color: 'var(--color-primary-dark)', margin: 0, fontWeight: 700 }}
              />
              <EditableText
                blockKey="info.oudertak.cta.content"
                page="info"
                section="oudertak"
                field="content"
                defaultValue="Wil je ook je steentje bijdragen aan de oudertak, helpen op evenementen of bij het onderhoud? Wij verwelkomen alle enthousiaste ouders en oud-leiding met open armen! Contacteer ons gerust via de groepsleiding:"
                as="p"
                multiline
                style={{ fontSize: '0.98rem', lineHeight: 1.6, color: 'var(--color-text-dark)', margin: 0, whiteSpace: 'pre-line' }}
              />
              <div style={{ marginTop: 4 }}>
                <ProtectedEmail email={email} showCopy className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.95rem' }} />
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}

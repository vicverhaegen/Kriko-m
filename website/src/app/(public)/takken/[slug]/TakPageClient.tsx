'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ProtectedPhone from '@/components/anti-scraping/ProtectedPhone'
import ProtectedEmail from '@/components/anti-scraping/ProtectedEmail'
import WhatsAppJoinButton from '@/components/WhatsAppJoinButton'
import EditableText from '@/components/editing/EditableText'
import EditableImage from '@/components/editing/EditableImage'
import EditTakContactModal from '@/components/editing/EditTakContactModal'
import { useEditMode } from '@/components/editing/EditContext'
import { Echo, Leader } from '@/lib/types'

const MONTHS_NL: Record<number, string> = {
  1:'januari',2:'februari',3:'maart',4:'april',5:'mei',6:'juni',
  7:'juli',8:'augustus',9:'september',10:'oktober',11:'november',12:'december',
}

const TAK_TRADITIES: Record<string, { wetTitle: string; wet: string; extraTitle?: string; extra?: string }> = {
  kapoenen: {
    wetTitle: 'De Kapoenenwet',
    wet: 'Ik ben een kapoen en ik probeer mijn best te doen.',
    extraTitle: 'Het Kapoenenlied',
    extra: '1, 2, 3, 4, kapoenen hebben veel plezier, 1, 2, 3, 4, kapoenenland is hier.\nEn zonder glimlach bij de hand gaat niemand naar kapoenenland.\n1, 2, 3, 4, kapoenenland is hier.',
  },
  welpen: {
    wetTitle: 'De Welpenwet',
    wet: 'Ik zeg wat ik voel, gruwel van vals gezwets,\nIk bereik eerlijk mijn doel, zonder dat ik iemand kwets.\nIk respecteer alles wat leeft en de Kracht die leven geeft.\nIk voel me één, met de wereld om me heen.\nHou niet van nep en deel alles wat ik heb.\nWant niemand is alles, niemand is niets, iedereen is altijd iets.',
    extraTitle: 'Het Welpenlied',
    extra: 'Ja dat zijn wij welpen blij die zingen samen in de rij\nwij spelen graag wij werken graag wij doen ons beste best, wij doen ons beste best.\nEen welpenbroek een bordeaux das, twee groene kousjes voor de was\neen bruine trui vergeet hem niet zo zingen wij graag ons lied.\nJa dat zijn wij welpen blij die zingen samen in de rij\nwij spelen graag wij werken graag wij doen ons beste best, wij doen ons beste best.\nEn dat we van de kriko zijn daar zijn we trots op groot en klein\nen komt ge ons tegen op een keer dan zijn we met eentje meer!\nJa dat zijn wij welpen blij die zingen samen in de rij\nwij spelen graag wij werken graag wij doen ons beste best, wij doen ons beste best.\nDe leiding doet de rest!',
  },
  jonggivers: {
    wetTitle: 'De Jonggiverwet',
    wet: 'Wij zijn jonggivers, wij wagen het avontuur.\nWij zijn eerlijk en delen onze vreugde.\nWij zijn goede kameraden voor elkaar.\nWij willen winnen maar kunnen verliezen.\nWij zijn tot luisteren bereid.\nOnze grootste vreugde is pleziertjes doen.\nWij leven graag in de natuur.\nDe leiding is onze gids.',
    extraTitle: 'Het (Jong)giverlied',
    extra: 'Een giver is een puber gezond en weltevree en weltevree.\nDie zingt met volle longen, met alle and\'ren mee.\nEn onze leuze klinkt "wees vaardig", want het leven is een strijd.\nEn we vinden het leven aardig, evenwel zijn wij bereid.\nNatuur is onze woning, zo gaan wij hand in hand, in hand, in hand\nten strijde voor de koning, voor vorst en vaderland.',
  },
  givers: {
    wetTitle: 'De Giverwet',
    wet: 'Een giver is oprecht, op zijn of haar woord kan men vertrouwen.\nEen giver is trouw aan de naaste en zichzelf.\nEen giver is vriendelijk en voorkomend, een broeder of zuster voor elke andere giver.\nEen giver is hoffelijk en weet dat de anderen op hem kunnen rekenen.\nEen giver is hulpvaardig en doet geen half werk.\nEen giver is sober en draagt zorg voor het goed van de ander.\nEen giver leeft met open ogen in de natuur.',
    extraTitle: 'Het Giverlied & Buitenlands Kamp',
    extra: 'Een giver is een puber gezond en weltevree en weltevree.\nDie zingt met volle longen, met alle and\'ren mee.\nEn onze leuze klinkt "wees vaardig", want het leven is een strijd.\nEn we vinden het leven aardig, evenwel zijn wij bereid.\nNatuur is onze woning, zo gaan wij hand in hand, in hand, in hand\nten strijde voor de koning, voor vorst en vaderland.',
  },
}

const FULL_TAK_DETAILS_TEXT: Record<string, { title: string; defaultContent: string }> = {
  kapoenen: {
    title: 'Wat is een kapoen?',
    defaultContent: `Kapoenen zijn onze jongste leden van 6 tot 8 jaar. Ze ontdekken al spelend wat het is om scout of gids te zijn.

Het leven van een kapoen is vol spel en fantasie. De leiding bedenkt spelen op maat van kapoenen. Wat vinden ze leuk en wat kunnen ze al op die leeftijd?

Samen met hun leeftijdsgenootjes leren ze al spelenderwijs omgaan met elkaar, leren ze winnen en verliezen. Maar we zetten hen ook aan om buiten te spelen en te genieten van de natuur in al zijn aspecten.

Op het einde van het jaar gaan ze begin augustus gedurende vijf dagen samen op kamp. Hier leven de kinderen samen in hun groep en leren met zichzelf en anderen omgaan.`,
  },
  welpen: {
    title: 'Wat is een welp?',
    defaultContent: `Een welp:
• is tussen 8 en 11 jaar,
• zit meestal in 3e, 4e of 5e leerjaar,
• groeit een millimeter per week,
• krijgt er op een jaar drie tanden bij,
• wordt elke week 5 gram zwaarder.

Welpen hebben veel energie. Hun enthousiasme kent soms geen grenzen. Ze bouwen graag kampen, verzinnen een geheime taal en halen kattenkwaad uit. Hun vrienden staan centraal.

Samen met hun vrienden ontdekken ze al ravottend hun eigen kunnen en ontwikkelen ze hun vaardigheden. De vaste gewoontes en gebruiken van onze groep versterken het gevoel van verbondenheid met elkaar.

Op het einde van het jaar gaan ze begin augustus gedurende zeven dagen samen op kamp. Hier leven de kinderen samen in hun groep en leren met zichzelf en anderen omgaan.`,
  },
  jonggivers: {
    title: 'Wat is een jonggiver?',
    defaultContent: `Jonggivers zijn tussen 11 en 13 jaar oud.

Jonggivers houden van avontuur en steken graag de handen uit de mouwen. Ze vinden het leuk om inspraak te hebben en gaan graag nieuwe uitdagingen aan: vlottentocht, koken op houtvuur, slapen in patrouilletenten. Jonggivers leren samenwerken, engagement tonen en zich inzetten voor anderen. Zo ontdekken ze stilaan wat scouting echt inhoudt en leggen hun belofte met trots af.

Jonggivers zitten op de wip tussen kind en puber. Hun leefwereld verandert razendsnel en wordt plots veel complexer. Al die veranderingen zijn soms overweldigend.

Op geen enkele leeftijd verschillen kinderen zo fel van elkaar als bij de jonggivers. Bovendien hebben ze vaak schrik om anders te zijn. Vrienden, hun plaats in de groep en de ontwikkeling van hun eigen identiteit en stijl zijn voor jonggivers belangrijk.

Op het einde van het jaar gaan ze begin augustus gedurende elf dagen samen op kamp. Hier leven de jongeren samen in hun groep, slapen in tenten en leren stilaan de vaardigheden en technieken van een echte scout.`,
  },
  givers: {
    title: 'Wat is een giver?',
    defaultContent: `De givers zijn de oudste leden van onze scouts en zijn 14 tot 17 jaar oud. Zelf vinden ze hun eigen leefwereld vaak nogal verwarrend, verrassend, moeilijk te vatten… en dat is meteen ook één van de kenmerken van deze jongeren.

Als leiding proberen we toegang te krijgen tot hun leefwereld. En hen zo bij te staan tijdens deze soms moeilijke maar belangrijke periode in hun ontwikkeling tot volwassene.

Giver zijn houdt meer in dan enkel activiteiten op zondag, we gaan 1 keer in de drie jaar op buitenlands kamp, organiseren activiteiten om onze kas te spijzen, enz. maar zijn ook al mee verantwoordelijk voor de werking van onze scouts. Giverhulp wordt bijvoorbeeld verwacht op onze eetfestijnen. Maar giver zijn is vooral ook plezier maken met je vrienden, samen leuke ervaringen delen en groeien in de scouts.`,
  },
}

const TAK_UNIFORM: Record<string, string> = {
  kapoenen: 'Voor de kapoenen bestaat het uniform enkel uit een groepsdas (bordeaux-beige). Een T-shirt of trui van onze scouts is ook altijd leuk om te dragen!',
  welpen: 'Bij de welpen bestaat het uniform uit een groepsdas (bordeaux-beige). Een T-shirt of trui van Kriko-M is zeker een fijne extra!',
  jonggivers: 'Vanaf de jonggivers dragen we het echte scoutsuniform: een groepsdas (bordeaux-beige), een scoutshemd en een groene scoutsbroek of -rok.',
  givers: 'Bij de givers dragen we het volledige scoutsuniform: de groepsdas (bordeaux-beige), een scoutshemd en een groene scoutsbroek of -rok.',
}

interface Props {
  slug: string
  takName: string
  takDescription: string
  takEmail: string
  takWhatsapp: string
  takPhotoSrc: string | null
  leadersToDisplay: Leader[]
  recentEchos: Echo[]
  dark: string
  siteContent?: Record<string, { title?: string; content?: string; image_url?: string }>
}

export default function TakPageClient({
  slug,
  takName,
  takDescription: _takDescription,
  takEmail: initialTakEmail,
  takWhatsapp: initialTakWhatsapp,
  takPhotoSrc: initialTakPhotoSrc,
  leadersToDisplay: initialLeadersToDisplay,
  recentEchos,
  dark,
}: Props) {
  const router = useRouter()
  const { isEditMode } = useEditMode()

  const [leadersToDisplay, setLeadersToDisplay] = useState<Leader[]>(initialLeadersToDisplay)
  const [takPhotoSrc, setTakPhotoSrc] = useState<string | null>(initialTakPhotoSrc)
  const [takEmail, setTakEmail] = useState<string>(initialTakEmail)
  const [takWhatsapp, setTakWhatsapp] = useState<string>(initialTakWhatsapp)

  const [isContactModalOpen, setIsContactModalOpen] = useState(false)

  useEffect(() => {
    setLeadersToDisplay(initialLeadersToDisplay)
  }, [initialLeadersToDisplay])

  useEffect(() => {
    setTakPhotoSrc(initialTakPhotoSrc)
  }, [initialTakPhotoSrc])

  useEffect(() => {
    setTakEmail(initialTakEmail)
  }, [initialTakEmail])

  useEffect(() => {
    setTakWhatsapp(initialTakWhatsapp)
  }, [initialTakWhatsapp])

  const fallbackInfo = FULL_TAK_DETAILS_TEXT[slug] || { title: `Wat is een ${takName}?`, defaultContent: '' }
  const traditie = TAK_TRADITIES[slug]

  return (
    <>
      <style>{`:root { --tak-color: var(--color-${slug}); --tak-color-dark: ${dark}; }`}</style>

      {/* Hero Header */}
      <section className={`tak-hero ${slug}`} style={{ position: 'relative', overflow: 'hidden' }}>
        <EditableImage
          blockKey={`takken.${slug}.hero_image`}
          page="takken"
          section={slug}
          defaultSrc={`/images/banner_${slug}.webp`}
          alt={takName}
          fill
          priority
          unoptimized
          uploadType="tak-banner"
          imageStyle={{ objectFit: 'cover', zIndex: 1 }}
        />
        <div className="tak-hero-overlay" style={{ zIndex: 2 }} />
        <div className="container" style={{ position: 'relative', zIndex: 3 }}>
          <EditableText
            blockKey={`takken.${slug}.hero_title`}
            page="takken"
            section={slug}
            field="title"
            defaultValue={takName}
            as="h2"
            className="tak-hero-title"
          />
        </div>
      </section>

      <section className="section container section--no-top" style={{ paddingTop: 40 }}>
        <div className="tak-layout">

          {/* Linker kolom */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

            {/* 1. Beschrijving Block */}
            <div className="tak-card-block">
              <EditableText
                blockKey={`takken.${slug}.description.title`}
                page="takken"
                section={slug}
                field="title"
                defaultValue={fallbackInfo.title}
                as="h3"
                style={{ fontSize: '1.8rem', marginBottom: 18, color: 'var(--color-primary-dark)', textTransform: 'uppercase' }}
              />
              <EditableText
                blockKey={`takken.${slug}.description.content`}
                page="takken"
                section={slug}
                field="content"
                defaultValue={fallbackInfo.defaultContent}
                as="p"
                multiline
                style={{ fontSize: '1.05rem', lineHeight: 1.7, color: 'var(--color-text-dark)', marginBottom: 0, whiteSpace: 'pre-line' }}
              />
            </div>

            {/* 2. Traditie & Belofte Block */}
            {traditie && (
              <div className="tak-card-block">
                <h3 style={{ fontSize: '1.6rem', marginBottom: 14, color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <i className="fa-solid fa-scroll" style={{ color: 'var(--color-primary)' }}></i>
                  <EditableText
                    blockKey={`takken.${slug}.traditie.wet_title`}
                    page="takken"
                    section={slug}
                    field="title"
                    defaultValue={traditie.wetTitle}
                    as="span"
                  />
                </h3>
                <EditableText
                  blockKey={`takken.${slug}.traditie.wet_content`}
                  page="takken"
                  section={slug}
                  field="content"
                  defaultValue={traditie.wet}
                  as="p"
                  multiline
                  style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--color-text-dark)', marginBottom: 24, fontStyle: 'italic', whiteSpace: 'pre-line' }}
                />

                {traditie.extraTitle && (
                  <>
                    <EditableText
                      blockKey={`takken.${slug}.traditie.extra_title`}
                      page="takken"
                      section={slug}
                      field="title"
                      defaultValue={traditie.extraTitle}
                      as="h4"
                      style={{ fontSize: '1.25rem', marginBottom: 12, color: 'var(--color-primary-dark)' }}
                    />
                    <div style={{ fontStyle: 'italic', background: 'var(--color-bg-linen)', padding: 18, borderRadius: 'var(--border-radius-md)', fontSize: '0.95rem', borderLeft: `4px solid var(--color-${slug})`, lineHeight: 1.6 }}>
                      <EditableText
                        blockKey={`takken.${slug}.traditie.extra_content`}
                        page="takken"
                        section={slug}
                        field="content"
                        defaultValue={traditie.extra || ''}
                        as="div"
                        multiline
                        style={{ whiteSpace: 'pre-line' }}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 3. Leiding Section & Foto */}
            <div className="leaders-section" style={{ position: 'relative', overflow: 'visible' }}>
              
              {/* Schuine Foto aan de RECHTER BOVENHOEK */}
              {takPhotoSrc && (
                <div className="tak-leader-photo-wrap">
                  <div className="tak-photo-tape" />
                  <div style={{
                    backgroundColor: '#fff',
                    padding: 8,
                    borderRadius: 10,
                    boxShadow: '0 16px 36px rgba(0,0,0,0.18), 0 4px 10px rgba(0,0,0,0.08)',
                    border: '1px solid var(--color-border)',
                  }}>
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', borderRadius: 6, overflow: 'hidden' }}>
                      <Image
                        src={takPhotoSrc}
                        alt={`Leidingsploeg ${takName}`}
                        fill
                        style={{ objectFit: 'cover' }}
                        sizes="340px"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Titel en Introductie */}
              <div className={`tak-leaders-header-info${takPhotoSrc ? ' has-photo' : ''}`}>
                <h3 style={{ fontSize: '1.6rem', borderBottom: '2px solid var(--color-bg-linen)', paddingBottom: 12, color: 'var(--color-primary-dark)' }}>
                  <EditableText
                    blockKey={`takken.${slug}.leaders.title`}
                    page="takken"
                    section={slug}
                    field="title"
                    defaultValue="De Leiding"
                    as="span"
                  />
                </h3>
                <EditableText
                  blockKey={`takken.${slug}.leaders.intro`}
                  page="takken"
                  section={slug}
                  field="content"
                  defaultValue="Dit team staat elke zondag klaar om de tak de tijd van hun leven te bezorgen. Heb je een vraag? Spreek ons gerust aan of bel de leiding!"
                  as="p"
                  style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginTop: 8, marginBottom: 24 }}
                />
              </div>

              {/* Lijst van Leiding */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 24 }}>
                {leadersToDisplay.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', margin: 0, padding: '12px 0' }}>
                    Benieuwd naar je leiding? Kom zeker langs op onze overgang.
                  </p>
                ) : (
                  leadersToDisplay.map((leader: Leader, idx: number) => (
                    <div
                      key={leader.name + idx}
                      className="tak-leader-row"
                    >
                      <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                        <h4 style={{ fontSize: '1.15rem', color: 'var(--color-primary-dark)', margin: 0, fontWeight: 700, lineHeight: 1.3 }}>
                          {leader.name}
                        </h4>
                        {leader.totem && (
                          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-dark)', fontStyle: 'italic', margin: '4px 0 0 0', lineHeight: 1.3 }}>
                            {leader.totem}
                          </p>
                        )}
                      </div>

                      {leader.phone ? (
                        <ProtectedPhone
                          phone={leader.phone}
                          className="tak-leader-phone-btn"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: '0.92rem',
                            fontWeight: 700,
                            color: 'var(--color-primary)',
                            backgroundColor: '#fff',
                            padding: '8px 16px',
                            borderRadius: 'var(--border-radius-md)',
                            border: '1px solid var(--color-border)',
                            textDecoration: 'none',
                            boxShadow: 'var(--shadow-sm)',
                            flexShrink: 0,
                            whiteSpace: 'nowrap',
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontStyle: 'italic', flexShrink: 0 }}>
                          -
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>

            </div>
          </div>

          {/* Rechter kolom */}
          <div>
            {/* Echo kaart */}
            <div className="side-card" style={{
              background: `linear-gradient(135deg, color-mix(in srgb, var(--tak-color) 80%, ${dark}), color-mix(in srgb, var(--tak-color) 45%, ${dark}))`,
              color: 'var(--color-bg-white)', border: 'none',
            }}>
              <Link href="/echos" style={{ textDecoration: 'none' }}>
                <h3 style={{ color: 'rgba(255,255,255,0.9)' }}>
                  <EditableText
                    blockKey={`takken.${slug}.echo_card.title`}
                    page="takken"
                    section={slug}
                    defaultValue="Kriko Echo"
                    as="span"
                  />{' '}
                  <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '0.7em', opacity: 0.6, marginLeft: 4 }}></i>
                </h3>
              </Link>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)', margin: '-4px 0 14px', borderBottom: '1px dashed rgba(255,255,255,0.2)', paddingBottom: 14 }}>
                <EditableText
                  blockKey={`takken.${slug}.echo_card.sub`}
                  page="takken"
                  section={slug}
                  defaultValue="Onze maandelijkse planning"
                  as="span"
                />
              </p>
              <div className="echo-card-pdfs">
                {recentEchos.length === 0 ? (
                  <p className="echo-card-empty" style={{ color: 'rgba(255,255,255,0.7)' }}>Momenteel geen editie beschikbaar.</p>
                ) : (
                  recentEchos.map((echo: Echo) => (
                    <a key={echo.id} href={`/api/echos/download/${echo.file_name}`} target="_blank" rel="noopener" className="echo-card-pdf-btn">
                      <span className="echo-pdf-left">
                        <i className="fa-solid fa-file-pdf"></i>
                        <span className="echo-pdf-maand">{MONTHS_NL[echo.month]} {echo.year}</span>
                      </span>
                      <span className="echo-pdf-open">Openen <i className="fa-solid fa-arrow-up-right-from-square"></i></span>
                    </a>
                  ))
                )}
              </div>
            </div>

            {/* Contact kaart */}
            <div className="side-card" style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <h3 style={{ margin: 0 }}>
                  <EditableText
                    blockKey={`takken.${slug}.contact.title`}
                    page="takken"
                    section={slug}
                    defaultValue="Contact"
                    as="span"
                  />
                </h3>

                {isEditMode && (
                  <button
                    onClick={() => setIsContactModalOpen(true)}
                    type="button"
                    style={{
                      backgroundColor: '#162544',
                      color: '#ffffff',
                      border: '1.5px solid #243B6B',
                      borderRadius: 16,
                      padding: '4px 10px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <i className="fa-solid fa-pen-to-square" style={{ color: '#E2C58D' }}></i>
                    Bewerken
                  </button>
                )}
              </div>

              <EditableText
                blockKey={`takken.${slug}.contact.sub`}
                page="takken"
                section={slug}
                defaultValue="Vragen aan de leiding?"
                as="p"
                style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: 8 }}
              />

              <ProtectedEmail
                email={takEmail}
                showCopy
                className="btn btn-secondary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}
              />
              <WhatsAppJoinButton
                takName={takName}
                whatsappUrl={takWhatsapp || `https://chat.whatsapp.com/placeholder-${slug}`}
              />
            </div>

            {/* Uniform & Webshop kaart */}
            <div className="side-card">
              <EditableText
                blockKey={`takken.${slug}.uniform.title`}
                page="takken"
                section={slug}
                field="title"
                defaultValue="Uniform &amp; Webshop"
                as="h3"
              />
              <EditableText
                blockKey={`takken.${slug}.uniform.content`}
                page="takken"
                section={slug}
                field="content"
                defaultValue={TAK_UNIFORM[slug] || ''}
                as="p"
                multiline
                style={{ fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--color-text-dark)', marginBottom: 16, whiteSpace: 'pre-line' }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link href="/shop" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                  <i className="fa-solid fa-cart-shopping" style={{ marginRight: 6 }}></i>
                  <EditableText
                    blockKey={`takken.${slug}.uniform.btn1`}
                    page="takken"
                    section={slug}
                    defaultValue="Kriko-M Webshop"
                  />
                </Link>
                <a
                  href="https://www.hopper.be/nl/shop"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <i className="fa-solid fa-arrow-up-right-from-square" style={{ marginRight: 6 }}></i>
                  <EditableText
                    blockKey={`takken.${slug}.uniform.btn2`}
                    page="takken"
                    section={slug}
                    defaultValue="Naar Hopper Winkel"
                  />
                </a>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Contact & WhatsApp Edit Modal */}
      {isContactModalOpen && (
        <EditTakContactModal
          slug={slug}
          takName={takName}
          initialEmail={takEmail}
          initialWhatsapp={takWhatsapp}
          onClose={() => setIsContactModalOpen(false)}
          onSaved={(savedEmail, savedWhatsapp) => {
            setTakEmail(savedEmail)
            setTakWhatsapp(savedWhatsapp)
            router.refresh()
          }}
        />
      )}
    </>
  )
}

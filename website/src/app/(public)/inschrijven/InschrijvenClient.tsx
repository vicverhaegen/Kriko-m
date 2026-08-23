'use client'

import { useState } from 'react'
import CopyButton from '@/components/CopyButton'
import EditableText from '@/components/editing/EditableText'

interface Props {
  email: string
  year: string
}

export default function InschrijvenClient({ email, year: _year }: Props) {
  const [activeTab, setActiveTab] = useState<'nieuw' | 'bestaand'>('nieuw')
  const [isFormOpen, setIsFormOpen] = useState(false)

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
      
      {/* Situatie Keuze Tabs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 8,
          backgroundColor: '#fff',
          padding: 6,
          borderRadius: 'var(--border-radius-lg)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('nieuw')}
          style={{
            padding: '14px 24px',
            minHeight: 52,
            borderRadius: 'var(--border-radius-md)',
            border: 'none',
            backgroundColor: activeTab === 'nieuw' ? 'var(--color-primary)' : 'transparent',
            color: activeTab === 'nieuw' ? '#fff' : 'var(--color-primary-dark)',
            fontWeight: 700,
            fontSize: '1.05rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            transition: 'background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease',
            boxShadow: activeTab === 'nieuw' ? '0 4px 14px color-mix(in srgb, var(--color-primary) 30%, transparent)' : 'none',
          }}
        >
          <i
            className="fa-solid fa-user-plus"
            style={{
              color: activeTab === 'nieuw' ? 'var(--color-accent)' : 'var(--color-primary)',
              fontSize: '1.1rem',
              transition: 'color 0.2s ease',
            }}
          ></i>
          <EditableText
            blockKey="inschrijven.tab.nieuw"
            page="inschrijven"
            defaultValue="Nieuw lid bij Kriko-M"
          />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bestaand')}
          style={{
            padding: '14px 24px',
            minHeight: 52,
            borderRadius: 'var(--border-radius-md)',
            border: 'none',
            backgroundColor: activeTab === 'bestaand' ? 'var(--color-primary)' : 'transparent',
            color: activeTab === 'bestaand' ? '#fff' : 'var(--color-primary-dark)',
            fontWeight: 700,
            fontSize: '1.05rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            transition: 'background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease',
            boxShadow: activeTab === 'bestaand' ? '0 4px 14px color-mix(in srgb, var(--color-primary) 30%, transparent)' : 'none',
          }}
        >
          <i
            className="fa-solid fa-user-check"
            style={{
              color: activeTab === 'bestaand' ? 'var(--color-accent)' : 'var(--color-primary)',
              fontSize: '1.1rem',
              transition: 'color 0.2s ease',
            }}
          ></i>
          <EditableText
            blockKey="inschrijven.tab.bestaand"
            page="inschrijven"
            defaultValue="Reeds lid (Herinschrijving)"
          />
        </button>
      </div>

      {activeTab === 'nieuw' ? (
        <>
          {/* Welkom & Probeerperiode Info Box */}
          <div
            style={{
              backgroundColor: '#fff',
              border: '1.5px solid var(--color-border)',
              borderRadius: 'var(--border-radius-lg)',
              padding: '24px 28px',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              background: 'linear-gradient(135deg, #FFFFFF 0%, #FAF8F5 100%)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  backgroundColor: 'rgba(101, 11, 25, 0.08)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.3rem',
                  flexShrink: 0,
                }}
              >
                <i className="fa-solid fa-compass"></i>
              </div>
              <div style={{ flex: 1, minWidth: 260 }}>
                <EditableText
                  blockKey="inschrijven.welkom.title"
                  page="inschrijven"
                  field="title"
                  defaultValue="Fijn dat je lid wilt worden van Scouts Kriko-M!"
                  as="h2"
                  style={{ margin: 0, fontSize: '1.35rem', color: 'var(--color-primary-dark)', fontWeight: 800 }}
                />
                <EditableText
                  blockKey="inschrijven.welkom.proberen"
                  page="inschrijven"
                  field="content"
                  defaultValue="Iedereen is van harte welkom! Twijfel je nog of wil je eerst eens komen proeven van het scouten? Nieuwe leden mogen altijd eerst 3 keer gratis komen proberen tijdens de gewone zondagactiviteiten vooraleer je definitief inschrijft."
                  as="p"
                  multiline
                  style={{ margin: '8px 0 0 0', fontSize: '0.98rem', color: 'var(--color-text-dark)', lineHeight: 1.6 }}
                />
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(101, 11, 25, 0.04)',
                borderRadius: 'var(--border-radius-md)',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 14,
                borderLeft: '4px solid var(--color-primary)',
              }}
            >
              <div style={{ flex: 1, minWidth: 260 }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary-dark)', display: 'block' }}>
                  <i className="fa-solid fa-list-check" style={{ marginRight: 8, color: 'var(--color-primary)' }}></i>
                  <EditableText
                    blockKey="inschrijven.welkom.stappen_title"
                    page="inschrijven"
                    defaultValue="Hieronder vind je het stappenplan om je in te schrijven:"
                  />
                </span>
                <span style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginTop: 3, display: 'block' }}>
                  <EditableText
                    blockKey="inschrijven.welkom.hulp"
                    page="inschrijven"
                    defaultValue="Heb je vragen of hulp nodig? Stuur gerust een bericht naar onze groepsleiding."
                  />
                </span>
              </div>
              <CopyButton text={email} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.86rem', whiteSpace: 'nowrap' }}>
                <i className="fas fa-envelope" style={{ marginRight: 6 }}></i> {email}
              </CopyButton>
            </div>
          </div>

          {/* STAP 1: Inschrijvingsformulier (Openklappen) */}
          <div
            className="inschrijven-step-box"
            style={{
              backgroundColor: '#fff',
              border: isFormOpen ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
              borderRadius: 'var(--border-radius-lg)',
              padding: '28px 32px',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ display: 'inline-block', backgroundColor: 'var(--color-primary)', color: '#fff', padding: '4px 12px', borderRadius: 'var(--border-radius-sm)', fontSize: '0.85rem', fontWeight: 800, marginBottom: 8 }}>
                  <EditableText
                    blockKey="inschrijven.stap1.badge"
                    page="inschrijven"
                    defaultValue="Stap 1"
                  />
                </div>
                <EditableText
                  blockKey="inschrijven.stap1.title"
                  page="inschrijven"
                  field="title"
                  defaultValue="Inschrijvingsformulier invullen"
                  as="h2"
                  style={{ margin: 0, fontSize: '1.4rem', color: 'var(--color-primary-dark)', fontWeight: 800 }}
                />
                <EditableText
                  blockKey="inschrijven.stap1.desc"
                  page="inschrijven"
                  field="content"
                  defaultValue="Vul het officiële inschrijvingsformulier van Scouts en Gidsen Vlaanderen in met de gegevens van het nieuwe lid en de contactgegevens van de ouders."
                  as="p"
                  multiline
                  style={{ margin: '8px 0 0 0', fontSize: '0.98rem', color: 'var(--color-text-dark)', lineHeight: 1.6 }}
                />
              </div>

              <button
                type="button"
                onClick={() => setIsFormOpen(!isFormOpen)}
                className="btn btn-secondary inschrijven-action-btn"
                style={{
                  padding: '12px 24px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderRadius: 'var(--border-radius-md)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <i className={`fa-solid ${isFormOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                {isFormOpen ? 'Verberg het inschrijvingsformulier' : 'Open het inschrijvingsformulier'}
              </button>
            </div>

            {/* Klap-in / Klap-uit Iframe Formulier */}
            {isFormOpen && (
              <div
                style={{
                  marginTop: 12,
                  paddingTop: 20,
                  borderTop: '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '820px',
                    borderRadius: 'var(--border-radius-md)',
                    overflow: 'hidden',
                    border: '1px solid var(--color-border)',
                    backgroundColor: '#fcfcfc',
                    boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.04)',
                  }}
                >
                  <iframe
                    src="https://groepsadmin.scoutsengidsenvlaanderen.be/groepsadmin/frontend/formulier/lidworden/O3108G"
                    title="Inschrijvingsformulier Scouts Kriko-M"
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, paddingTop: 4 }}>
                  <EditableText
                    blockKey="inschrijven.stap1.external_help"
                    page="inschrijven"
                    defaultValue="Lukt het invullen hier niet of open je het formulier liever op een groter scherm?"
                    as="span"
                    style={{ fontSize: '0.92rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}
                  />
                  <a
                    href="https://groepsadmin.scoutsengidsenvlaanderen.be/groepsadmin/frontend/formulier/lidworden/O3108G"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ padding: '10px 20px', fontSize: '0.92rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8 }}
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square"></i>
                    <EditableText
                      blockKey="inschrijven.stap1.external_btn"
                      page="inschrijven"
                      defaultValue="Open hetzelfde inschrijvingsformulier in nieuw tabblad »"
                    />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* STAP 2: Lidgeld overschrijven */}
          <div
            className="inschrijven-step-box"
            style={{
              backgroundColor: '#fff',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--border-radius-lg)',
              padding: '28px 32px',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div>
              <div style={{ display: 'inline-block', backgroundColor: 'var(--color-primary)', color: '#fff', padding: '4px 12px', borderRadius: 'var(--border-radius-sm)', fontSize: '0.85rem', fontWeight: 800, marginBottom: 8 }}>
                <EditableText
                  blockKey="inschrijven.stap2.badge"
                  page="inschrijven"
                  defaultValue="Stap 2"
                />
              </div>
              <EditableText
                blockKey="inschrijven.stap2.title"
                page="inschrijven"
                field="title"
                defaultValue="Lidgeld overschrijven (€ 50)"
                as="h2"
                style={{ margin: 0, fontSize: '1.4rem', color: 'var(--color-primary-dark)', fontWeight: 800 }}
              />
              <EditableText
                blockKey="inschrijven.stap2.desc"
                page="inschrijven"
                field="content"
                defaultValue="Na het versturen van het inschrijvingsformulier stort je het lidgeld. Het bedrag is € 50 per kind per jaar (€ 38 voor de verzekering via Scouts en Gidsen Vlaanderen + € 12 voor de algemene werking en materiaal van Kriko-M)."
                as="p"
                multiline
                style={{ margin: '8px 0 0 0', fontSize: '0.98rem', color: 'var(--color-text-dark)', lineHeight: 1.6 }}
              />
            </div>

            <div
              style={{
                backgroundColor: 'var(--color-bg-linen)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--border-radius-md)',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              <div>
                <span style={{ fontSize: '1.05rem', display: 'block', marginBottom: 2 }}>
                  <strong>IBAN:</strong>{' '}
                  <EditableText
                    blockKey="inschrijven.stap2.iban"
                    page="inschrijven"
                    defaultValue="BE59 7360 6413 2626"
                    as="code"
                    style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}
                  />
                </span>
                <span style={{ fontSize: '0.92rem', color: 'var(--color-text-dark)' }}>
                  <strong>Begunstigde:</strong> Scouts Kriko-M &nbsp;|&nbsp; <strong>Vermelding:</strong> <code>[Naam Kind] + [Tak]</code>
                </span>
              </div>
              <CopyButton text="BE59736064132626" className="btn btn-secondary" style={{ padding: '10px 20px', fontSize: '0.92rem' }}>
                Kopiëer IBAN
              </CopyButton>
            </div>

            <div style={{ backgroundColor: 'rgba(101, 11, 25, 0.04)', borderRadius: 'var(--border-radius-sm)', padding: '12px 16px', borderLeft: '4px solid var(--color-primary)' }}>
              <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--color-primary-dark)', fontWeight: 600, lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fa-solid fa-user-check"></i>
                <EditableText
                  blockKey="inschrijven.stap2.bevestiging"
                  page="inschrijven"
                  defaultValue="Na ontvangst van het formulier en de betaling wordt de inschrijving goedgekeurd door onze verantwoordelijke."
                />
              </p>
            </div>
          </div>

          {/* STAP 3: Individuele Steekkaart */}
          <div
            className="inschrijven-step-box"
            style={{
              backgroundColor: '#fff',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--border-radius-lg)',
              padding: '28px 32px',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div>
              <div style={{ display: 'inline-block', backgroundColor: 'var(--color-primary)', color: '#fff', padding: '4px 12px', borderRadius: 'var(--border-radius-sm)', fontSize: '0.85rem', fontWeight: 800, marginBottom: 8 }}>
                <EditableText
                  blockKey="inschrijven.stap3.badge"
                  page="inschrijven"
                  defaultValue="Stap 3"
                />
              </div>
              <EditableText
                blockKey="inschrijven.stap3.title"
                page="inschrijven"
                field="title"
                defaultValue="Individuele Steekkaart (na ontvangst lidnummer)"
                as="h2"
                style={{ margin: 0, fontSize: '1.4rem', color: 'var(--color-primary-dark)', fontWeight: 800 }}
              />
            </div>

            <div style={{ backgroundColor: 'rgba(237, 232, 208, 0.4)', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-md)', padding: '16px 20px' }}>
              <p style={{ margin: 0, fontSize: '0.96rem', color: 'var(--color-text-dark)', lineHeight: 1.6 }}>
                <strong>Let op:</strong>{' '}
                <EditableText
                  blockKey="inschrijven.stap3.opmerking"
                  page="inschrijven"
                  defaultValue="Deze stap is pas van toepassing nadat je na een week of 2 à 3 je persoonlijk lidnummer per e-mail hebt ontvangen!"
                />
              </p>
            </div>

            <EditableText
              blockKey="inschrijven.stap3.desc"
              page="inschrijven"
              defaultValue="Met het lidnummer kun je inloggen op de Groepsadministratie van Scouts en Gidsen Vlaanderen om de Individuele Steekkaart van je kind in te vullen. Hierop geef je belangrijke medische gegevens, dieetwensen en noodnummers door voor een veilige werking."
              as="p"
              multiline
              style={{ margin: 0, fontSize: '0.96rem', lineHeight: 1.6, color: 'var(--color-text-dark)' }}
            />

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 4 }}>
              <a
                href="https://www.scoutsengidsenvlaanderen.be/ouders/praktisch/inschrijven/individuele-steekkaart"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontSize: '0.95rem', fontWeight: 700 }}
              >
                <i className="fa-solid fa-arrow-up-right-from-square"></i>
                <EditableText
                  blockKey="inschrijven.stap3.btn1"
                  page="inschrijven"
                  defaultValue="Info Individuele Steekkaart »"
                />
              </a>
              <a
                href="https://groepsadmin.scoutsengidsenvlaanderen.be/groepsadmin/client/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontSize: '0.95rem', fontWeight: 700 }}
              >
                <i className="fa-solid fa-right-to-bracket"></i>
                <EditableText
                  blockKey="inschrijven.stap3.btn2"
                  page="inschrijven"
                  defaultValue="Naar Groepsadministratie »"
                />
              </a>
            </div>
          </div>
        </>
      ) : (
        /* REEDS LID (HERINSCHRIJVING) */
        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '32px 36px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          <div>
            <EditableText
              blockKey="inschrijven.her.title"
              page="inschrijven"
              field="title"
              defaultValue="Herinschrijving voor bestaande leden"
              as="h2"
              style={{ margin: 0, fontSize: '1.4rem', color: 'var(--color-primary-dark)', fontWeight: 800 }}
            />
            <EditableText
              blockKey="inschrijven.her.desc"
              page="inschrijven"
              field="content"
              defaultValue="Je blijft in principe voor altijd ingeschreven bij Kriko-M tot wanneer je jezelf formeel uitschrijft of je lidgeld niet meer betaalt."
              as="p"
              style={{ margin: '6px 0 0 0', fontSize: '0.98rem', color: 'var(--color-text-dark)', lineHeight: 1.5 }}
            />
          </div>

          {/* Enkel Lidgeld Betaling */}
          <div
            style={{
              backgroundColor: 'var(--color-bg-linen)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--border-radius-md)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <EditableText
              blockKey="inschrijven.her.betaal_title"
              page="inschrijven"
              defaultValue="Om te herinschrijven hoef je enkel het lidgeld (€ 50) over te schrijven:"
              as="h3"
              style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-primary-dark)', fontWeight: 800 }}
            />

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
                backgroundColor: '#fff',
                padding: '16px 20px',
                borderRadius: 'var(--border-radius-sm)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div>
                <span style={{ fontSize: '1.05rem', display: 'block', marginBottom: 2 }}>
                  <strong>IBAN:</strong> <code style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>BE59 7360 6413 2626</code>
                </span>
                <span style={{ fontSize: '0.9rem', color: 'var(--color-text-dark)' }}>
                  <strong>Begunstigde:</strong> Scouts Kriko-M &nbsp;|&nbsp; <strong>Vermelding:</strong> <code>[Naam Kind] + [Tak]</code>
                </span>
              </div>
              <CopyButton text="BE59736064132626" className="btn btn-secondary" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
                Kopiëer IBAN
              </CopyButton>
            </div>
          </div>

          {/* Steekkaart herinnering */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 4 }}>
            <EditableText
              blockKey="inschrijven.her.steekkaart_title"
              page="inschrijven"
              defaultValue="Individuele Steekkaart controleren"
              as="h4"
              style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-primary-dark)', fontWeight: 800 }}
            />
            <EditableText
              blockKey="inschrijven.her.steekkaart_desc"
              page="inschrijven"
              defaultValue="Vergeet niet om jaarlijks eventuele nieuwe medische of contactgegevens van je kind aan te passen op de Groepsadministratie."
              as="p"
              style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-text-dark)', lineHeight: 1.6 }}
            />
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 4 }}>
              <a
                href="https://www.scoutsengidsenvlaanderen.be/ouders/praktisch/inschrijven/individuele-steekkaart"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontSize: '0.95rem', fontWeight: 700 }}
              >
                <i className="fa-solid fa-arrow-up-right-from-square"></i> Info Individuele Steekkaart &raquo;
              </a>
              <a
                href="https://groepsadmin.scoutsengidsenvlaanderen.be/groepsadmin/client/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontSize: '0.95rem', fontWeight: 700 }}
              >
                <i className="fa-solid fa-right-to-bracket"></i> Naar Groepsadministratie &raquo;
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

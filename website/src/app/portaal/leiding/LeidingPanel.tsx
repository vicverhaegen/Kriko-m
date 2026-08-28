'use client'

import Link from 'next/link'
import { Settings } from '@/lib/types'

interface Props {
  isGroepsleiding?: boolean
  naam?: string
  settings?: Settings | null
  unapprovedEchosCount?: number
}

export default function LeidingPanel({ isGroepsleiding = false, settings, unapprovedEchosCount = 0 }: Props) {
  const pageTitle = isGroepsleiding
    ? (settings?.home_title_groepsleiding || 'Groepsleiding')
    : (settings?.home_title_leiding || 'Leiding')
  const pageSubtitle = isGroepsleiding
    ? (settings?.home_subtitle_groepsleiding || '')
    : (settings?.home_subtitle_leiding || '')

  return (
    <div style={{
      maxWidth: 1200,
      margin: '0 auto',
      width: '100%',
      minHeight: '100vh',
      padding: '40px 24px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}>
      
      {/* Central Title & Subtitle */}
      <div style={{
        textAlign: 'center',
        marginBottom: 44,
      }}>
        <h1 style={{
          fontFamily: 'var(--font-heading, Nunito, sans-serif)',
          fontSize: 'clamp(2.5rem, 5vw, 3.6rem)',
          fontWeight: 900,
          color: '#FFFFFF',
          textShadow: '0 2px 8px rgba(0,0,0,0.4)',
          margin: 0,
          letterSpacing: '-0.01em',
          lineHeight: 1.15,
        }}>
          {pageTitle}
        </h1>
        {pageSubtitle && (
          <p style={{
            fontSize: '1.1rem',
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: 600,
            textShadow: '0 1px 4px rgba(0,0,0,0.3)',
            marginTop: 10,
            marginBottom: 0,
          }}>
            {pageSubtitle}
          </p>
        )}
      </div>

      {/* Core Cards Grid (Only the 4 core section cards) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 24,
        width: '100%',
      }}>
        
        {/* Card 1: Kriko Echo */}
        <Link
          href="/portaal/echos"
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            padding: '28px 24px',
            border: '1px solid #CCCCCC',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 220,
            position: 'relative',
          }}
          className="portaal-home-card"
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div
                className="portaal-home-card-icon"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: '#162544',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.35rem',
                  transition: 'all 0.2s ease',
                }}
              >
                <i className="fa-solid fa-newspaper"></i>
              </div>

              {isGroepsleiding && unapprovedEchosCount > 0 && (
                <span
                  title={`${unapprovedEchosCount} Kriko Echo('s) te keuren`}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: '#243B6B',
                    color: '#FFFFFF',
                    fontSize: '0.78rem',
                    fontWeight: 900,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                    boxShadow: '0 2px 6px rgba(36,59,107,0.25)',
                  }}
                >
                  {unapprovedEchosCount}
                </span>
              )}
            </div>

            <strong style={{
              display: 'block',
              fontFamily: 'var(--font-heading, Nunito, sans-serif)',
              fontSize: '1.25rem',
              fontWeight: 900,
              color: '#162544',
              marginBottom: 6,
              lineHeight: 1.2,
            }}>
              Kriko Echo
            </strong>
            <p style={{
              margin: 0,
              fontSize: '0.9rem',
              color: '#555555',
              lineHeight: 1.45,
              fontWeight: 500,
            }}>
              Upload en beheer de maandelijkse edities per tak in een overzichtelijke indeling.
            </p>
          </div>

          <div style={{
            marginTop: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 14,
            borderTop: '1px solid #EEEEEE',
            fontSize: '0.86rem',
            fontWeight: 800,
            color: '#243B6B',
          }}>
            <span>Echo beheer</span>
            <i className="fa-solid fa-arrow-right portaal-home-card-arrow" style={{ transition: 'transform 0.2s ease' }}></i>
          </div>
        </Link>

        {/* Card 2: Documenten & Links */}
        <Link
          href="/portaal/algemene-info"
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            padding: '28px 24px',
            border: '1px solid #CCCCCC',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 220,
          }}
          className="portaal-home-card"
        >
          <div>
            <div
              className="portaal-home-card-icon"
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: '#162544',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.35rem',
                marginBottom: 18,
                transition: 'all 0.2s ease',
              }}
            >
              <i className="fa-solid fa-folder-open"></i>
            </div>
            <strong style={{
              display: 'block',
              fontFamily: 'var(--font-heading, Nunito, sans-serif)',
              fontSize: '1.25rem',
              fontWeight: 900,
              color: '#162544',
              marginBottom: 6,
              lineHeight: 1.2,
            }}>
              Documenten &amp; Links
            </strong>
            <p style={{
              margin: 0,
              fontSize: '0.9rem',
              color: '#555555',
              lineHeight: 1.45,
              fontWeight: 500,
            }}>
              Overzicht van sjablonen, draaiboeken, formulieren en externe links.
            </p>
          </div>

          <div style={{
            marginTop: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 14,
            borderTop: '1px solid #EEEEEE',
            fontSize: '0.86rem',
            fontWeight: 800,
            color: '#243B6B',
          }}>
            <span>Documenten bekijken</span>
            <i className="fa-solid fa-arrow-right portaal-home-card-arrow" style={{ transition: 'transform 0.2s ease' }}></i>
          </div>
        </Link>

        {/* Card 3: Kalender */}
        <Link
          href="/portaal/leiding/agenda"
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            padding: '28px 24px',
            border: '1px solid #CCCCCC',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 220,
          }}
          className="portaal-home-card"
        >
          <div>
            <div
              className="portaal-home-card-icon"
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: '#162544',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.35rem',
                marginBottom: 18,
                transition: 'all 0.2s ease',
              }}
            >
              <i className="fa-solid fa-calendar-days"></i>
            </div>
            <strong style={{
              display: 'block',
              fontFamily: 'var(--font-heading, Nunito, sans-serif)',
              fontSize: '1.25rem',
              fontWeight: 900,
              color: '#162544',
              marginBottom: 6,
              lineHeight: 1.2,
            }}>
              Kalender &amp; Activiteiten
            </strong>
            <p style={{
              margin: 0,
              fontSize: '0.9rem',
              color: '#555555',
              lineHeight: 1.45,
              fontWeight: 500,
            }}>
              Plan vergaderingen en evenementen en abonneer op de kalender.
            </p>
          </div>

          <div style={{
            marginTop: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 14,
            borderTop: '1px solid #EEEEEE',
            fontSize: '0.86rem',
            fontWeight: 800,
            color: '#243B6B',
          }}>
            <span>Naar kalender</span>
            <i className="fa-solid fa-arrow-right portaal-home-card-arrow" style={{ transition: 'transform 0.2s ease' }}></i>
          </div>
        </Link>

      </div>
    </div>
  )
}

'use client'
import { useState } from 'react'

interface Props {
  takName: string
  whatsappUrl: string
}

export default function WhatsAppJoinButton({ takName, whatsappUrl }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  const activeUrl = whatsappUrl || `https://chat.whatsapp.com/placeholder-${takName.toLowerCase()}`
  const qrCodeUrl = isOpen ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(activeUrl)}` : ''

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn"
        style={{
          marginTop: 4,
          width: '100%',
          backgroundColor: 'transparent',
          color: '#25D366',
          border: '2px solid #25D366',
          boxShadow: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#25D366'
          e.currentTarget.style.color = '#ffffff'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = '#25D366'
        }}
      >
        <i className="fab fa-whatsapp" style={{ fontSize: '1.1rem' }}></i> Doe mee op WhatsApp
      </button>

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '400px',
              padding: '30px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              textAlign: 'center',
              position: 'relative',
              color: '#1A1A1A'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'none',
                border: 'none',
                fontSize: '1.2rem',
                cursor: 'pointer',
                color: '#888',
                transition: 'color 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#333'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
            >
              <i className="fas fa-times"></i>
            </button>

            {/* Icon & Title */}
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                backgroundColor: '#E8F8EF',
                color: '#25D366',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '1.8rem'
              }}
            >
              <i className="fab fa-whatsapp"></i>
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 8px 0', color: '#1A1A1A' }}>
              WhatsApp-groep {takName}
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#666', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              Blijf eenvoudig op de hoogte van belangrijke updates en last-minute wijzigingen.
            </p>

            {/* Direct Join Button */}
            <a
              href={activeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
              style={{
                width: '100%',
                backgroundColor: '#25D366',
                color: '#fff',
                fontWeight: 700,
                padding: '12px 20px',
                borderRadius: '50px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginBottom: 20,
                border: 'none',
                boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)'
              }}
            >
              Deelnemen via WhatsApp <i className="fas fa-arrow-right"></i>
            </a>

            {/* Divider */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                margin: '20px 0',
                color: '#ccc'
              }}
            >
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #eee' }} />
              <span style={{ padding: '0 10px', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 1 }}>of scan de QR-code</span>
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #eee' }} />
            </div>

            {/* QR Code */}
            <div
              style={{
                backgroundColor: '#f9f9f9',
                border: '1px solid #eee',
                borderRadius: '12px',
                padding: '12px',
                display: 'inline-block',
                margin: '0 auto 8px'
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrCodeUrl}
                alt={`QR Code WhatsApp ${takName}`}
                style={{ display: 'block', width: 160, height: 160 }}
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: '#888', margin: '6px 0 0 0' }}>
              Scan met de camera van je telefoon om direct lid te worden.
            </p>
          </div>
        </div>
      )}
    </>
  )
}

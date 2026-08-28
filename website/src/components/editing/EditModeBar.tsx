'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useEditMode } from './EditContext'

export default function EditModeBar() {
  const {
    isGroepsleiding,
    isEditMode,
    setIsEditMode,
    saveAll,
    discardAll,
    isSaving,
    saveStatus,
    hasChanges,
    errorMessage,
  } = useEditMode()

  const [showConfirmModal, setShowConfirmModal] = useState(false)

  if (!isGroepsleiding || !isEditMode) return null

  function handleCancelClick() {
    if (hasChanges) {
      setShowConfirmModal(true)
    } else {
      setIsEditMode(false)
    }
  }

  function handleConfirmDiscard() {
    setShowConfirmModal(false)
    discardAll()
    setIsEditMode(false)
  }

  return (
    <>
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 999999,
          backgroundColor: '#162544',
          color: '#ffffff',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.88rem',
          fontWeight: 700,
          fontFamily: 'var(--font-heading, Nunito, sans-serif)',
          boxShadow: '0 4px 18px rgba(0,0,0,0.35)',
          flexWrap: 'wrap',
          gap: 12,
          borderBottom: '2px solid #243B6B',
        }}
      >
        {/* Left side info & badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span
            style={{
              backgroundColor: '#243B6B',
              color: '#FFFFFF',
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: '0.74rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '.06em',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            }}
          >
            GROEPSLEIDING
          </span>
          <span style={{ fontSize: '0.9rem', color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <i className="fa-solid fa-pen-to-square" style={{ color: '#E2C58D' }}></i>
            <strong>Live Website Bewerken:</strong> Klik op een tekst om te typen, of zweef over een foto om te vervangen.
          </span>

          {hasChanges && (
            <span
              style={{
                backgroundColor: 'rgba(201, 150, 58, 0.25)',
                border: '1px solid #C9963A',
                color: '#FDE68A',
                padding: '2px 8px',
                borderRadius: 6,
                fontSize: '0.78rem',
                fontWeight: 800,
              }}
            >
              ● Niet-opgeslagen wijzigingen
            </span>
          )}

          {errorMessage && (
            <span
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.25)',
                border: '1px solid #EF4444',
                color: '#FCA5A5',
                padding: '2px 8px',
                borderRadius: 6,
                fontSize: '0.78rem',
                fontWeight: 700,
              }}
            >
              {errorMessage}
            </span>
          )}
        </div>

        {/* Right side actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link
            href="/portaal/home"
            style={{
              color: '#CBD5E1',
              textDecoration: 'none',
              fontSize: '0.84rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 8,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              transition: 'all 0.15s ease',
            }}
          >
            &larr; Naar Portaal
          </Link>

          {/* Save button */}
          <button
            onClick={() => saveAll()}
            disabled={isSaving}
            type="button"
            style={{
              backgroundColor:
                saveStatus === 'saved'
                  ? '#10B981'
                  : saveStatus === 'error'
                  ? '#EF4444'
                  : hasChanges
                  ? '#C9963A'
                  : '#243B6B',
              color: saveStatus === 'saved' || saveStatus === 'error' || !hasChanges ? '#FFFFFF' : '#162544',
              border: 'none',
              borderRadius: 8,
              padding: '8px 18px',
              fontSize: '0.88rem',
              fontWeight: 900,
              cursor: isSaving ? 'wait' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: hasChanges ? '0 2px 10px rgba(201, 150, 58, 0.4)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {isSaving ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i> Opslaan…
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <i className="fa-solid fa-check"></i> Opgeslagen!
              </>
            ) : saveStatus === 'error' ? (
              <>
                <i className="fa-solid fa-triangle-exclamation"></i> Fout (Opnieuw)
              </>
            ) : (
              <>
                <i className="fa-solid fa-floppy-disk"></i> Website Opslaan
              </>
            )}
          </button>

          {/* Cancel / Exit button */}
          <button
            onClick={handleCancelClick}
            type="button"
            title={hasChanges ? "Wijzigingen verwerpen en bewerkmodus sluiten" : "Bewerkmodus sluiten"}
            style={{
              backgroundColor: hasChanges ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
              color: hasChanges ? '#FCA5A5' : '#94A3B8',
              border: hasChanges ? '1px solid #EF4444' : '1px solid #334155',
              borderRadius: 8,
              padding: '7px 14px',
              fontSize: '0.84rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease',
            }}
          >
            {hasChanges ? '✕ Annuleren' : '✕ Sluiten'}
          </button>
        </div>
      </div>

      {/* In-Site Confirmation Modal */}
      {showConfirmModal && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.65)',
              zIndex: 1000000,
              backdropFilter: 'blur(3px)',
            }}
            onClick={() => setShowConfirmModal(false)}
          />
          <div
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000001,
              padding: 16,
              pointerEvents: 'none',
              fontFamily: 'var(--font-heading, Nunito, sans-serif)',
            }}
          >
            <div
              style={{
                pointerEvents: 'auto',
                width: '100%',
                maxWidth: 480,
                backgroundColor: '#ffffff',
                borderRadius: 16,
                boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
                border: '2px solid #162544',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Header */}
              <div
                style={{
                  backgroundColor: '#162544',
                  color: '#ffffff',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '2px solid #243B6B',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <i className="fa-solid fa-triangle-exclamation" style={{ color: '#F87171', fontSize: '1.15rem' }}></i>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                    Wijzigingen Verwerpen?
                  </h3>
                </div>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#CBD5E1',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ margin: 0, fontSize: '0.96rem', color: '#1E293B', lineHeight: 1.55 }}>
                  Je hebt aanpassingen gemaakt die nog <strong>niet zijn opgeslagen</strong> op de website.
                </p>
                <div
                  style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: 10,
                    padding: '12px 14px',
                    color: '#991B1B',
                    fontSize: '0.86rem',
                    lineHeight: 1.5,
                  }}
                >
                  ⚠️ Als je nu annuleert, worden al je niet-opgeslagen teksten en fotowijzigingen direct verworpen en hersteld naar de oorspronkelijke staat.
                </div>
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: '14px 20px',
                  backgroundColor: '#F8FAFC',
                  borderTop: '1px solid #E2E8F0',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 10,
                }}
              >
                <button
                  onClick={() => setShowConfirmModal(false)}
                  type="button"
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    color: '#334155',
                    cursor: 'pointer',
                  }}
                >
                  Doorgaan met bewerken
                </button>
                <button
                  onClick={handleConfirmDiscard}
                  type="button"
                  style={{
                    backgroundColor: '#DC2626',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 18px',
                    fontSize: '0.86rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
                  }}
                >
                  <i className="fa-solid fa-trash"></i> Ja, Verwerp Wijzigingen
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

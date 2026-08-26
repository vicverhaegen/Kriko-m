'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Leader } from '@/lib/types'
import EditLeidingModal from '@/components/editing/EditLeidingModal'
import EditableText from '@/components/editing/EditableText'
import { useEditMode } from '@/components/editing/EditContext'
import ProtectedPhone from '@/components/anti-scraping/ProtectedPhone'

interface Props {
  initialLeaders: Leader[]
  initialPhoto?: string | null
}

export default function ContactGroepsleidingCard({
  initialLeaders,
  initialPhoto = null,
}: Props) {
  const router = useRouter()
  const { isEditMode } = useEditMode()

  const [leaders, setLeaders] = useState<Leader[]>(initialLeaders)
  const [photo, setPhoto] = useState<string | null>(initialPhoto)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    setLeaders(initialLeaders)
  }, [initialLeaders])

  useEffect(() => {
    setPhoto(initialPhoto)
  }, [initialPhoto])

  return (
    <div className="side-card" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, color: 'var(--color-primary-dark)', fontSize: '1.25rem' }}>
          <EditableText
            blockKey="contact.groepsleiding.title"
            page="contact"
            section="groepsleiding"
            field="title"
            defaultValue="Groepsleiding"
            as="span"
          />
        </h3>

        {isEditMode && (
          <button
            onClick={() => setIsModalOpen(true)}
            type="button"
            style={{
              backgroundColor: '#162544',
              color: '#FFFFFF',
              border: '1.5px solid #243B6B',
              borderRadius: 20,
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              fontFamily: 'var(--font-heading, Nunito, sans-serif)',
            }}
          >
            <i className="fa-solid fa-pen-to-square" style={{ color: '#E2C58D' }}></i>
            Bewerken
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {leaders.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', margin: 0, fontSize: '0.9rem' }}>
            Er is momenteel geen groepsleiding ingesteld.
          </p>
        ) : (
          leaders.map((leader, i) => (
            <div
              key={leader.name + i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                padding: '12px 16px',
                backgroundColor: 'var(--color-bg-linen)',
                borderRadius: 'var(--border-radius-md)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.02rem', color: 'var(--color-primary-dark)', lineHeight: 1.3 }}>
                    {leader.name}
                  </div>
                  {leader.totem && (
                    <div style={{ fontSize: '0.86rem', color: 'var(--color-text-dark)', fontStyle: 'italic', marginTop: 2, lineHeight: 1.3 }}>
                      {leader.totem}
                    </div>
                  )}
                </div>

                {leader.phone ? (
                  <ProtectedPhone phone={leader.phone} />
                ) : (
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontStyle: 'italic', flexShrink: 0 }}>
                    -
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <EditLeidingModal
          slug="groepsleiding"
          takName="Groepsleiding"
          initialPhoto={photo}
          initialLeaders={leaders}
          onClose={() => setIsModalOpen(false)}
          onSaved={(savedLeaders, savedPhoto) => {
            setLeaders(savedLeaders)
            setPhoto(savedPhoto)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

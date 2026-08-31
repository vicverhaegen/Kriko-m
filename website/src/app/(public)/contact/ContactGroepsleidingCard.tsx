'use client'

import Image from 'next/image'
import { Leader } from '@/lib/types'
import EditableText from '@/components/editing/EditableText'
import ProtectedPhone from '@/components/anti-scraping/ProtectedPhone'

interface Props {
  initialLeaders: Leader[]
  initialPhoto?: string | null
}

export default function ContactGroepsleidingCard({
  initialLeaders,
  initialPhoto,
}: Props) {
  const leaders = initialLeaders
  const hasPhoto = Boolean(initialPhoto && initialPhoto.trim() !== '')

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

      {hasPhoto && (
        <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', borderRadius: 'var(--border-radius-md)', overflow: 'hidden', marginTop: 16, border: '1px solid var(--color-border)', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
          <Image
            src={initialPhoto!}
            alt="Groepsleiding Scouts Kriko-M"
            fill
            sizes="360px"
            style={{ objectFit: 'cover' }}
          />
        </div>
      )}
    </div>
  )
}

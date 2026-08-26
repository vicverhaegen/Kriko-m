'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import ProtectedEmail from '@/components/anti-scraping/ProtectedEmail'

interface OrderData {
  order_ref: string
  communication: string
  total: number
  items: Array<{ name: string; size: string; quantity: number; price: number }>
  bank_iban: string
  bank_holder: string
  webshop_email?: string
}

export default function BevestigingPage() {
  const [order, setOrder] = useState<OrderData | null>(null)

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('kriko_last_order')
      if (stored) {
        setOrder(JSON.parse(stored))
      }
    } catch {}
  }, [])

  if (!order) {
    return (
      <section className="section container" style={{ textAlign: 'center', padding: '80px 0' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Geen bestellingsgegevens gevonden.</p>
        <Link href="/shop" className="btn btn-secondary" style={{ marginTop: 24, display: 'inline-block' }}>
          Naar de webshop
        </Link>
      </section>
    )
  }

  const notificationEmail = order.webshop_email || 'bestellingen@kriko-m.be'

  return (
    <>
      <section className="tak-hero primair hero-checkout">
        <div className="container">
          <h2 className="tak-hero-title">Bedankt voor je bestelling</h2>
        </div>
      </section>

      <section className="section container">
        <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Bevestigingsbadge */}
          <div style={{ background: 'hsl(145,63%,95%)', border: '2px solid hsl(145,63%,70%)', borderRadius: 'var(--border-radius-lg)', padding: '24px 28px' }}>
            <strong style={{ display: 'block', color: 'hsl(145,63%,25%)', fontSize: '1.15rem', marginBottom: 6 }}>
              Bestelling ontvangen — {order.order_ref}
            </strong>
            <span style={{ color: 'hsl(145,63%,30%)', fontSize: '0.95rem', lineHeight: 1.5, display: 'block' }}>
              Je bestelling is succesvol geregistreerd. De webshopverantwoordelijke ontvangt hiervan direct bericht.
            </span>
          </div>

          {/* Betalingsopties */}
          <div className="checkout-card" style={{ background: 'var(--color-bg-white)' }}>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--color-primary-dark)', marginBottom: 18, paddingBottom: 12, borderBottom: '2px solid var(--color-bg-linen)' }}>
              Betalingsinformatie
            </h3>

            <div style={{ display: 'grid', gap: 16 }}>

              {/* Overschrijving */}
              <div style={{ background: 'var(--color-bg-linen)', padding: '16px 20px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border)' }}>
                <strong style={{ color: 'var(--color-primary-dark)', fontSize: '1rem', display: 'block', marginBottom: 10 }}>
                  Optie 1: Handmatige Bankoverschrijving
                </strong>
                <div style={{ display: 'grid', gap: 10, fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Begunstigde:</span>
                    <span style={{ color: 'var(--color-primary-dark)', fontWeight: 600 }}>{order.bank_holder}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>IBAN:</span>
                    <code style={{ fontFamily: 'monospace', letterSpacing: '0.05em', fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>{order.bank_iban}</code>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Bedrag:</span>
                    <strong style={{ color: 'var(--color-primary-dark)', fontSize: '1.15rem', fontWeight: 900 }}>
                      €{order.total.toFixed(2).replace('.', ',')}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, background: '#fff', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', marginTop: 4 }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>Mededeling bij overschrijving:</span>
                    <code style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)', fontSize: '1.1rem', letterSpacing: '0.05em' }}>
                      {order.communication}
                    </code>
                  </div>
                </div>
              </div>

              {/* Cash bij afhaling */}
              <div style={{ background: '#EEF5F1', padding: '16px 20px', borderRadius: 'var(--border-radius-md)', border: '1.5px solid #C2D9C9' }}>
                <strong style={{ color: '#1A3D2A', fontSize: '1rem', display: 'block', marginBottom: 4 }}>
                  Optie 2: Contant / Cash bij afhaling
                </strong>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#1A3D2A', lineHeight: 1.4 }}>
                  Liever cash betalen? Dat kan eenvoudig bij het ophalen van je bestelling.
                </p>
              </div>

            </div>
          </div>

          {/* Ophalen */}
          <div className="checkout-card" style={{ background: 'var(--color-bg-white)' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--color-primary-dark)', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--color-bg-linen)' }}>
              Ophalen van je bestelling
            </h3>
            <p style={{ fontSize: '0.92rem', color: 'var(--color-text-dark)', lineHeight: 1.55, margin: 0 }}>
              De webshopverantwoordelijke communiceert zelf per e-mail (via <ProtectedEmail email={notificationEmail} />) wanneer en waar je je bestelling kan komen ophalen.
            </p>
          </div>

          {/* Bestelde artikelen */}
          <div className="checkout-card" style={{ background: 'var(--color-bg-white)' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--color-primary-dark)', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--color-bg-linen)' }}>
              Bestelde artikelen
            </h3>
            {order.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--color-border)' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--color-primary-dark)' }}>{item.quantity}× {item.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Maat: {item.size}</div>
                </div>
                <div style={{ fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                  €{(item.price * item.quantity).toFixed(2).replace('.', ',')}
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.15rem', color: 'var(--color-primary-dark)', marginTop: 8, paddingTop: 12, borderTop: '2px solid var(--color-bg-linen)' }}>
              <span>Totaal:</span>
              <span>€{order.total.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }} className="no-print">
            <button onClick={() => window.print()} className="btn btn-secondary">
              Afdrukken / opslaan als PDF
            </button>
            <Link href="/" className="btn btn-outline" style={{ textAlign: 'center' }}>
              ← Terug naar de website
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/components/shop/CartProvider'

export default function CheckoutForm() {
  const { items, totalPrice, clearCart } = useCart()
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'sending'>('idle')
  const [error, setError] = useState('')
  const [hydrated, setHydrated] = useState(false)

  const [loadedAt] = useState<number>(() => Date.now())

  useEffect(() => { setHydrated(true) }, [])

  useEffect(() => {
    if (hydrated && items.length === 0 && status === 'idle') router.push('/shop')
  }, [hydrated, items.length, status, router])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')
    setError('')
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: fd.get('customer_name'),
        email: fd.get('email'),
        website: fd.get('website'), // honeypot
        _t: loadedAt,
        cart: items,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      clearCart()
      sessionStorage.setItem('kriko_last_order', JSON.stringify(data))
      router.push('/shop/bevestiging')
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Er ging iets mis. Probeer het opnieuw.')
      setStatus('idle')
    }
  }

  if (!hydrated) return null

  return (
    <section className="section container">
      <div className="checkout-layout">

        {/* Links: formulier */}
        <div className="checkout-card">
          <h3 style={{ fontSize: '1.6rem', borderBottom: '2px solid var(--color-bg-linen)', paddingBottom: 12, marginBottom: 20, color: 'var(--color-primary-dark)' }}>
            Jouw Gegevens
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: 24 }}>
            Vul simpelweg je naam en e-mailadres in om je bestelling door te sturen.
          </p>

          {error && (
            <div style={{ background: 'hsla(4,75%,48%,0.1)', border: '2px solid var(--color-error)', color: 'var(--color-error)', padding: 16, borderRadius: 'var(--border-radius-md)', marginBottom: 24, fontWeight: 600 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Honeypot — verborgen voor mensen */}
            <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
              <label htmlFor="website">Laat dit veld leeg</label>
              <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label" htmlFor="customer_name">Naam (Ouder / Koper):</label>
              <input
                type="text"
                id="customer_name"
                name="customer_name"
                className="form-control"
                placeholder="Voornaam + Achternaam"
                maxLength={120}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label" htmlFor="email">E-mailadres:</label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-control"
                placeholder="jouw.naam@domein.be"
                maxLength={160}
                required
              />
            </div>

            {/* Betalings- en afhaalinfo */}
            <div style={{ background: 'var(--color-bg-linen)', borderRadius: 'var(--border-radius-md)', padding: '20px', border: '1px solid var(--color-border)', margin: '24px 0 28px' }}>
              <strong style={{ display: 'block', color: 'var(--color-primary-dark)', fontSize: '1rem', marginBottom: 8 }}>
                Betaling &amp; Ophalen
              </strong>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.88rem', color: 'var(--color-text-dark)', lineHeight: 1.6 }}>
                <li>
                  <strong>Optie 1: Handmatige overschrijving</strong> — Je ontvangt een IBAN en duidelijke mededeling.
                </li>
                <li>
                  <strong>Optie 2: Cash / contant</strong> — Je kan contant betalen bij het ophalen.
                </li>
                <li style={{ marginTop: 4 }}>
                  De uniformverantwoordelijke ontvangt direct een mail van jouw bestelling en neemt zelf contact op om de afhaling af te spreken!
                </li>
              </ul>
            </div>

            <button
              type="submit"
              className="btn btn-secondary"
              style={{ width: '100%', padding: '14px 28px', fontSize: '1.1rem', fontWeight: 800 }}
              disabled={status === 'sending' || items.length === 0}
            >
              {status === 'sending' ? 'Bestelling versturen…' : 'Bestelling Bevestigen'}
            </button>
          </form>
        </div>

        {/* Rechts: mandje-overzicht */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="checkout-card" style={{ background: 'var(--color-bg-white)' }}>
            <h3 style={{ fontSize: '1.4rem', borderBottom: '2px solid var(--color-bg-linen)', paddingBottom: 8, marginBottom: 16, color: 'var(--color-primary-dark)' }}>
              Overzicht Bestelling
            </h3>
            {items.map(item => (
              <div key={`${item.id}-${item.size}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--color-border)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Maat: {item.size} | Aantal: {item.quantity}</div>
                </div>
                <div style={{ fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                  €{(item.price * item.quantity).toFixed(2).replace('.', ',')}
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--color-primary-dark)', marginTop: 20, paddingTop: 16, borderTop: '2px solid var(--color-bg-linen)' }}>
              <span>Totaal:</span>
              <span>€{totalPrice.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>

          <a href="/shop" className="btn btn-outline" style={{ width: '100%', textAlign: 'center' }}>
            ← Verder winkelen
          </a>
        </div>

      </div>
    </section>
  )
}

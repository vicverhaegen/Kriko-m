'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/components/shop/CartProvider'
import { formatPrice } from '@/lib/utils'

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

  const [paymentMethod, setPaymentMethod] = useState<'overschrijving' | 'cash'>('overschrijving')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')
    setError('')
    const fd = new FormData(e.currentTarget)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25000)

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: fd.get('customer_name'),
          email: fd.get('email'),
          kriko_hp_verify: fd.get('kriko_hp_verify'),
          _sec_token: loadedAt,
          cart: items,
          payment_method: paymentMethod,
        }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (res.ok) {
        const data = await res.json()
        const orderToStore = {
          order_ref: data.order_ref || data.communication || 'KM-0001',
          communication: data.communication || data.order_ref || 'KM-0001',
          total: typeof data.total === 'number' ? data.total : totalPrice,
          items: Array.isArray(data.items) && data.items.length > 0 ? data.items : items,
          bank_iban: data.bank_iban || 'BE59 7360 6413 2626',
          bank_holder: data.bank_holder || 'Scouts Kriko-M vzw',
          webshop_email: data.webshop_email || 'bestellingen@kriko-m.be',
          payment_method: data.payment_method || paymentMethod,
        }
        clearCart()
        sessionStorage.setItem('kriko_last_order', JSON.stringify(orderToStore))
        router.push('/shop/bevestiging')
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Er ging iets mis. Probeer het opnieuw.')
        setStatus('idle')
      }
    } catch (err: unknown) {
      clearTimeout(timeoutId)
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Het verwerken van je bestelling duurde te lang door een trage verbinding. Controleer je internet en probeer opnieuw.')
      } else {
        setError('Er kon geen verbinding worden gemaakt met de server. Controleer je internetverbinding en probeer opnieuw.')
      }
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
            {/* Slimme honeypot tegen crawlers — onzichtbaar voor mensen en genegeerd door autofill */}
            <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}>
              <label htmlFor="kriko_hp_verify">Niet invullen</label>
              <input
                type="text"
                id="kriko_hp_verify"
                name="kriko_hp_verify"
                tabIndex={-1}
                autoComplete="off"
                data-lpignore="true"
                data-1p-ignore="true"
              />
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

            {/* Betalingskeuze */}
            <div style={{ marginBottom: 28 }}>
              <label className="form-label" style={{ display: 'block', marginBottom: 10, fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                Betaalmethode:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                
                {/* Optie 1: Overschrijving */}
                <div
                  onClick={() => setPaymentMethod('overschrijving')}
                  style={{
                    border: paymentMethod === 'overschrijving' ? '2px solid var(--color-primary, #650B19)' : '2px solid #E2E8F0',
                    backgroundColor: paymentMethod === 'overschrijving' ? '#FAF4F5' : '#FFFFFF',
                    borderRadius: 'var(--border-radius-md, 12px)',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: paymentMethod === 'overschrijving' ? '0 2px 8px rgba(101, 11, 25, 0.12)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, color: 'var(--color-primary-dark, #162544)', fontSize: '0.96rem' }}>
                      <i className="fa-solid fa-building-columns" style={{ color: 'var(--color-primary, #650B19)' }}></i>
                      <span>Overschrijving</span>
                    </div>
                    <input
                      type="radio"
                      name="payment_method_radio"
                      checked={paymentMethod === 'overschrijving'}
                      onChange={() => setPaymentMethod('overschrijving')}
                      style={{ accentColor: '#650B19', cursor: 'pointer' }}
                    />
                  </div>
                  <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted, #64748B)', lineHeight: 1.4 }}>
                    Je ontvangt een overschrijvingsmededeling en ons IBAN-rekeningnummer.
                  </span>
                </div>

                {/* Optie 2: Cash */}
                <div
                  onClick={() => setPaymentMethod('cash')}
                  style={{
                    border: paymentMethod === 'cash' ? '2px solid var(--color-primary, #650B19)' : '2px solid #E2E8F0',
                    backgroundColor: paymentMethod === 'cash' ? '#FAF4F5' : '#FFFFFF',
                    borderRadius: 'var(--border-radius-md, 12px)',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: paymentMethod === 'cash' ? '0 2px 8px rgba(101, 11, 25, 0.12)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, color: 'var(--color-primary-dark, #162544)', fontSize: '0.96rem' }}>
                      <i className="fa-solid fa-money-bill-wave" style={{ color: '#166534' }}></i>
                      <span>Cash bij afhaling</span>
                    </div>
                    <input
                      type="radio"
                      name="payment_method_radio"
                      checked={paymentMethod === 'cash'}
                      onChange={() => setPaymentMethod('cash')}
                      style={{ accentColor: '#650B19', cursor: 'pointer' }}
                    />
                  </div>
                  <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted, #64748B)', lineHeight: 1.4 }}>
                    Je betaalt het gepaste bedrag contant wanneer je je bestelling afhaalt.
                  </span>
                </div>

              </div>
            </div>

            {/* Afhaalinfo */}
            <div style={{ background: 'var(--color-bg-linen)', borderRadius: 'var(--border-radius-md)', padding: '16px 20px', border: '1px solid var(--color-border)', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-primary-dark)', fontWeight: 800, fontSize: '0.92rem', marginBottom: 6 }}>
                <i className="fa-solid fa-circle-info"></i>
                <span>Afhaling van je bestelling</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--color-text-dark)', lineHeight: 1.5 }}>
                De webshopverantwoordelijke ontvangt jouw bestelling en neemt per e-mail contact op om een afhaalmoment af te spreken.
              </p>
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
                  {formatPrice(item.price * item.quantity)}
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--color-primary-dark)', marginTop: 20, paddingTop: 16, borderTop: '2px solid var(--color-bg-linen)' }}>
              <span>Totaal:</span>
              <span>{formatPrice(totalPrice)}</span>
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

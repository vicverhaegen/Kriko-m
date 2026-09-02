'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useCart } from './CartProvider'
import { formatPrice } from '@/lib/utils'

export default function CartDrawer() {
  const [open, setOpen] = useState(false)
  const { items, removeItem, updateQty, totalQty, totalPrice } = useCart()
  const panelRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return

    const handleWheel = (e: WheelEvent) => {
      const body = bodyRef.current
      if (!body) return

      const isScrollable = body.scrollHeight > body.clientHeight + 1
      if (!isScrollable) return

      const maxScroll = body.scrollHeight - body.clientHeight
      const currentScroll = body.scrollTop

      if (e.deltaY < 0) {
        // Omhoog scrollen: scroll in het mandje zolang we niet bovenaan zijn
        if (currentScroll > 0) {
          e.preventDefault()
          body.scrollTop = Math.max(0, currentScroll + e.deltaY)
        }
        // Als we al bovenaan zijn (currentScroll <= 0), laten we de pagina zelf scrollen
      } else if (e.deltaY > 0) {
        // Omlaag scrollen: scroll in het mandje zolang we niet onderaan zijn
        if (currentScroll < maxScroll - 1) {
          e.preventDefault()
          body.scrollTop = Math.min(maxScroll, currentScroll + e.deltaY)
        }
        // Als we al onderaan zijn (currentScroll >= maxScroll - 1), laten we de pagina zelf scrollen
      }
    }

    panel.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      panel.removeEventListener('wheel', handleWheel)
    }
  }, [])

  return (
    <div className={`shop-cart-dock${open ? '' : ' collapsed'}`} id="shop-cart">
      <button
        type="button"
        className="shop-cart-tab"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label="Winkelmandje openen of sluiten"
      >
        <i className="fa-solid fa-bag-shopping" />
        {totalQty > 0 && <span className="cart-count">{totalQty}</span>}
        <span className="shop-cart-tab-label">Mandje</span>
      </button>

      <div className="shop-cart-panel" ref={panelRef}>
        <div className="cart-drawer-body" ref={bodyRef}>
          {items.length === 0 ? (
            <div className="shop-cart-empty">
              <i className="fa-solid fa-bag-shopping" style={{ fontSize: '2rem', opacity: 0.3, marginBottom: 12, display: 'block' }} />
              <p>Je winkelmandje is leeg.</p>
            </div>
          ) : (
            items.map(item => (
              <div key={`${item.id}-${item.size}`} className="cart-item">
                <div className="cart-item-details">
                  <div className="cart-item-title">{item.name}</div>
                  <div className="cart-item-meta">Maat: {item.size}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <button
                      onClick={() => updateQty(item.id, item.size, -1)}
                      style={{ width: 24, height: 24, border: '1px solid var(--color-border)', background: 'var(--color-bg-linen)', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >−</button>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.id, item.size, 1)}
                      style={{ width: 24, height: 24, border: '1px solid var(--color-border)', background: 'var(--color-bg-linen)', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >+</button>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div className="cart-item-price">{formatPrice(item.price * item.quantity)}</div>
                  <button onClick={() => removeItem(item.id, item.size)} className="cart-item-remove" style={{ marginTop: 6 }}>
                    Verwijder
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="shop-cart-foot">
          <div className="cart-subtotal">
            <span>Subtotaal</span>
            <span className="cart-subtotal-value">{formatPrice(totalPrice)}</span>
          </div>
          <p className="shop-cart-note">
            Betaling via overschrijving. De gestructureerde mededeling verschijnt bij het afrekenen.
          </p>
          <Link
            href="/shop/checkout"
            className="btn btn-secondary btn-cart-checkout"
            style={{ width: '100%', opacity: items.length === 0 ? 0.5 : 1, pointerEvents: items.length === 0 ? 'none' : 'auto' }}
          >
            Naar afrekenen
          </Link>
        </div>
      </div>
    </div>
  )
}

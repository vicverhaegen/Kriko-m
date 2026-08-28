'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import jsPDF from 'jspdf'
import ProtectedEmail from '@/components/anti-scraping/ProtectedEmail'

interface OrderData {
  order_ref: string
  communication: string
  total: number
  items: Array<{ name: string; size: string; quantity: number; price: number }>
  bank_iban: string
  bank_holder: string
  webshop_email?: string
  payment_method?: 'overschrijving' | 'cash'
}

const formatEuro = (n: number | undefined | null) => {
  const val = typeof n === 'number' && !isNaN(n) ? n : Number(n) || 0
  return '€' + val.toFixed(2).replace('.', ',')
}

export default function BevestigingPage() {
  const [order, setOrder] = useState<OrderData | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('kriko_last_order')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed && typeof parsed === 'object') {
          setOrder(parsed)
        }
      }
    } catch {}
    setLoaded(true)
  }, [])

  if (!loaded) return null

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
  const isCash = order.payment_method === 'cash'
  const safeTotal = typeof order.total === 'number' && !isNaN(order.total) ? order.total : (Number(order.total) || 0)
  const items = Array.isArray(order.items) ? order.items : []
  const orderRef = order.order_ref || order.communication || 'Bestelling'

  function handleDownloadPdf() {
    if (!order) return
    setDownloadingPdf(true)
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()

      // Header bar
      doc.setFillColor(22, 37, 68) // #162544
      doc.rect(0, 0, pageWidth, 80, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.text('Scouts Kriko-M — Besteloverzicht', 40, 42)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.text(`Bestelnummer: ${orderRef}`, 40, 62)

      let y = 110

      // Box 1: Betalingsinformatie
      doc.setFillColor(240, 236, 228) // #F0ECE4
      doc.roundedRect(40, y, pageWidth - 80, isCash ? 85 : 120, 6, 6, 'F')

      doc.setTextColor(22, 37, 68)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.text('Betalingsinformatie', 56, y + 24)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(50, 50, 50)

      if (isCash) {
        doc.text('Betaalmethode: Contant / Cash bij afhaling', 56, y + 44)
        doc.text(`Te betalen bedrag bij afhaling: ${formatEuro(safeTotal)}`, 56, y + 62)
        y += 105
      } else {
        doc.text('Betaalmethode: Handmatige bankoverschrijving', 56, y + 44)
        doc.text(`Begunstigde: ${order.bank_holder || 'Scouts Kriko-M vzw'}`, 56, y + 60)
        doc.text(`IBAN: ${order.bank_iban || 'BE59 7360 6413 2626'}`, 56, y + 76)
        doc.text(`Mededeling bij overschrijving: ${order.communication || orderRef}`, 56, y + 92)
        doc.setFont('helvetica', 'bold')
        doc.text(`Te overschrijven bedrag: ${formatEuro(safeTotal)}`, 56, y + 108)
        y += 140
      }

      // Box 2: Bestelde artikelen
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.setTextColor(22, 37, 68)
      doc.text('Bestelde artikelen', 40, y + 10)
      y += 24

      // Table header
      doc.setFillColor(235, 240, 249)
      doc.rect(40, y, pageWidth - 80, 22, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(22, 37, 68)
      doc.text('Aantal & Artikel', 50, y + 15)
      doc.text('Maat', pageWidth - 200, y + 15)
      doc.text('Totaal', pageWidth - 50, y + 15, { align: 'right' })
      y += 22

      // Table rows
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(40, 40, 40)

      items.forEach((item) => {
        const itemPrice = typeof item.price === 'number' && !isNaN(item.price) ? item.price : (Number(item.price) || 0)
        const itemQty = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : (Number(item.quantity) || 1)

        doc.text(`${itemQty}x ${item.name}`, 50, y + 16)
        doc.text(`${item.size || 'Standaard'}`, pageWidth - 200, y + 16)
        doc.text(formatEuro(itemPrice * itemQty), pageWidth - 50, y + 16, { align: 'right' })

        doc.setDrawColor(230, 230, 230)
        doc.line(40, y + 22, pageWidth - 40, y + 22)
        y += 22
      })

      // Total row
      y += 10
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(101, 11, 25) // #650B19
      doc.text('Totaalbedrag:', 50, y + 12)
      doc.text(formatEuro(safeTotal), pageWidth - 50, y + 12, { align: 'right' })

      // Footer notes
      y += 45
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(100, 100, 100)
      doc.text('De webshopverantwoordelijke neemt per e-mail contact op voor een afhaalmoment.', 40, y)
      doc.text('Scouts Kriko-M vzw | Industriepark-Noord 33, 9100 Sint-Niklaas | groepsleiding@kriko-m.be', 40, y + 16)

      // Save PDF file to trigger download
      doc.save(`Bestelling_${orderRef}.pdf`)
    } catch (err) {
      console.error('Fout bij downloaden PDF:', err)
    } finally {
      setDownloadingPdf(false)
    }
  }

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
              Bestelling ontvangen — {orderRef}
            </strong>
            <span style={{ color: 'hsl(145,63%,30%)', fontSize: '0.95rem', lineHeight: 1.5, display: 'block' }}>
              Je bestelling is succesvol geregistreerd. De webshopverantwoordelijke ontvangt hiervan direct bericht.
            </span>
          </div>

          {/* Betalingsinformatie */}
          <div className="checkout-card" style={{ background: 'var(--color-bg-white)' }}>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--color-primary-dark)', marginBottom: 18, paddingBottom: 12, borderBottom: '2px solid var(--color-bg-linen)' }}>
              Betalingsinformatie
            </h3>

            {isCash ? (
              /* Cash bij afhaling */
              <div style={{ background: '#EEF5F1', padding: '18px 22px', borderRadius: 'var(--border-radius-md)', border: '1.5px solid #C2D9C9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1A3D2A', fontWeight: 800, fontSize: '1.05rem', marginBottom: 6 }}>
                  <i className="fa-solid fa-money-bill-wave"></i>
                  <span>Contant / Cash bij afhaling</span>
                </div>
                <p style={{ margin: '0 0 10px', fontSize: '0.92rem', color: '#1A3D2A', lineHeight: 1.5 }}>
                  Je hebt gekozen om contant te betalen wanneer je je bestelling ophaalt bij de leiding.
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', padding: '10px 14px', borderRadius: 8, border: '1px solid #C2D9C9' }}>
                  <span style={{ fontWeight: 700, color: '#1A3D2A', fontSize: '0.9rem' }}>Te betalen bedrag bij afhaling:</span>
                  <strong style={{ fontSize: '1.15rem', color: '#1A3D2A', fontWeight: 900 }}>{formatEuro(safeTotal)}</strong>
                </div>
              </div>
            ) : (
              /* Overschrijving */
              <div style={{ background: 'var(--color-bg-linen)', padding: '18px 22px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-primary-dark)', fontWeight: 800, fontSize: '1.05rem', marginBottom: 10 }}>
                  <i className="fa-solid fa-building-columns"></i>
                  <span>Handmatige Bankoverschrijving</span>
                </div>
                <div style={{ display: 'grid', gap: 10, fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Begunstigde:</span>
                    <span style={{ color: 'var(--color-primary-dark)', fontWeight: 600 }}>{order.bank_holder || 'Scouts Kriko-M vzw'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>IBAN:</span>
                    <code style={{ fontFamily: 'monospace', letterSpacing: '0.05em', fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>{order.bank_iban || 'BE59 7360 6413 2626'}</code>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Bedrag:</span>
                    <strong style={{ color: 'var(--color-primary-dark)', fontSize: '1.15rem', fontWeight: 900 }}>
                      {formatEuro(safeTotal)}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, background: '#fff', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', marginTop: 4 }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>Mededeling bij overschrijving:</span>
                    <code style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)', fontSize: '1.1rem', letterSpacing: '0.05em' }}>
                      {order.communication || orderRef}
                    </code>
                  </div>
                </div>
              </div>
            )}
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
            {items.map((item, i) => {
              const itemPrice = typeof item.price === 'number' && !isNaN(item.price) ? item.price : (Number(item.price) || 0)
              const itemQty = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : (Number(item.quantity) || 1)
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--color-border)' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--color-primary-dark)' }}>{itemQty}× {item.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Maat: {item.size}</div>
                  </div>
                  <div style={{ fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                    {formatEuro(itemPrice * itemQty)}
                  </div>
                </div>
              )
            })}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.15rem', color: 'var(--color-primary-dark)', marginTop: 8, paddingTop: 12, borderTop: '2px solid var(--color-bg-linen)' }}>
              <span>Totaal:</span>
              <span>{formatEuro(safeTotal)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }} className="no-print">
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            >
              <i className="fa-solid fa-file-arrow-down"></i>
              <span>{downloadingPdf ? 'PDF genereren…' : 'Bestelling als PDF downloaden'}</span>
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

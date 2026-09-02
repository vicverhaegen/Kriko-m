import { Resend } from 'resend'
import jsPDF from 'jspdf'
import { OrderItem } from '@/lib/types'

// Resend-client. Wordt alleen server-side gebruikt (API routes).
// RESEND_API_KEY moet gezet zijn; RESEND_FROM moet een geverifieerd afzenderdomein zijn.
const FROM_WEBSHOP = process.env.RESEND_FROM || 'Scouts Kriko-M Webshop <bestellingen@kriko-m.be>'
const FROM_CONTACT = process.env.RESEND_FROM_CONTACT || process.env.RESEND_FROM || 'Scouts Kriko-M <groepsleiding@kriko-m.be>'
const BCC = process.env.RESEND_BCC || ''

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

import { formatPrice as euro } from './utils'
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

interface OrderConfirmationParams {
  to: string
  orderRef: string
  customerName: string
  items: OrderItem[]
  total: number
  communication: string
  bankIban: string
  bankHolder: string
  paymentMethod?: 'overschrijving' | 'cash'
}

export function createOrderPdfBuffer(params: OrderConfirmationParams): Buffer {
  const { orderRef, items, total, communication, bankIban, bankHolder, paymentMethod = 'overschrijving' } = params
  const isCash = paymentMethod === 'cash'

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
    doc.text(`Te betalen bedrag bij afhaling: ${euro(total)}`, 56, y + 62)
    y += 105
  } else {
    doc.text('Betaalmethode: Handmatige bankoverschrijving', 56, y + 44)
    doc.text(`Begunstigde: ${bankHolder || 'Scouts Kriko-M vzw'}`, 56, y + 60)
    doc.text(`IBAN: ${bankIban || 'BE59 7360 6413 2626'}`, 56, y + 76)
    doc.text(`Mededeling bij overschrijving: ${communication || orderRef}`, 56, y + 92)
    doc.setFont('helvetica', 'bold')
    doc.text(`Te overschrijven bedrag: ${euro(total)}`, 56, y + 108)
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
    doc.text(euro(itemPrice * itemQty), pageWidth - 50, y + 16, { align: 'right' })

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
  doc.text(euro(total), pageWidth - 50, y + 12, { align: 'right' })

  // Footer notes
  y += 45
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text('De webshopverantwoordelijke neemt per e-mail contact op voor een afhaalmoment.', 40, y)
  doc.text('Scouts Kriko-M vzw | Industriepark-Noord 33, 9100 Sint-Niklaas | groepsleiding@kriko-m.be', 40, y + 16)

  const arrayBuffer = doc.output('arraybuffer')
  return Buffer.from(arrayBuffer)
}

export async function sendOrderConfirmation(params: OrderConfirmationParams) {
  const resend = getClient()
  if (!resend) {
    console.warn('RESEND_API_KEY ontbreekt in environment variables; bevestigingsmail niet verstuurd.')
    return
  }

  const { to, orderRef, customerName, items, total, communication, bankIban, bankHolder, paymentMethod = 'overschrijving' } = params

  const isCash = paymentMethod === 'cash'

  const itemRows = items
    .map(
      (i) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #E5DFD5;"><strong>${i.quantity}×</strong> ${esc(i.name)} <span style="color:#666;">(Maat: ${esc(i.size)})</span></td>
        <td style="padding:8px 0;border-bottom:1px solid #E5DFD5;text-align:right;white-space:nowrap;font-weight:600;">${euro(i.price * i.quantity)}</td>
      </tr>`
    )
    .join('')

  const paymentBlockHtml = isCash
    ? `<div style="background:#EEF5F1;border:1.5px solid #C2D9C9;border-radius:10px;padding:16px 20px;margin-top:18px;">
        <h3 style="margin:0 0 6px;font-size:15px;color:#1A3D2A;font-weight:bold;">Betaling: Contant / Cash bij Afhaling</h3>
        <p style="margin:0 0 10px;font-size:13px;color:#1A3D2A;line-height:1.5;">
          Je hebt gekozen om contant te betalen bij het ophalen van je bestelling bij de leiding.
        </p>
        <div style="background:#FFFFFF;border:1px solid #C2D9C9;border-radius:8px;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:13px;color:#1A3D2A;font-weight:600;">Te betalen bedrag bij afhaling:</span>
          <strong style="font-size:16px;color:#1A3D2A;">${euro(total)}</strong>
        </div>
      </div>`
    : `<div style="background:#F0ECE4;border:1.5px solid #E2E8F0;border-radius:10px;padding:16px 20px;margin-top:18px;">
        <h3 style="margin:0 0 10px;font-size:15px;color:#162544;font-weight:bold;">Betalingsinstructies Bankoverschrijving</h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <tr><td style="padding:4px 0;color:#666;width:120px;">Begunstigde:</td><td style="padding:4px 0;font-weight:bold;color:#162544;">${esc(bankHolder)}</td></tr>
          <tr><td style="padding:4px 0;color:#666;">IBAN:</td><td style="padding:4px 0;font-family:monospace;font-weight:bold;color:#162544;letter-spacing:0.05em;">${esc(bankIban)}</td></tr>
          <tr><td style="padding:4px 0;color:#666;">Bedrag:</td><td style="padding:4px 0;font-weight:bold;font-size:15px;color:#162544;">${euro(total)}</td></tr>
          <tr><td style="padding:4px 0;color:#666;">Mededeling:</td><td style="padding:4px 0;font-family:monospace;font-weight:bold;font-size:15px;color:#162544;letter-spacing:0.05em;">${esc(communication)}</td></tr>
        </table>
      </div>`

  const html = `<!doctype html><html><body style="margin:0;background:#F0ECE4;font-family:Arial,Helvetica,sans-serif;color:#2b2b2b;">
    <div style="max-width:580px;margin:0 auto;padding:24px;">
      <div style="background:#162544;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
        <h1 style="margin:0;font-size:20px;">Bedankt voor je bestelling</h1>
        <p style="margin:6px 0 0;opacity:.9;font-size:14px;">Bestelnummer: <strong>${esc(orderRef)}</strong></p>
      </div>
      <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
        <p style="margin:0 0 14px;font-size:15px;">Beste ${esc(customerName)},</p>
        <p style="margin:0 0 18px;line-height:1.5;font-size:14px;color:#444;">
          We hebben je bestelling goed ontvangen. ${isCash ? 'Je betaalt contant bij het ophalen van je bestelling.' : 'Gelieve het totaalbedrag over te schrijven met onderstaande gegevens.'}
        </p>

        <h3 style="margin:0 0 8px;font-size:14px;color:#162544;text-transform:uppercase;letter-spacing:0.04em;">Bestelde Artikelen</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:14px;">
          ${itemRows}
          <tr>
            <td style="padding:12px 0 0;font-weight:bold;font-size:15px;color:#162544;">Totaalbedrag:</td>
            <td style="padding:12px 0 0;text-align:right;font-weight:bold;font-size:16px;color:#650B19;">${euro(total)}</td>
          </tr>
        </table>

        ${paymentBlockHtml}

        <p style="margin:22px 0 0;font-size:13px;color:#666;line-height:1.5;">
          De webshopverantwoordelijke neemt per e-mail contact met je op om een geschikt afhaalmoment af te spreken.
        </p>
        
        <div style="margin:20px 0 0;padding-top:16px;border-top:1px solid #eee;font-size:13px;color:#888;line-height:1.4;">
          Stevige linkerhand,<br/>
          <strong>Scouts Kriko-M vzw</strong><br/>
          Industriepark-Noord 33, 9100 Sint-Niklaas
        </div>
      </div>
    </div>
  </body></html>`

  const paymentTextLines = isCash
    ? [
        `Betalingsmethode: Contant / Cash bij afhaling`,
        `Gelieve het gepaste bedrag (${euro(total)}) mee te brengen bij het afhalen.`,
      ]
    : [
        `Betalingsmethode: Handmatige bankoverschrijving`,
        `Begunstigde: ${bankHolder}`,
        `IBAN: ${bankIban}`,
        `Bedrag: ${euro(total)}`,
        `Mededeling bij overschrijving: ${communication}`,
      ]

  const text = [
    `Bedankt voor je bestelling (${orderRef})!`,
    ``,
    `Beste ${customerName},`,
    `We hebben je bestelling succesvol ontvangen.`,
    ``,
    `Bestelde artikelen:`,
    ...items.map((i) => `- ${i.quantity}x ${i.name} (Maat: ${i.size}): ${euro(i.price * i.quantity)}`),
    ``,
    `Totaalbedrag: ${euro(total)}`,
    ``,
    ...paymentTextLines,
    ``,
    `De webshopverantwoordelijke neemt per e-mail contact met je op om een geschikt afhaalmoment af te spreken.`,
    ``,
    `Stevige linkerhand,`,
    `Scouts Kriko-M vzw`,
  ].join('\n')

  let pdfAttachment = undefined
  try {
    const pdfBuffer = createOrderPdfBuffer(params)
    pdfAttachment = [
      {
        filename: `Bestelling_${orderRef}.pdf`,
        content: pdfBuffer,
      },
    ]
  } catch (pdfErr) {
    console.warn('Kon PDF-bijlage niet genereren voor e-mail:', pdfErr)
  }

  const res = await resend.emails.send({
    from: FROM_WEBSHOP,
    to,
    ...(BCC ? { bcc: BCC.split(',').map((s) => s.trim()).filter(Boolean) } : {}),
    subject: `Bevestiging bestelling ${orderRef} — Scouts Kriko-M`,
    html,
    text,
    ...(pdfAttachment ? { attachments: pdfAttachment } : {}),
  })

  if (res.error) {
    console.error('Resend fout bij verzenden bestelbevestiging:', res.error)
  }
}

interface WebshopOrderNotificationParams {
  to: string
  orderRef: string
  customerName: string
  email: string
  items: OrderItem[]
  total: number
  communication: string
  bankIban: string
  bankHolder: string
  paymentMethod?: 'overschrijving' | 'cash'
}

export async function sendWebshopOrderNotification(params: WebshopOrderNotificationParams) {
  const resend = getClient()
  if (!resend) {
    console.warn('RESEND_API_KEY ontbreekt; notificatiemail niet verstuurd.')
    return
  }

  const { to, orderRef, customerName, email, items, total, paymentMethod = 'overschrijving' } = params
  const isCash = paymentMethod === 'cash'

  const itemRows = items
    .map(
      (i) => `<tr>
        <td style="padding:8px;border-bottom:1px solid #eee;"><strong>${i.quantity}×</strong> ${esc(i.name)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${esc(i.size)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${euro(i.price)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;font-weight:bold;">${euro(i.price * i.quantity)}</td>
      </tr>`
    )
    .join('')

  const html = `<!doctype html><html><body style="margin:0;background:#F0ECE4;font-family:Arial,Helvetica,sans-serif;color:#2b2b2b;">
    <div style="max-width:600px;margin:0 auto;padding:24px;">
      <div style="background:#162544;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
        <h1 style="margin:0;font-size:20px;">Nieuwe Webshop Bestelling</h1>
        <p style="margin:6px 0 0;opacity:.9;font-size:14px;">Bestelnummer: <strong>${esc(orderRef)}</strong></p>
      </div>
      <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
        <p style="margin:0 0 16px;font-size:15px;line-height:1.5;">
          Beste webshopverantwoordelijke,<br/><br/>
          Er is een nieuwe bestelling geplaatst via de webshop van Scouts Kriko-M.
        </p>

        <div style="background:#F0ECE4;border-radius:10px;padding:16px 18px;margin-bottom:20px;">
          <h3 style="margin:0 0 10px;font-size:15px;color:#162544;">Gegevens Koper</h3>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:4px 0;color:#666;width:140px;">Naam koper:</td><td style="padding:4px 0;font-weight:bold;color:#162544;">${esc(customerName)}</td></tr>
            <tr><td style="padding:4px 0;color:#666;">E-mailadres:</td><td style="padding:4px 0;"><a href="mailto:${esc(email)}" style="color:#162544;font-weight:bold;">${esc(email)}</a></td></tr>
            <tr><td style="padding:4px 0;color:#666;">Betaalmethode:</td><td style="padding:4px 0;font-weight:bold;color:${isCash ? '#166534' : '#1E3A8A'};">${isCash ? 'Contant / Cash bij afhaling' : 'Overschrijving'}</td></tr>
            <tr><td style="padding:4px 0;color:#666;">Totaalbedrag:</td><td style="padding:4px 0;font-weight:bold;font-size:16px;color:#650B19;">${euro(total)}</td></tr>
          </table>
        </div>

        <h3 style="margin:0 0 12px;font-size:15px;color:#162544;">Bestelde Artikelen</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
          <thead>
            <tr style="background:#f8f9fa;text-align:left;">
              <th style="padding:8px;border-bottom:2px solid #ddd;">Artikel</th>
              <th style="padding:8px;border-bottom:2px solid #ddd;">Maat</th>
              <th style="padding:8px;border-bottom:2px solid #ddd;text-align:right;">Stukprijs</th>
              <th style="padding:8px;border-bottom:2px solid #ddd;text-align:right;">Subtotaal</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
            <tr>
              <td colspan="3" style="padding:12px 8px 0;font-weight:bold;text-align:right;">Totaalbedrag:</td>
              <td style="padding:12px 8px 0;text-align:right;font-weight:bold;font-size:16px;color:#650B19;">${euro(total)}</td>
            </tr>
          </tbody>
        </table>

        <p style="margin:20px 0 0;font-size:13px;color:#666;line-height:1.5;">
          Je kan rechtstreeks met de koper communiceren via <a href="mailto:${esc(email)}" style="color:#162544;font-weight:bold;">${esc(email)}</a> om een afhaalmoment af te spreken.
        </p>
      </div>
    </div>
  </body></html>`

  const text = [
    `Nieuwe Webshop Bestelling (${orderRef})`,
    ``,
    `Naam koper: ${customerName}`,
    `E-mailadres: ${email}`,
    `Betaalmethode: ${isCash ? 'Cash bij afhaling' : 'Overschrijving'}`,
    `Totaalbedrag: ${euro(total)}`,
    ``,
    `Bestelde artikelen:`,
    ...items.map((i) => `- ${i.quantity}x ${i.name} (${i.size}): ${euro(i.price * i.quantity)}`),
    ``,
    `Communiceer met de koper via ${email} om af te spreken voor de afhaling.`,
  ].join('\n')

  const res = await resend.emails.send({
    from: FROM_WEBSHOP,
    to,
    subject: `Nieuwe Webshop Bestelling ${orderRef} — ${customerName} (${isCash ? 'Cash' : 'Overschrijving'})`,
    html,
    text,
  })

  if (res.error) {
    console.error('Resend fout bij verzenden bestelnotificatie naar webshop:', res.error)
  }
}

interface FinancialOrderNotificationParams {
  to: string
  orderRef: string
  customerName: string
  email: string
  items: OrderItem[]
  total: number
  communication: string
  bankIban: string
  bankHolder: string
}

export async function sendFinancialOrderNotification(params: FinancialOrderNotificationParams) {
  const resend = getClient()
  if (!resend) {
    console.warn('RESEND_API_KEY ontbreekt; financiële notificatiemail niet verstuurd.')
    return
  }

  const { to, orderRef, customerName, email, items, total, communication } = params

  const itemRows = items
    .map(
      (i) => `<tr>
        <td style="padding:6px 0;border-bottom:1px solid #eee;">${i.quantity}× ${esc(i.name)} <span style="color:#888;">(${esc(i.size)})</span></td>
        <td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;">${euro(i.price * i.quantity)}</td>
      </tr>`
    )
    .join('')

  const html = `<!doctype html><html><body style="margin:0;background:#F0ECE4;font-family:Arial,Helvetica,sans-serif;color:#2b2b2b;">
    <div style="max-width:580px;margin:0 auto;padding:24px;">
      <div style="background:#162544;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
        <h1 style="margin:0;font-size:20px;">Webshop Bestelling via Overschrijving</h1>
        <p style="margin:6px 0 0;opacity:.9;font-size:14px;">Bestelnummer: <strong>${esc(orderRef)}</strong></p>
      </div>
      <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
        <p style="margin:0 0 16px;font-size:15px;line-height:1.5;">
          Beste financieel verantwoordelijke,<br/><br/>
          Er is een nieuwe bestelling geplaatst via overschrijving in de webshop van Scouts Kriko-M.
        </p>

        <div style="background:#F0ECE4;border-radius:10px;padding:16px 18px;margin-bottom:20px;">
          <h3 style="margin:0 0 10px;font-size:15px;color:#162544;">Overschrijvingsgegevens</h3>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:4px 0;color:#666;width:140px;">Koper:</td><td style="padding:4px 0;font-weight:bold;color:#162544;">${esc(customerName)} (${esc(email)})</td></tr>
            <tr><td style="padding:4px 0;color:#666;">Te ontvangen bedrag:</td><td style="padding:4px 0;font-weight:bold;font-size:16px;color:#650B19;">${euro(total)}</td></tr>
            <tr><td style="padding:4px 0;color:#666;">Mededeling:</td><td style="padding:4px 0;font-weight:bold;font-family:monospace;font-size:15px;color:#162544;letter-spacing:0.05em;">${esc(communication)}</td></tr>
          </table>
        </div>

        <h3 style="margin:0 0 10px;font-size:14px;color:#162544;">Bestelde Artikelen</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:14px;">${itemRows}</table>

        <div style="background:#EBF0F9;border:1px solid #CBD5E1;border-radius:8px;padding:12px 16px;font-size:13px;color:#162544;line-height:1.4;">
          Controleer de bankrekening op ontvangst van de betaling. Zodra het bedrag ontvangen is, kan de status in het leidingsportaal worden aangepast naar <strong>Betaald</strong>.
        </div>
      </div>
    </div>
  </body></html>`

  const text = [
    `Webshop Bestelling via Overschrijving (${orderRef})`,
    ``,
    `Beste financieel verantwoordelijke,`,
    `Er is een nieuwe bestelling geplaatst via overschrijving:`,
    ``,
    `Koper: ${customerName} (${email})`,
    `Te ontvangen bedrag: ${euro(total)}`,
    `Mededeling: ${communication}`,
    ``,
    `Bestelde artikelen:`,
    ...items.map((i) => `- ${i.quantity}x ${i.name} (${i.size}): ${euro(i.price * i.quantity)}`),
    ``,
    `Gelieve de bankrekening te controleren en de status in het portaal aan te passen naar Betaald zodra ontvangen.`,
  ].join('\n')

  const res = await resend.emails.send({
    from: FROM_WEBSHOP,
    to,
    subject: `Nieuwe bestelling overschrijving: ${orderRef} (${euro(total)}) — ${customerName}`,
    html,
    text,
  })

  if (res.error) {
    console.error('Resend fout bij verzenden financiële notificatie:', res.error)
  }
}

interface ContactFormNotificationParams {
  to?: string
  name: string
  email: string
  subject?: string
  message: string
}

export async function sendContactFormNotification(params: ContactFormNotificationParams) {
  const resend = getClient()
  if (!resend) {
    console.warn('⚠️ RESEND_API_KEY ontbreekt in environment variables; contactmail niet verstuurd.')
    return { ok: false, error: 'RESEND_API_KEY ontbreekt' }
  }

  const { name, email, subject, message } = params
  const to = params.to || 'groepsleiding@kriko-m.be'
  const emailSubject = subject?.trim()
    ? `[Contactformulier] ${subject.trim()} — ${name}`
    : `Nieuw bericht via het contactformulier — ${name}`

  const html = `<!doctype html><html><body style="margin:0;background:#F0ECE4;font-family:Arial,Helvetica,sans-serif;color:#2b2b2b;">
    <div style="max-width:600px;margin:0 auto;padding:24px;">
      <div style="background:#650B19;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
        <h1 style="margin:0;font-size:20px;">Nieuw Contactbericht</h1>
        <p style="margin:6px 0 0;opacity:.9;font-size:14px;">Ontvangen via het contactformulier op de website</p>
      </div>
      <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
        <div style="background:#F0ECE4;border-radius:10px;padding:16px 18px;margin-bottom:20px;">
          <h3 style="margin:0 0 10px;font-size:15px;color:#650B19;">Afzender</h3>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:4px 0;color:#666;width:120px;">Naam:</td><td style="padding:4px 0;font-weight:bold;">${esc(name)}</td></tr>
            <tr><td style="padding:4px 0;color:#666;">E-mailadres:</td><td style="padding:4px 0;"><a href="mailto:${esc(email)}" style="color:#650B19;font-weight:bold;">${esc(email)}</a></td></tr>
            ${subject?.trim() ? `<tr><td style="padding:4px 0;color:#666;">Onderwerp:</td><td style="padding:4px 0;font-weight:bold;">${esc(subject.trim())}</td></tr>` : ''}
          </table>
        </div>

        <h3 style="margin:0 0 10px;font-size:15px;color:#650B19;">Bericht</h3>
        <div style="background:#FAF8F5;border:1px solid #E5DFD5;border-radius:8px;padding:16px;white-space:pre-wrap;line-height:1.6;font-size:14px;color:#2B2B2B;">${esc(message)}</div>

        <p style="margin:24px 0 0;font-size:13px;color:#777;line-height:1.5;">
          Je kan direct op deze e-mail antwoorden om contact op te nemen met <strong>${esc(name)}</strong> (<a href="mailto:${esc(email)}" style="color:#650B19;">${esc(email)}</a>).
        </p>
      </div>
    </div>
  </body></html>`

  const text = [
    `Nieuw bericht via het contactformulier van Scouts Kriko-M`,
    ``,
    `Naam: ${name}`,
    `E-mailadres: ${email}`,
    ...(subject?.trim() ? [`Onderwerp: ${subject.trim()}`] : []),
    ``,
    `Bericht:`,
    message,
    ``,
    `---`,
    `Beantwoord deze e-mail om rechtstreeks te antwoorden naar ${email}.`,
  ].join('\n')

  const res = await resend.emails.send({
    from: FROM_CONTACT,
    to,
    replyTo: email,
    subject: emailSubject,
    html,
    text,
  })

  if (res.error) {
    console.error('⚠️ Resend fout bij verzenden contactmail:', res.error)
    return { ok: false, error: res.error }
  } else {
    console.log('✅ Contactformulier e-mail succesvol verzonden van', FROM_CONTACT, 'naar:', to, 'ID:', res.data?.id)
    return { ok: true, data: res.data }
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { Product, OrderItem } from '@/lib/types'
import { normalizeSettings } from '@/lib/db'
import { sendOrderConfirmation, sendWebshopOrderNotification, sendFinancialOrderNotification } from '@/lib/email'

// Eenvoudige mededeling en bestelnummer (bijv. KM-0001)
function generateCommunication(orderNumber: number): string {
  return `KM-${String(orderNumber).padStart(4, '0')}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { customer_name, child_name, child_tak, email, cart, kriko_hp_verify, _sec_token, payment_method } = body

    // 1. Slimme honeypot check tegen geautomatiseerde web-crawlers
    if (typeof kriko_hp_verify === 'string' && kriko_hp_verify.trim() !== '') {
      return NextResponse.json({ error: 'Ongeldig verzoek.' }, { status: 400 })
    }

    // 2. Script-timing check (minimaal 250ms om pure scriptbots te weren)
    const tokenTime = Number(_sec_token)
    if (tokenTime && Date.now() - tokenTime < 250) {
      return NextResponse.json({ error: 'Verzoek te snel verwerkt. Probeer het opnieuw.' }, { status: 400 })
    }

    // Basis-validatie (enkel Naam + E-mailadres verplicht)
    if (!customer_name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Vul je naam en e-mailadres in.' }, { status: 400 })
    }
    if (customer_name.length > 120 || email.length > 160) {
      return NextResponse.json({ error: 'Een van de velden is te lang.' }, { status: 400 })
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      return NextResponse.json({ error: 'Vul een geldig e-mailadres in.' }, { status: 400 })
    }
    if (!Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json({ error: 'Je winkelmandje is leeg.' }, { status: 400 })
    }

    const paymentMethod: 'overschrijving' | 'cash' = payment_method === 'cash' ? 'cash' : 'overschrijving'

    const supabase = createAdminClient()

    // Bank- en instellingsgegevens ophalen
    const { data: rawSettings } = await supabase
      .from('settings')
      .select('*')
      .single()
    const settings = normalizeSettings(rawSettings)
    const bankIban = settings?.bank_iban || 'BE59 7360 6413 2626'
    const bankHolder = settings?.bank_holder || 'Scouts Kriko-M vzw'
    const webshopEmail = settings?.webshop_email || 'groepsleiding@kriko-m.be'
    const webshopFinancialEmail = settings?.webshop_financial_email || ''
    const enableCustomerEmail = settings?.webshop_enable_customer_email !== false
    const enableTeamEmail = settings?.webshop_enable_team_email !== false
    const enableFinancialEmail = settings?.webshop_enable_financial_email !== false

    // Catalogus ophalen voor server-side prijsvalidatie
    const { data: products } = await supabase
      .from('shop_products')
      .select('id, name, price, sizes, active')
    const catalogue = new Map<string, Product>((products as Product[] ?? []).map((p: Product) => [p.id, p]))

    // Mandje valideren
    const validatedCart: OrderItem[] = []
    let total = 0
    for (const item of cart) {
      if (!item) continue
      const prod = catalogue.get(item.id)
      const name = prod?.name || item.name || 'Artikel'
      const price = prod && prod.price !== undefined ? Number(prod.price) : (Number(item.price) || 0)
      const qty = Math.min(Math.max(1, Number(item.quantity) || 1), 50)
      const size = item.size || 'Standaard'
      
      validatedCart.push({
        id: item.id || `item_${Date.now()}`,
        name,
        size,
        price,
        quantity: qty,
      })
      total += price * qty
    }

    if (validatedCart.length === 0) {
      return NextResponse.json({ error: 'Je winkelmandje bevat geen geldige artikelen.' }, { status: 400 })
    }

    // Bestelling aanmaken - probeer met 'niet_betaald', val terug op 'pending' indien schema constraint nog niet gemigreerd is
    let inserted: { id: string; order_number?: number; order_ref?: string } | null = null
    let insertError: Error | { message?: string } | null = null

    const orderPayload = {
      status: 'niet_betaald',
      payment_method: paymentMethod,
      customer_name: customer_name.trim(),
      child_name: child_name?.trim() || '',
      child_tak: child_tak || '',
      email: email.trim(),
      items: validatedCart,
      total,
      communication: '',
    }

    const firstAttempt = await supabase
      .from('orders')
      .insert(orderPayload)
      .select('id, order_number, order_ref')
      .single()

    if (firstAttempt.error) {
      // Als de constraint of kolom faalt vóór de SQL migratie, probeer fallback
      const fallbackAttempt = await supabase
        .from('orders')
        .insert({
          ...orderPayload,
          status: 'pending',
        })
        .select('id, order_number, order_ref')
        .single()
      
      inserted = fallbackAttempt.data
      insertError = fallbackAttempt.error
    } else {
      inserted = firstAttempt.data
      insertError = firstAttempt.error
    }

    if (insertError || !inserted) throw insertError ?? new Error('Insert mislukt')

    // Eenvoudige gestructureerde mededeling en order referentie KM-0001
    const orderNum = inserted.order_number || Math.floor(1000 + Math.random() * 9000)
    const communication = generateCommunication(orderNum)
    const orderRef = communication

    const { error: updateError } = await supabase
      .from('orders')
      .update({ communication })
      .eq('id', inserted.id)

    if (updateError) {
      console.warn('Kon communication niet updaten op order:', updateError)
    }

    // 1. E-mail naar koper
    if (enableCustomerEmail) {
      try {
        await sendOrderConfirmation({
          to: email.trim(),
          orderRef,
          customerName: customer_name.trim(),
          items: validatedCart,
          total,
          communication,
          bankIban,
          bankHolder,
          paymentMethod,
        })
      } catch (mailErr) {
        console.error('Koper bevestigingsmail mislukt:', mailErr)
      }
    }

    // 2. Notificatiemail naar webshopverantwoordelijke
    if (enableTeamEmail && webshopEmail) {
      try {
        await sendWebshopOrderNotification({
          to: webshopEmail,
          orderRef,
          customerName: customer_name.trim(),
          email: email.trim(),
          items: validatedCart,
          total,
          communication,
          bankIban,
          bankHolder,
          paymentMethod,
        })
      } catch (orderMailErr) {
        console.error('Notificatiemail mislukt:', orderMailErr)
      }
    }

    // 3. Notificatiemail naar financieel verantwoordelijke (enkel bij overschrijving)
    if (enableFinancialEmail && paymentMethod === 'overschrijving' && webshopFinancialEmail) {
      try {
        await sendFinancialOrderNotification({
          to: webshopFinancialEmail,
          orderRef,
          customerName: customer_name.trim(),
          email: email.trim(),
          items: validatedCart,
          total,
          communication,
          bankIban,
          bankHolder,
        })
      } catch (finMailErr) {
        console.error('Financiële notificatiemail mislukt:', finMailErr)
      }
    }

    return NextResponse.json({
      order_ref: orderRef,
      communication,
      total,
      items: validatedCart,
      bank_iban: bankIban,
      bank_holder: bankHolder,
      webshop_email: webshopEmail,
      payment_method: paymentMethod,
    })
  } catch (err) {
    console.error('Orders API error:', err)
    return NextResponse.json({ error: 'Server error. Probeer het opnieuw.' }, { status: 500 })
  }
}

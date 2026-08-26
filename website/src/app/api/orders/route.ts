import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { Product, OrderItem } from '@/lib/types'
import { sendOrderConfirmation, sendWebshopOrderNotification } from '@/lib/email'

// Eenvoudige mededeling en bestelnummer (bijv. KM-0001)
function generateCommunication(orderNumber: number): string {
  return `KM-${String(orderNumber).padStart(4, '0')}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { customer_name, child_name, child_tak, email, cart, website, _t } = body

    // Honeypot — bots vullen dit verborgen veld in; mensen niet.
    if (typeof website === 'string' && website.trim() !== '') {
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    // Bot-bescherming: als de bestelling binnen 1.5 seconde is ingediend (of _t ontbreekt), behandel als bot
    const timestamp = Number(_t)
    if (!timestamp || Date.now() - timestamp < 1500) {
      return NextResponse.json({ ok: true }, { status: 200 })
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

    const supabase = createAdminClient()

    // Bank- en instellingsgegevens ophalen (inclusief webshop_email)
    const { data: settings } = await supabase
      .from('settings')
      .select('*')
      .single()
    const bankIban = settings?.bank_iban || 'BE76 1234 5678 9012'
    const bankHolder = settings?.bank_holder || 'Scouts Kriko-M vzw'
    const webshopEmail = settings?.webshop_email || 'groepsleiding@kriko-m.be'

    // Catalogus ophalen voor server-side prijsvalidatie
    const { data: products } = await supabase
      .from('shop_products')
      .select('id, name, price, sizes, active')
      .eq('active', true)
    const catalogue = new Map<string, Product>((products as Product[] ?? []).map((p: Product) => [p.id, p]))

    // Mandje valideren
    const validatedCart: OrderItem[] = []
    let total = 0
    for (const item of cart) {
      const prod = catalogue.get(item.id)
      if (!prod || !item.quantity || item.quantity < 1) continue
      const sizes: string[] = prod.sizes ?? []
      const size = sizes.length === 0
        ? 'Standaard'
        : sizes.includes(item.size) ? item.size : sizes[0]
      const qty = Math.min(Number(item.quantity), 50)
      const price = Number(prod.price)
      validatedCart.push({ id: item.id, name: prod.name, size, price, quantity: qty })
      total += price * qty
    }

    if (validatedCart.length === 0) {
      return NextResponse.json({ error: 'Je winkelmandje bevat geen geldige artikelen.' }, { status: 400 })
    }

    // Bestelling aanmaken
    const { data: inserted, error: insertError } = await supabase
      .from('orders')
      .insert({
        status: 'pending',
        customer_name: customer_name.trim(),
        child_name: child_name?.trim() || '',
        child_tak: child_tak || '',
        email: email.trim(),
        items: validatedCart,
        total,
        communication: '',
      })
      .select('id, order_number, order_ref')
      .single()

    if (insertError || !inserted) throw insertError ?? new Error('Insert mislukt')

    // Eenvoudige mededeling en order referentie KM-0001
    const communication = generateCommunication(inserted.order_number)
    const orderRef = communication

    const { error: updateError } = await supabase
      .from('orders')
      .update({ communication })
      .eq('id', inserted.id)

    if (updateError) throw updateError

    // 1. E-mail naar koper
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
      })
    } catch (mailErr) {
      console.error('Koper bevestigingsmail mislukt:', mailErr)
    }

    // 2. Notificatiemail naar webshopverantwoordelijke
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
      })
    } catch (orderMailErr) {
      console.error('Notificatiemail mislukt:', orderMailErr)
    }

    return NextResponse.json({
      order_ref: orderRef,
      communication,
      total,
      items: validatedCart,
      bank_iban: bankIban,
      bank_holder: bankHolder,
      webshop_email: webshopEmail,
    })
  } catch (err) {
    console.error('Orders API error:', err)
    return NextResponse.json({ error: 'Server error. Probeer het opnieuw.' }, { status: 500 })
  }
}

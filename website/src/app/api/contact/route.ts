import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { sendContactFormNotification } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message, website, _t } = await req.json()

    // Honeypot — bots vullen dit verborgen veld in.
    if (typeof website === 'string' && website.trim() !== '') {
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    // Bot-bescherming: als het formulier binnen 1.5 seconde is ingediend (of _t ontbreekt), behandel als bot
    const timestamp = Number(_t)
    if (!timestamp || Date.now() - timestamp < 1500) {
      // Stilzwijgend succes teruggeven zodat de bot denkt dat het gelukt is en niet blijft proberen
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Verplichte velden ontbreken' }, { status: 400 })
    }
    // Lengtelimieten tegen misbruik / oversized payloads.
    if (name.length > 120 || email.length > 160 || (subject?.length ?? 0) > 200 || message.length > 5000) {
      return NextResponse.json({ error: 'Een van de velden is te lang.' }, { status: 400 })
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      return NextResponse.json({ error: 'Vul een geldig e-mailadres in.' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Zoek het contact e-mailadres uit de settings (standaard groepsleiding@kriko-m.be)
    let targetEmail = 'groepsleiding@kriko-m.be'
    try {
      const { data: settings } = await supabase.from('settings').select('contact_email').single()
      if (settings?.contact_email && typeof settings.contact_email === 'string' && settings.contact_email.trim() !== '') {
        targetEmail = settings.contact_email.trim()
      }
    } catch (settingsErr) {
      console.warn('Kon contact_email niet ophalen uit settings; standaard naar groepsleiding@kriko-m.be:', settingsErr)
    }

    const emailResult = await sendContactFormNotification({
      to: targetEmail,
      name: name.trim(),
      email: email.trim(),
      subject: subject?.trim(),
      message: message.trim(),
    })

    if (!emailResult?.ok) {
      console.error('⚠️ Contactformulier e-mail verzenden mislukt:', emailResult?.error)
      return NextResponse.json({ error: 'Het versturen van de e-mail is mislukt. Probeer het later opnieuw.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('❌ Server error in /api/contact:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { requireGroepsleiding } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

export async function GET() {
  const user = await requireGroepsleiding()
  if (!user) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  try {
    const admin = createAdminClient()
    const { data: usersData, error } = await admin.auth.admin.listUsers()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const users = usersData?.users || []

    const leiding = users.find(u => u.email === 'leiding@kriko-m.be')
    const groepsleiding = users.find(u => u.email === 'groepsleiding@kriko-m.be')
    const webshop = users.find(u => u.email === 'webshop@kriko-m.be')

    return NextResponse.json({
      accounts: [
        {
          id: leiding?.id || null,
          role: 'leiding',
          email: leiding?.email || 'leiding@kriko-m.be',
          naam: leiding?.user_metadata?.naam || 'Leiding',
          password: leiding?.user_metadata?.portal_password || '',
        },
        {
          id: groepsleiding?.id || null,
          role: 'groepsleiding',
          email: groepsleiding?.email || 'groepsleiding@kriko-m.be',
          naam: groepsleiding?.user_metadata?.naam || 'Groepsleiding',
          password: groepsleiding?.user_metadata?.portal_password || '',
        },
        {
          id: webshop?.id || null,
          role: 'webshop',
          email: webshop?.email || 'webshop@kriko-m.be',
          naam: webshop?.user_metadata?.naam || 'Webshop & uniformen',
          password: webshop?.user_metadata?.portal_password || '',
        },
      ]
    })
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error)?.message || 'Server fout' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const currentUser = await requireGroepsleiding()
  if (!currentUser) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { role, newName, newPassword } = body

    if (!role || (role !== 'leiding' && role !== 'groepsleiding' && role !== 'webshop')) {
      return NextResponse.json({ error: 'Ongeldige rol gespecificeerd.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: usersData } = await admin.auth.admin.listUsers()
    const users = usersData?.users || []

    const targetEmail = role === 'leiding' ? 'leiding@kriko-m.be' : role === 'groepsleiding' ? 'groepsleiding@kriko-m.be' : 'webshop@kriko-m.be'
    const targetUser = users.find(u => u.email === targetEmail)

    const updatePayload: Record<string, unknown> = {}
    const updatedMetadata = { ...(targetUser?.user_metadata || {}) }
    let metadataChanged = false

    if (newName && newName.trim()) {
      updatedMetadata.naam = newName.trim()
      metadataChanged = true
    }

    if (newPassword && newPassword.trim()) {
      if (newPassword.trim().length < 6) {
        return NextResponse.json({ error: 'Wachtwoord moet minstens 6 tekens lang zijn.' }, { status: 400 })
      }
      updatePayload.password = newPassword.trim()
      updatedMetadata.portal_password = newPassword.trim()
      metadataChanged = true
    }

    if (metadataChanged) {
      updatePayload.user_metadata = updatedMetadata
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ message: 'Geen wijzigingen opgegeven.' })
    }

    if (!targetUser) {
      // Create user if not existing yet
      const defaultNaam = role === 'leiding' ? 'Leiding' : role === 'groepsleiding' ? 'Groepsleiding' : 'Webshop & uniformen'
      const initialPassword = newPassword?.trim() || `Kriko-${crypto.randomUUID()}`
      const { error: createError } = await admin.auth.admin.createUser({
        email: targetEmail,
        password: initialPassword,
        email_confirm: true,
        app_metadata: { role },
        user_metadata: {
          naam: newName?.trim() || defaultNaam,
          ...(newPassword?.trim() ? { portal_password: newPassword.trim() } : {}),
        },
      })
      if (createError) throw createError
      return NextResponse.json({ success: true, message: 'Account succesvol aangemaakt en bijgewerkt.' })
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(targetUser.id, updatePayload)
    if (updateError) throw updateError

    return NextResponse.json({ success: true, message: 'Account succesvol bijgewerkt!' })
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error)?.message || 'Server fout bij bijwerken van account' }, { status: 500 })
  }
}

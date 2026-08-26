import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { requireGroepsleiding } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const user = await requireGroepsleiding()
  if (!user) return NextResponse.json({ error: 'Enkel groepsleiding mag categorieën verwijderen.' }, { status: 403 })

  try {
    const body = await req.json()
    const { category } = body

    if (!category || !String(category).trim()) {
      return NextResponse.json({ error: 'Categorienaam is verplicht' }, { status: 400 })
    }

    const catName = String(category).trim()
    if (catName.toLowerCase() === 'groeps') {
      return NextResponse.json({ error: 'De categorie Groeps kan niet worden verwijderd.' }, { status: 400 })
    }
    const admin = createAdminClient()

    // Move resources associated with this category to 'Algemeen'
    const { error } = await admin
      .from('portal_resources')
      .update({ category: 'Algemeen', updated_at: new Date().toISOString() })
      .eq('category', catName)

    if (error) {
      console.error('Error deleting category:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, category: catName })
  } catch (err) {
    console.error('Error in POST delete-category:', err)
    return NextResponse.json({ error: 'Interne fout bij verwijderen van categorie' }, { status: 500 })
  }
}

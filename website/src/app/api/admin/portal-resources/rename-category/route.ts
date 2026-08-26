import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { requireGroepsleiding } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const user = await requireGroepsleiding()
  if (!user) return NextResponse.json({ error: 'Enkel groepsleiding mag categorieën bewerken.' }, { status: 403 })

  try {
    const body = await req.json()
    const { oldCategory, newCategory } = body

    if (!oldCategory || !newCategory || !String(oldCategory).trim() || !String(newCategory).trim()) {
      return NextResponse.json({ error: 'Categorienamen zijn verplicht' }, { status: 400 })
    }

    const oldName = String(oldCategory).trim()
    const newName = String(newCategory).trim()

    if (oldName.toLowerCase() === 'groeps') {
      return NextResponse.json({ error: 'De categorie Groeps kan niet worden hernoemd.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from('portal_resources')
      .update({ category: newName, updated_at: new Date().toISOString() })
      .eq('category', oldName)

    if (error) {
      console.error('Error renaming category:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, oldCategory: oldName, newCategory: newName })
  } catch (err) {
    console.error('Error in POST rename-category:', err)
    return NextResponse.json({ error: 'Interne fout bij hernoemen van categorie' }, { status: 500 })
  }
}

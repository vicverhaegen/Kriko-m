import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params
  // Enkel een platte bestandsnaam toelaten — geen pad-traversal (../) of subpaden
  // waarmee men de echos-bucket zou kunnen verlaten.
  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
    return NextResponse.json({ error: 'Ongeldige bestandsnaam' }, { status: 400 })
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const url = `${supabaseUrl}/storage/v1/object/public/echos/${encodeURIComponent(filename)}`
  return NextResponse.redirect(url, {
    status: 307,
    headers: {
      'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
    },
  })
}

import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { createAdminClient } from '@/lib/supabase'
import { requireLeiding } from '@/lib/auth'
import { getActiveWerkjaar } from '@/lib/db'
import { revalidateTag } from 'next/cache'

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB
// Toegestane MIME-types → extensie. Extensie wordt afgeleid van het
// gevalideerde MIME-type, niet van file.name (dat is door de client te spoofen).
const ALLOWED_MIME: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/pjpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/avif': 'avif',
  // Presentaties (enkel zinvol voor kamp-bijlagen, type 'presentatie').
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
}
// Omslagfoto's & productfoto's: enkel afbeeldingen.
const IMAGE_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'image/avif',
])

/**
 * Optimaliseert een afbeelding met sharp:
 * - Draait de foto automatisch op basis van EXIF (smartphone stand)
 * - Herschaalt naar max 1920x1920px (behoud verhouding)
 * - Comprimeert naar WebP (kwaliteit 82) voor maximale besparing op bestandsgrootte
 */
async function optimizeImageBuffer(
  buffer: Buffer,
  mimeType: string
): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  if (!IMAGE_MIME.has(mimeType)) {
    return {
      buffer,
      contentType: mimeType,
      ext: ALLOWED_MIME[mimeType] || 'bin',
    }
  }

  try {
    const optimizedBuffer = await sharp(buffer)
      .rotate() // Automatische EXIF-oriëntatie correctie
      .resize({
        width: 1920,
        height: 1920,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer()

    return {
      buffer: optimizedBuffer,
      contentType: 'image/webp',
      ext: 'webp',
    }
  } catch (err) {
    console.error('Fout bij verwerken afbeelding met sharp, valt terug op origineel:', err)
    return {
      buffer,
      contentType: mimeType,
      ext: ALLOWED_MIME[mimeType] || 'jpg',
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireLeiding()
    if (!user) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const uploadType = formData.get('type') as string | null

    if (!file || !uploadType) {
      return NextResponse.json({ error: 'Bestand en type zijn verplicht' }, { status: 400 })
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Bestand is te groot (max. 10 MB).' }, { status: 400 })
    }

    let effectiveMime = file.type
    if (!effectiveMime || !ALLOWED_MIME[effectiveMime]) {
      const extMatch = file.name.split('.').pop()?.toLowerCase()
      if (extMatch === 'jpg' || extMatch === 'jpeg') effectiveMime = 'image/jpeg'
      else if (extMatch === 'png') effectiveMime = 'image/png'
      else if (extMatch === 'webp') effectiveMime = 'image/webp'
      else if (extMatch === 'pdf') effectiveMime = 'application/pdf'
      else if (extMatch === 'gif') effectiveMime = 'image/gif'
      else if (extMatch === 'heic') effectiveMime = 'image/heic'
      else if (extMatch === 'pptx') effectiveMime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    }

    const initialExt = ALLOWED_MIME[effectiveMime]
    if (!initialExt) {
      return NextResponse.json({ error: 'Bestandstype niet toegestaan. Enkel PDF, JPG, PNG of WebP.' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const rawBuffer = Buffer.from(arrayBuffer)

    // Automatische compressie en herschaling via sharp indien het een foto betreft
    const { buffer, contentType, ext } = await optimizeImageBuffer(rawBuffer, effectiveMime)

    const admin = createAdminClient()
    const oldUrl = formData.get('oldUrl') as string | null

    /**
     * Verwijdert het oude bestand uit de storage bucket als oldUrl is meegegeven
     */
    async function cleanupOldFile(bucket: string, url: string | null) {
      if (!url) return
      try {
        const cleanUrl = url.split('?')[0]
        const urlParts = cleanUrl.split('/')
        const filename = urlParts[urlParts.length - 1]
        if (filename && !filename.startsWith('http') && filename.length > 3) {
          await admin.storage.from(bucket).remove([filename])
        }
      } catch (err) {
        console.error('Fout bij automatisch opruimen oud bestand:', err)
      }
    }

    if (uploadType === 'evenement-cover' || uploadType === 'evenement-banner' || uploadType === 'evenement-document') {
      const isImageType = uploadType === 'evenement-cover' || uploadType === 'evenement-banner'
      if (isImageType && !IMAGE_MIME.has(file.type)) {
        return NextResponse.json({ error: 'Afbeelding moet een JPG, PNG of WebP zijn.' }, { status: 400 })
      }
      const bucket = isImageType ? 'kamp-fotos' : 'kamp-bestanden'
      await cleanupOldFile(bucket, oldUrl)

      const prefix = uploadType === 'evenement-cover' ? 'ev-cover' : uploadType === 'evenement-banner' ? 'ev-banner' : 'ev-doc'
      const filename = `${prefix}-${Date.now()}.${ext}`

      const { error: storageError } = await admin.storage
        .from(bucket)
        .upload(filename, buffer, { contentType, upsert: true })
      if (storageError) throw storageError

      const { data: pub } = admin.storage.from(bucket).getPublicUrl(filename)
      return NextResponse.json({ url: pub.publicUrl })
    }

    if (uploadType === 'echo') {
      const echoTak = formData.get('echoTak') as string | null
      const echoMonth = formData.get('echoMonth') as string | null
      const echoYear = formData.get('echoYear') as string | null

      if (!echoTak || !echoMonth || !echoYear) {
        return NextResponse.json({ error: 'echoTak, echoMonth en echoYear zijn verplicht' }, { status: 400 })
      }

      // Controleer of er al een Kriko Echo bestaat voor deze maand & jaar voor deze tak (max 1 per maand)
      const { data: existingEcho } = await admin
        .from('echos')
        .select('id')
        .eq('tak', echoTak)
        .eq('month', Number(echoMonth))
        .eq('year', Number(echoYear))
        .maybeSingle()

      if (existingEcho) {
        return NextResponse.json({
          error: `Er bestaat al een Kriko Echo voor deze maand. Verwijder eerst de bestaande Echo als je deze wilt vervangen.`
        }, { status: 400 })
      }

      await cleanupOldFile('echos', oldUrl)
      const filename = `echo-${echoYear}-${echoMonth}-${echoTak}-${Date.now()}.${ext}`
      const capitalizedTak = echoTak.charAt(0).toUpperCase() + echoTak.slice(1)
      const title = `Kriko Echo ${capitalizedTak} ${echoMonth}/${echoYear}`

      // Upload naar storage
      const { error: storageError } = await admin.storage
        .from('echos')
        .upload(filename, buffer, { contentType, upsert: true })

      if (storageError) throw storageError

      // Database invoegen
      const { data, error: dbError } = await admin
        .from('echos')
        .insert({
          title,
          month: Number(echoMonth),
          year: Number(echoYear),
          tak: echoTak,
          file_name: filename,
          approved: false,
          werkjaar: await getActiveWerkjaar(),
        })
        .select()
        .single()

      if (dbError) throw dbError

      revalidateTag('echos', 'max')
      return NextResponse.json(data)
    }

    if (uploadType === 'portal-document') {
      await cleanupOldFile('kamp-bestanden', oldUrl)
      const filename = `doc-${Date.now()}.${ext}`

      const { error: storageError } = await admin.storage
        .from('kamp-bestanden')
        .upload(filename, buffer, { contentType, upsert: true })

      if (storageError) throw storageError

      const { data: pub } = admin.storage.from('kamp-bestanden').getPublicUrl(filename)
      return NextResponse.json({ url: pub.publicUrl })
    }

    if (uploadType === 'tak-leiding-foto' || uploadType.startsWith('tak-foto-') || uploadType.startsWith('tak-')) {
      if (!IMAGE_MIME.has(effectiveMime)) {
        return NextResponse.json({ error: 'Leidingsfoto moet een afbeelding zijn (JPG, PNG, WebP of HEIC).' }, { status: 400 })
      }

      await cleanupOldFile('kamp-fotos', oldUrl)
      const filename = `tak-leiding-${Date.now()}.${ext}`

      const { error: storageError } = await admin.storage
        .from('kamp-fotos')
        .upload(filename, buffer, { contentType, upsert: true })

      if (storageError) throw storageError

      const { data: pub } = admin.storage.from('kamp-fotos').getPublicUrl(filename)
      return NextResponse.json({ url: pub.publicUrl, filename })
    }

    if (uploadType === 'home-leiding-foto' || uploadType === 'portal-login-foto') {
      if (!IMAGE_MIME.has(effectiveMime)) {
        return NextResponse.json({ error: 'Foto moet een afbeelding zijn (JPG, PNG, WebP of HEIC).' }, { status: 400 })
      }

      await cleanupOldFile('kamp-fotos', oldUrl)
      const filename = `${uploadType}-${Date.now()}.${ext}`

      const { error: storageError } = await admin.storage
        .from('kamp-fotos')
        .upload(filename, buffer, { contentType, upsert: true })

      if (storageError) throw storageError

      const { data: pub } = admin.storage.from('kamp-fotos').getPublicUrl(filename)
      return NextResponse.json({ url: pub.publicUrl, filename })
    }

    if (uploadType === 'shop-product-foto') {
      if (!IMAGE_MIME.has(effectiveMime)) {
        return NextResponse.json({ error: 'Productfoto moet een afbeelding zijn (JPG, PNG, WebP of HEIC).' }, { status: 400 })
      }

      await cleanupOldFile('kamp-fotos', oldUrl)
      const productId = formData.get('productId') as string | null
      const filename = `shop-product-${productId || 'item'}-${Date.now()}.${ext}`

      const { error: storageError } = await admin.storage
        .from('kamp-fotos')
        .upload(filename, buffer, { contentType, upsert: true })

      if (storageError) throw storageError

      const { data: pub } = admin.storage.from('kamp-fotos').getPublicUrl(filename)
      return NextResponse.json({ url: pub.publicUrl, filename })
    }

    if (
      uploadType === 'site-content' ||
      uploadType === 'home-hero-foto' ||
      uploadType === 'verhuur' ||
      uploadType === 'tak-banner' ||
      uploadType === 'general-photo'
    ) {
      if (!IMAGE_MIME.has(effectiveMime)) {
        return NextResponse.json({ error: 'Foto moet een geldig afbeeldingsformaat zijn (JPG, PNG, WebP of HEIC).' }, { status: 400 })
      }

      await cleanupOldFile('kamp-fotos', oldUrl)
      const filename = `site-${uploadType}-${Date.now()}.${ext}`

      const { error: storageError } = await admin.storage
        .from('kamp-fotos')
        .upload(filename, buffer, { contentType, upsert: true })

      if (storageError) throw storageError

      const { data: pub } = admin.storage.from('kamp-fotos').getPublicUrl(filename)
      return NextResponse.json({ url: pub.publicUrl, filename })
    }

    return NextResponse.json({ error: 'Ongeldig uploadtype' }, { status: 400 })
  } catch (err) {
    console.error('Upload API error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Serverfout bij uploaden' }, { status: 500 })
  }
}


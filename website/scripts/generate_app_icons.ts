import sharp from 'sharp'
import path from 'path'
import fs from 'fs'

const LOGO_PATH = path.join(process.cwd(), 'public', 'images', 'logo-finaal.png')
const PUBLIC_DIR = path.join(process.cwd(), 'public', 'images')
const APP_DIR = path.join(process.cwd(), 'src', 'app')

const BORDEAUX_BG = { r: 101, g: 11, b: 25, alpha: 1 } // #650B19

async function generateIcons() {
  if (!fs.existsSync(LOGO_PATH)) {
    console.error('Logo file not found:', LOGO_PATH)
    process.exit(1)
  }

  // 1. Generate 512x512 app icon
  const logo512 = await sharp(LOGO_PATH)
    .resize(400, 400, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer()

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: BORDEAUX_BG,
    },
  })
    .composite([{ input: logo512, gravity: 'center' }])
    .png()
    .toFile(path.join(PUBLIC_DIR, 'app-icon-512.png'))

  console.log('Created app-icon-512.png')

  // 2. Generate 192x192 app icon
  const logo192 = await sharp(LOGO_PATH)
    .resize(150, 150, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer()

  await sharp({
    create: {
      width: 192,
      height: 192,
      channels: 4,
      background: BORDEAUX_BG,
    },
  })
    .composite([{ input: logo192, gravity: 'center' }])
    .png()
    .toFile(path.join(PUBLIC_DIR, 'app-icon-192.png'))

  console.log('Created app-icon-192.png')

  // 3. Generate 180x180 Apple Touch Icon
  const logo180 = await sharp(LOGO_PATH)
    .resize(140, 140, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer()

  const appleIcon = await sharp({
    create: {
      width: 180,
      height: 180,
      channels: 4,
      background: BORDEAUX_BG,
    },
  })
    .composite([{ input: logo180, gravity: 'center' }])
    .png()
    .toBuffer()

  fs.writeFileSync(path.join(PUBLIC_DIR, 'apple-touch-icon.png'), appleIcon)
  fs.writeFileSync(path.join(APP_DIR, 'apple-icon.png'), appleIcon)

  console.log('Created apple-touch-icon.png and src/app/apple-icon.png')
}

generateIcons().catch(console.error)

/**
 * Anti-scraping and obfuscation utilities.
 * Prevents regex crawlers, static scrapers and spambots from harvesting
 * emails, phone numbers, WhatsApp invite links and IBAN numbers.
 */

const XOR_KEY = 0x5a

export function obfuscateText(str: string): string {
  if (!str) return ''
  return str
    .split('')
    .map((c) => (c.charCodeAt(0) ^ XOR_KEY).toString(16).padStart(2, '0'))
    .join('')
}

export function deobfuscateText(hex: string): string {
  if (!hex || typeof hex !== 'string') return ''
  try {
    const bytes: string[] = []
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(String.fromCharCode(parseInt(hex.slice(i, i + 2), 16) ^ XOR_KEY))
    }
    return bytes.join('')
  } catch {
    return ''
  }
}

export function reverseText(str: string): string {
  if (!str) return ''
  return str.split('').reverse().join('')
}

/**
 * Shared utility functions across the application.
 */

/**
 * Formats a numerical amount in euro format: e.g. 12 -> "€12,00"
 */
export function formatPrice(val: number): string {
  return '€' + (val || 0).toFixed(2).replace('.', ',')
}

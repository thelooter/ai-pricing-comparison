import { ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a numeric price value to display with currency symbol and unit
 * @param price - The numeric price value
 * @param options - Formatting options
 * @returns Formatted price string (e.g. "$3.00 / 1M tokens")
 */
export function formatPrice(price: number, options?: { 
  currency?: string, 
  unit?: string,
  fractionDigits?: number,
  includeUnit?: boolean
}) {
  const {
    currency = "$",
    unit = "/ 1M tokens",
    fractionDigits = 2,
    includeUnit = true
  } = options || {}

  return `${currency}${price.toFixed(fractionDigits)}${includeUnit ? ` ${unit}` : ''}`
}

/**
 * Extracts a numeric price value from a formatted price string
 * @param formattedPrice - The formatted price string (e.g. "$3.00 / 1M tokens")
 * @returns The numeric price value or null if parsing failed
 */
export function parsePrice(formattedPrice: string): number | null {
  // Extract the numeric part after the currency symbol and before the unit
  const match = formattedPrice.match(/\$(\d+\.\d+)/)
  if (match && match[1]) {
    return parseFloat(match[1])
  }
  return null
}

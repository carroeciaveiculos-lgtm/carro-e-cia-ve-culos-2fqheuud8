/* General utility functions (exposes cn) */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges multiple class names into a single string
 * @param inputs - Array of class names
 * @returns Merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sanitizePhone(value: string): string {
  return (value || '').replace(/\D/g, '')
}

export function extractFinalPlaca(placa: string): string {
  return (placa || '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(-1)
    .toUpperCase()
}

// Tira as tags HTML de um texto gerado pelo RichTextEditor — usado onde só o
// texto puro importa (prévia truncada de lista, resumo pra redes sociais).
export function stripHtml(html: string): string {
  return (html || '')
    .replace(/<(br|\/p|\/div|\/li)>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

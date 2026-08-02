export function validateHMAC(rawBody: string, signatureHeader: string, secret: string): boolean {
  if (!signatureHeader || !secret) return false
  const parts = signatureHeader.split(',')
  let receivedHash = ''
  for (const part of parts) {
    const [key, value] = part.split('=')
    if (key.trim() === 'v1') {
      receivedHash = value.trim()
      break
    }
  }
  if (!receivedHash) return false
  const key = new TextEncoder().encode(secret)
  const message = new TextEncoder().encode(rawBody)
  const crypto = globalThis.crypto
  return crypto.subtle
    .importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    .then((cryptoKey) => crypto.subtle.sign('HMAC', cryptoKey, message))
    .then((signature) => {
      const hashArray = Array.from(new Uint8Array(signature))
      const computedHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
      return constantTimeEqual(computedHash, receivedHash)
    })
}

export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

export async function validateHMACAsync(
  rawBody: string,
  signatureHeader: string,
  secret: string,
): Promise<boolean> {
  try {
    return await validateHMAC(rawBody, signatureHeader, secret)
  } catch {
    return false
  }
}

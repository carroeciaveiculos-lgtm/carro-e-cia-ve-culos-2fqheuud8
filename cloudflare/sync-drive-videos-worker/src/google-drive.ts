// Cópia de supabase/functions/_shared/google-drive.ts — mesma lógica, só
// duplicada aqui porque o Worker não compartilha pasta de deploy com as
// Edge Functions do Supabase. Qualquer correção de auth/listagem do Drive
// feita lá deve ser replicada aqui também.

export interface DriveItem {
  id: string
  name: string
  mimeType: string
}

function base64url(data: Uint8Array | string): string {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemContents = pem
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '')
  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0))
  return crypto.subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )
}

export async function getAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  const headerB64 = base64url(JSON.stringify(header))
  const payloadB64 = base64url(JSON.stringify(payload))
  const unsigned = `${headerB64}.${payloadB64}`

  const key = await importPrivateKey(privateKey)
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(unsigned),
  )

  const jwt = `${unsigned}.${base64url(new Uint8Array(signature))}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!res.ok) {
    throw new Error(`Failed to get Google access token: ${await res.text()}`)
  }

  const data = await res.json()
  return data.access_token
}

export async function listDriveItems(
  accessToken: string,
  folderId: string,
  foldersOnly: boolean,
): Promise<DriveItem[]> {
  const mimeTypeFilter = foldersOnly
    ? `and mimeType='application/vnd.google-apps.folder'`
    : `and mimeType!='application/vnd.google-apps.folder'`

  const q = `'${folderId}' in parents and trashed=false ${mimeTypeFilter}`
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&orderBy=name&fields=files(id,name,mimeType)&pageSize=1000`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) throw new Error(`Drive API error: ${await res.text()}`)
  const data = await res.json()
  return data.files || []
}

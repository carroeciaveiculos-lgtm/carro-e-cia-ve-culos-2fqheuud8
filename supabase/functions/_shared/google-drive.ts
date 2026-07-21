export interface DriveItem {
  id: string
  name: string
  mimeType: string
}

export interface DownloadedFile {
  blob: Blob
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

  let allFiles: DriveItem[] = []
  let pageToken: string | undefined

  do {
    let url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType),nextPageToken&pageSize=1000`
    if (pageToken) {
      url += `&pageToken=${encodeURIComponent(pageToken)}`
    }

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!res.ok) throw new Error(`Drive API error: ${await res.text()}`)
    const data = await res.json()
    allFiles = allFiles.concat(data.files || [])
    pageToken = data.nextPageToken
  } while (pageToken)

  return allFiles
}

export async function downloadDriveFile(
  accessToken: string,
  fileId: string,
): Promise<DownloadedFile> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`Download failed for ${fileId}: ${await res.text()}`)
  const blob = await res.blob()
  return { blob, mimeType: res.headers.get('content-type') || 'image/jpeg' }
}

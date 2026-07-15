const TARGET_WIDTH = 1200
const TARGET_HEIGHT = 1540

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })
}

export async function resizeImage(
  file: File,
  targetWidth = TARGET_WIDTH,
  targetHeight = TARGET_HEIGHT,
): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    return file
  }

  const img = await loadImage(file)

  if (img.width === targetWidth && img.height === targetHeight) {
    return file
  }

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) return file

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, targetWidth, targetHeight)

  const scale = Math.max(targetWidth / img.width, targetHeight / img.height)
  const scaledWidth = img.width * scale
  const scaledHeight = img.height * scale
  const x = (targetWidth - scaledWidth) / 2
  const y = (targetHeight - scaledHeight) / 2

  ctx.drawImage(img, x, y, scaledWidth, scaledHeight)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to create blob'))
      },
      'image/jpeg',
      0.92,
    )
  })
}

export async function resizeImages(
  files: File[],
  targetWidth = TARGET_WIDTH,
  targetHeight = TARGET_HEIGHT,
): Promise<Blob[]> {
  return Promise.all(
    files.map((file) => resizeImage(file, targetWidth, targetHeight).catch(() => file)),
  )
}

export async function prepareProfileImage(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error('Elige una imagen PNG, JPEG o WebP de hasta 5 MB.')
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const scale = Math.min(1, 1600 / Math.max(image.width, image.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.width * scale))
    canvas.height = Math.max(1, Math.round(image.height * scale))
    const context = canvas.getContext('2d')
    context.fillStyle = '#111c2d'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    let source = canvas.toDataURL('image/jpeg', 0.85)
    if (source.length > 1000000) source = canvas.toDataURL('image/jpeg', 0.6)
    if (source.length > 1000000) throw new Error('Elige una imagen de menor resolución.')
    return source
  } finally { URL.revokeObjectURL(url) }
}


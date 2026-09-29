export const defaultCrop = { fit: 'cover', zoom: 1, x: 50, y: 50 }
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

export function cropGeometry(imageWidth, imageHeight, width, height, options) {
  const scale = (options.fit === 'cover' ? Math.max : Math.min)(width / imageWidth, height / imageHeight) * options.zoom
  const drawWidth = imageWidth * scale, drawHeight = imageHeight * scale
  return { width: drawWidth, height: drawHeight, freeX: width - drawWidth, freeY: height - drawHeight, left: (width - drawWidth) * options.x / 100, top: (height - drawHeight) * options.y / 100 }
}

// Los desplazamientos están expresados en píxeles del canvas, no de la pantalla.
export function moveCrop(options, geometry, deltaX, deltaY) {
  return { ...options, x: Math.abs(geometry.freeX) < 0.01 ? options.x : clamp(options.x + deltaX / geometry.freeX * 100, 0, 100), y: Math.abs(geometry.freeY) < 0.01 ? options.y : clamp(options.y + deltaY / geometry.freeY * 100, 0, 100) }
}

export function encodeImage(canvas, limit = 1000000) {
  for (const quality of [0.85, 0.7, 0.55]) {
    const result = canvas.toDataURL('image/jpeg', quality)
    if (result.length <= limit) return result
  }
  throw new Error('La imagen es demasiado grande. Elige una imagen de menor resolución.')
}

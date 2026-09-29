import { describe, expect, test } from '@jest/globals'
import { cropGeometry, defaultCrop, moveCrop } from './profileCrop.js'

describe('Encuadre de foto sin áreas vacías en modo recortar', () => {
  test('una foto horizontal se desplaza en la dirección del arrastre y se limita al borde', () => {
    const geometry = cropGeometry(1000, 500, 480, 480, defaultCrop)
    expect(geometry).toMatchObject({ width: 960, height: 480, left: -240, top: 0 })
    expect(moveCrop(defaultCrop, geometry, 120, 90)).toMatchObject({ x: 25, y: 50 })
    expect(moveCrop(defaultCrop, geometry, 9999, 0).x).toBe(0)
    expect(moveCrop(defaultCrop, geometry, -9999, 0).x).toBe(100)
  })
  test('zoom y foto vertical permiten mover el eje correspondiente sin producir NaN', () => {
    const options = { ...defaultCrop, zoom: 2 }
    const geometry = cropGeometry(500, 1000, 480, 480, options)
    const moved = moveCrop(options, geometry, -100, 100)
    expect(moved.x).toBeGreaterThan(50)
    expect(moved.y).toBeLessThan(50)
    const square = cropGeometry(480, 480, 480, 480, defaultCrop)
    expect(moveCrop(defaultCrop, square, 40, 40)).toEqual(defaultCrop)
  })
  test('imagen completa conserva el tamaño y permite posicionarla en sus márgenes', () => {
    const options = { ...defaultCrop, fit: 'contain' }
    const geometry = cropGeometry(1000, 500, 480, 480, options)
    expect(geometry).toMatchObject({ width: 480, height: 240, left: 0, top: 120 })
    expect(moveCrop(options, geometry, 50, 60)).toMatchObject({ x: 50, y: 75 })
  })
})

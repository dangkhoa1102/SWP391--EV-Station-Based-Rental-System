/**
 * Generate a data URI for a placeholder image
 * This avoids external network requests to via.placeholder.com
 */
export const createPlaceholderImage = (text = '', width = 400, height = 280) => {
  const encoded = encodeURIComponent(text)
  // Create a simple SVG with text
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="#e0e0e0"/>
    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" fill="#999" text-anchor="middle" dominant-baseline="middle">${encoded}</text>
  </svg>`
  
  // Convert to base64 data URI
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

// Common placeholder sizes
export const PLACEHOLDER = {
  car: (name = 'Car') => createPlaceholderImage(name, 440, 280),
  avatar: (initial = '?') => createPlaceholderImage(initial, 100, 100),
  avatarLarge: (initial = '?') => createPlaceholderImage(initial, 180, 180),
  small: (text = '') => createPlaceholderImage(text, 160, 100)
}

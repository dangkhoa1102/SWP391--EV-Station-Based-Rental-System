/**
 * Car icon SVG for fallback when image is not available
 * Returns a data URI with a car icon
 */
export const getCarIconSvg = () => {
  return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="2"><path d="M3 9l1-3h16l1 3M3 9v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9M3 9h18M7 13a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm10 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/></svg>';
}

/**
 * Apply car icon as fallback to an image element
 */
export const applyCarIconFallback = (imgElement) => {
  if (!imgElement) return;
  imgElement.style.objectFit = 'contain';
  imgElement.style.backgroundColor = '#f0f0f0';
  imgElement.src = getCarIconSvg();
}

/**
 * Get image URL or car icon if URL is empty/null
 * @param {string} imageUrl - The image URL from database
 * @returns {string} Either the image URL or car icon SVG
 */
export const getImageUrlOrIcon = (imageUrl) => {
  // If no URL or empty string, return icon
  if (!imageUrl || (typeof imageUrl === 'string' && imageUrl.trim() === '')) {
    return getCarIconSvg();
  }
  return imageUrl;
}

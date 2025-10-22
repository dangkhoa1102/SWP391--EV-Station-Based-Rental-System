export const CLOUD_NAME = 'YOUR_CLOUD_NAME'
export const UPLOAD_PRESET = 'YOUR_UPLOAD_PRESET'

export async function uploadToCloudinary(file){
  if(!file) throw new Error('No file')
  if(!file.type.startsWith('image/')) throw new Error('Only image files allowed')
  if(file.size > 5*1024*1024) throw new Error('Max size 5MB')
  const fd = new FormData();
  fd.append('file', file)
  fd.append('upload_preset', UPLOAD_PRESET)
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method:'POST', body: fd })
  if(!res.ok) throw new Error('Upload failed')
  const data = await res.json()
  return { url: data.secure_url, publicId: data.public_id }
}

export function getTransformedUrl(originalUrl, options = {}){
  if(!originalUrl) return ''
  const transformations = []
  if(options.width) transformations.push(`w_${options.width}`)
  if(options.height) transformations.push(`h_${options.height}`)
  if(options.crop) transformations.push(`c_${options.crop}`)
  if(options.gravity) transformations.push(`g_${options.gravity}`)
  const transformString = transformations.length ? transformations.join(',') + '/' : ''
  const parts = originalUrl.split('/upload/')
  return parts.length === 2 ? `${parts[0]}/upload/${transformString}${parts[1]}` : originalUrl
}

export function initAvatarUpload(){ /* kept for compatibility; in React we handle upload in component */ }

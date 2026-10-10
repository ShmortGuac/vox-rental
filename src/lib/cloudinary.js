// Adds automatic format/quality and a size to Cloudinary links so covers load
// fast. Links that already have a transformation, or aren't from Cloudinary,
// are returned unchanged.
export function optimizeImage(url, size = 600) {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url
  const [before, after] = url.split('/upload/')
  if (/^[a-z]{1,3}_[^/]*\//.test(after)) return url
  return `${before}/upload/f_auto,q_auto,c_fill,w_${size},h_${size}/${after}`
}

export const MAX_UPLOAD_MB = 10 // Cloudinary free plan limit per image

// Uploads an image to Cloudinary for a signed-in admin and returns its URL.
// The `cloudinary-sign` Supabase function checks the user is an admin and
// signs the upload; the file goes straight from the browser to Cloudinary.
export async function uploadImage(supabase, file, onProgress = () => {}) {
  if (!file.type.startsWith('image/')) throw new Error('That file is not an image.')
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) throw new Error(`Images must be under ${MAX_UPLOAD_MB} MB.`)

  const { data: sig, error } = await supabase.functions.invoke('cloudinary-sign', { method: 'POST' })
  if (error) {
    let message = error.message
    try {
      message = (await error.context.json()).error || message
    } catch {
      /* keep the generic message */
    }
    throw new Error(message)
  }

  const body = new FormData()
  body.append('file', file)
  body.append('api_key', sig.apiKey)
  body.append('timestamp', sig.timestamp)
  body.append('folder', sig.folder)
  body.append('allowed_formats', sig.allowedFormats)
  body.append('signature', sig.signature)

  // XMLHttpRequest (not fetch) so we can report upload progress
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`)
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total)
    xhr.onload = () => {
      let res = {}
      try {
        res = JSON.parse(xhr.responseText)
      } catch {
        /* handled below */
      }
      if (xhr.status >= 200 && xhr.status < 300 && res.secure_url) resolve(res.secure_url)
      else reject(new Error(res.error?.message || `Upload failed (${xhr.status}).`))
    }
    xhr.onerror = () => reject(new Error('Upload failed — check your connection.'))
    xhr.send(body)
  })
}

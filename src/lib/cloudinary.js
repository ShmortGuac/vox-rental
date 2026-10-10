// Adds automatic format/quality and a size to Cloudinary links so covers load
// fast. Links that already have a transformation, or aren't from Cloudinary,
// are returned unchanged.
export function optimizeImage(url, size = 600) {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url
  const [before, after] = url.split('/upload/')
  if (/^[a-z]{1,3}_[^/]*\//.test(after)) return url
  return `${before}/upload/f_auto,q_auto,c_fill,w_${size},h_${size}/${after}`
}

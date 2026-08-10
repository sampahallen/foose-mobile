import type { GalleryPost } from '../types/api'

/** Posts predate the multi-image field, so `images` may be empty while `imageUrl` is set. */
export function finspoImages(post: GalleryPost): string[] {
  const images = (post.images || []).filter(Boolean)
  if (images.length) return images
  return post.imageUrl ? [post.imageUrl] : []
}

export function finspoCoverImage(post: GalleryPost): string {
  return finspoImages(post)[0] || ''
}

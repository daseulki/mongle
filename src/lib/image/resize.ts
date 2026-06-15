import imageCompression from 'browser-image-compression'

const PHOTO_OPTIONS = {
  maxWidthOrHeight: 2560,
  useWebWorker: true,
  fileType: 'image/jpeg' as const,
  initialQuality: 0.85,
}

const COVER_OPTIONS = {
  maxWidthOrHeight: 1280,
  useWebWorker: true,
  fileType: 'image/jpeg' as const,
  initialQuality: 0.85,
}

const AVATAR_OPTIONS = {
  maxWidthOrHeight: 256,
  useWebWorker: true,
  fileType: 'image/jpeg' as const,
  initialQuality: 0.9,
}

/**
 * Compresses and resizes an image file for album upload.
 * @param file - Input image (HEIC, JPEG, PNG, WEBP supported)
 * @returns Compressed JPEG at max 2560px longest edge, quality 0.85
 */
export async function resizePhoto(file: File): Promise<File> {
  return imageCompression(file, PHOTO_OPTIONS)
}

/**
 * Resizes an image for use as album cover art.
 * @returns JPEG at max 1280px longest edge, quality 0.85
 */
export async function resizeCover(file: File): Promise<File> {
  return imageCompression(file, COVER_OPTIONS)
}

/**
 * Resizes an image for use as a user avatar.
 * @returns JPEG at max 256px longest edge, quality 0.90
 */
export async function resizeAvatar(file: File): Promise<File> {
  return imageCompression(file, AVATAR_OPTIONS)
}

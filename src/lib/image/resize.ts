import imageCompression from 'browser-image-compression'

const PHOTO_OPTIONS = {
  maxWidthOrHeight: 2560,
  useWebWorker: true,
  fileType: 'image/jpeg' as const,
  initialQuality: 0.85,
}

/**
 * Compresses and resizes an image file for album upload.
 * @param file - Input image (HEIC, JPEG, PNG, WEBP supported)
 * @returns Compressed JPEG at max 2560px longest edge, quality 0.85
 */
export async function resizePhoto(file: File): Promise<File> {
  return imageCompression(file, PHOTO_OPTIONS)
}

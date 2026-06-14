import { PhotoDetailClient } from './PhotoDetailClient'

interface PhotoDetailPageProps {
  params: Promise<{ albumId: string; photoId: string }>
}

export default async function PhotoDetailPage({
  params,
}: PhotoDetailPageProps): Promise<React.JSX.Element> {
  const { albumId, photoId } = await params
  return <PhotoDetailClient albumId={albumId} photoId={photoId} />
}

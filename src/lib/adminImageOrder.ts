export type ImageReorderDirection = 'up' | 'down';

export interface AdminImageItem {
  id: string;
  sort_order: number;
}

export const reorderImagesById = <T extends AdminImageItem>(
  images: T[],
  imageId: string,
  direction: ImageReorderDirection,
): T[] => {
  const currentIndex = images.findIndex((image) => image.id === imageId);
  if (currentIndex === -1) {
    return images;
  }

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= images.length) {
    return images;
  }

  const reordered = [...images];
  const [movedItem] = reordered.splice(currentIndex, 1);
  reordered.splice(targetIndex, 0, movedItem);

  return reordered.map((image, index) => ({ ...image, sort_order: index }));
};

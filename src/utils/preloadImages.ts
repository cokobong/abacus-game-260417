/** Preloads and decodes images without requiring decode() on older WebKit/WebViews. */
export async function preloadImages(sources: readonly string[]): Promise<void> {
  const uniqueSources = [...new Set(sources)];
  await Promise.all(uniqueSources.map(async (src) => {
    const image = new Image();
    const loaded = new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error(`Failed to preload image: ${src}`));
    });
    image.src = src;
    if (typeof image.decode === 'function') {
      try {
        await image.decode();
        return;
      } catch {
        // Older Safari may reject decode() although onload still succeeds.
      }
    }
    await loaded;
  }));
}

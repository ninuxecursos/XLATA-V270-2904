export function generateSeoFileName(
  productTitle: string,
  index: number,
  extension: string = 'webp'
): string {
  const slug = productTitle
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const suffix = '-xlata-moveis-usados-guarulhos-vila-galvao';
  const shortId = Date.now().toString(36).slice(-4);
  const indexStr = index > 0 ? `-${index + 1}` : '';

  return `products/${slug}${suffix}${indexStr}-${shortId}.${extension}`;
}

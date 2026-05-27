/**
 * Comprime uma imagem para WebP, preservando qualidade visual com tamanho menor.
 * Usado pelo Scanner de Produto e pelo Cadastro/Edição de Produto.
 */

export interface CompressToWebpOpts {
  /** Maior dimensão (largura ou altura). Default: 1600 */
  maxDim?: number;
  /** Qualidade WebP de 0 a 1. Default: 0.85 */
  quality?: number;
  /** Cor de fundo se a imagem tiver transparência (default: branco) */
  background?: string | null;
}

export interface CompressedImage {
  blob: Blob;
  base64: string;
  mimeType: 'image/webp';
  sizeKb: number;
  width: number;
  height: number;
}

function supportsWebpEncoding(): boolean {
  try {
    const c = document.createElement('canvas');
    c.width = 1; c.height = 1;
    return c.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    return false;
  }
}

const _webpSupported = typeof document !== 'undefined' ? supportsWebpEncoding() : true;

/**
 * Comprime um File/Blob de imagem para WebP.
 * Retorna Blob + base64 (sem o prefixo data:) + metadados.
 */
export function compressImageToWebp(
  file: File | Blob,
  opts: CompressToWebpOpts = {}
): Promise<CompressedImage> {
  const { maxDim = 1600, quality = 0.85, background = '#ffffff' } = opts;
  const targetMime: 'image/webp' = 'image/webp';
  const outputMime = _webpSupported ? targetMime : 'image/jpeg';

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    const cleanup = () => { try { URL.revokeObjectURL(objectUrl); } catch { /* */ } };

    img.onload = () => {
      try {
        let { width, height } = img;
        if (!width || !height) { cleanup(); return reject(new Error('Imagem sem dimensões')); }

        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { cleanup(); return reject(new Error('Sem contexto canvas')); }

        if (background) {
          ctx.fillStyle = background;
          ctx.fillRect(0, 0, width, height);
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          cleanup();
          if (!blob) return reject(new Error('Falha ao gerar blob'));
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = String(reader.result || '');
            const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
            if (!base64) return reject(new Error('Base64 vazio'));
            resolve({
              blob,
              base64,
              mimeType: targetMime,
              sizeKb: Math.round(blob.size / 1024),
              width,
              height,
            });
          };
          reader.onerror = () => reject(reader.error || new Error('Reader error'));
          reader.readAsDataURL(blob);
        }, outputMime, quality);
      } catch (err) {
        cleanup();
        reject(err);
      }
    };
    img.onerror = () => { cleanup(); reject(new Error('Falha ao carregar imagem')); };
    img.src = objectUrl;
  });
}

/**
 * Estratégia adaptativa: tenta qualidades/tamanhos sucessivos até atingir um teto de bytes.
 * Útil para envio à IA, onde queremos ~600KB-900KB por foto.
 */
export async function compressAdaptiveWebp(
  file: File | Blob,
  targetMaxBytes = 700 * 1024
): Promise<CompressedImage> {
  const passes: CompressToWebpOpts[] = [
    { maxDim: 1600, quality: 0.85 },
    { maxDim: 1280, quality: 0.8 },
    { maxDim: 1024, quality: 0.75 },
    { maxDim: 900, quality: 0.7 },
    { maxDim: 720, quality: 0.65 },
  ];
  let last: CompressedImage | null = null;
  for (const opts of passes) {
    last = await compressImageToWebp(file, opts);
    if (last.blob.size <= targetMaxBytes) return last;
  }
  return last as CompressedImage;
}

export function webpFileName(originalName: string, suffix = ''): string {
  const base = originalName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 60) || 'image';
  return `${base}${suffix}.webp`;
}

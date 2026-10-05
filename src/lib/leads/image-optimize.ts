// Browser-only. Turns a photo the user picked into a smaller stored image plus a thumbnail, BEFORE anything is
// uploaded. Documents are never passed through here. All numbers come from constants.ts.
import {
  FALLBACK_JPEG_QUALITY, IMAGE_COMPRESSION_QUALITY, IMAGE_FILE_EXTENSIONS, MAX_ATTACHMENT_BYTES, MAX_ATTACHMENT_MB, MAX_IMAGE_HEIGHT,
  MAX_IMAGE_WIDTH, MAX_ORIGINAL_IMAGE_BYTES, MAX_SOURCE_PIXELS, MIN_FIT_DIMENSION, MIN_IMAGE_QUALITY, THUMBNAIL_MAX_DIMENSION,
  THUMBNAIL_QUALITY, type AllowedImageType,
} from "./constants";
import { IMAGE_NAME_RE, looksLikeUnsupportedImage, sniffImageType } from "./image-types";

export const IMAGE_ERROR_MESSAGE = "Unable to process this image. Please try another image.";

export class FileProblem extends Error {}

export type FileClass = { kind: "image"; type: AllowedImageType } | { kind: "document" } | { kind: "rejected"; reason: string };

export type OptimizedImage = {
  blob: Blob; // what gets stored
  type: string; // image/webp (image/jpeg in browsers that cannot encode WebP; the original type when it was already smaller)
  thumb: Blob;
  thumbType: string;
  width: number;
  height: number;
  originalSize: number;
  contentHash?: string; // SHA-256 of the file the user picked
  name: string; // file name whose extension matches the stored format
};

const tick = () => new Promise<void>(resolve => setTimeout(resolve, 0)); // lets the page repaint between heavy steps

// Decides whether a file is a supported image, a document, or an unsupported/invalid image. Looks at the bytes.
export async function classifyFile(file: File): Promise<FileClass> {
  const head = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  const type = sniffImageType(head);
  if (type) return { kind: "image", type };
  if (looksLikeUnsupportedImage(head)) return { kind: "rejected", reason: "Only JPEG, PNG and WebP images are supported" };
  if (file.type.startsWith("image/") || IMAGE_NAME_RE.test(file.name)) return { kind: "rejected", reason: "This is not a valid JPEG, PNG or WebP image" };
  return { kind: "document" };
}

export async function sha256Hex(file: Blob): Promise<string | undefined> {
  if (!globalThis.crypto?.subtle) return undefined; // insecure (plain http) pages have no crypto.subtle: skip duplicate detection
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
}

type AnyCanvas = OffscreenCanvas | HTMLCanvasElement;

function makeCanvas(width: number, height: number): AnyCanvas {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function draw(source: CanvasImageSource, width: number, height: number, background?: string): AnyCanvas {
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  if (!ctx) throw new FileProblem(IMAGE_ERROR_MESSAGE);
  if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, width, height); }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, width, height);
  return canvas;
}

async function toBlob(canvas: AnyCanvas, type: string, quality: number): Promise<Blob> {
  const blob = "convertToBlob" in canvas
    ? await canvas.convertToBlob({ type, quality })
    : await new Promise<Blob | null>(resolve => (canvas as HTMLCanvasElement).toBlob(resolve, type, quality));
  if (!blob || blob.size === 0) throw new FileProblem(IMAGE_ERROR_MESSAGE);
  return blob;
}

// WebP, or JPEG on a white background when this browser cannot encode WebP (it silently returns PNG instead)
async function encode(canvas: AnyCanvas, quality: number): Promise<Blob> {
  const webp = await toBlob(canvas, "image/webp", quality);
  if (webp.type === "image/webp") return webp;
  const flat = draw(canvas as CanvasImageSource, canvas.width, canvas.height, "#ffffff");
  const jpeg = await toBlob(flat, "image/jpeg", FALLBACK_JPEG_QUALITY);
  if (jpeg.type !== "image/jpeg") throw new FileProblem(IMAGE_ERROR_MESSAGE);
  return jpeg;
}

export const extensionFor = (type: string) => IMAGE_FILE_EXTENSIONS[type] ?? "bin";
const withExtension = (name: string, type: string) => `${name.replace(/\.[^./\\]*$/, "") || "image"}.${extensionFor(type)}`;

export async function optimizeImage(file: File, sourceType: AllowedImageType): Promise<OptimizedImage> {
  if (file.size === 0) throw new FileProblem("File is empty");
  if (file.size > MAX_ORIGINAL_IMAGE_BYTES) throw new FileProblem(`Larger than ${MAX_ORIGINAL_IMAGE_BYTES / 1024 / 1024} MB`);

  const contentHash = await sha256Hex(file);
  await tick();

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }); // applies the camera's rotation
  } catch {
    throw new FileProblem(IMAGE_ERROR_MESSAGE);
  }
  try {
    if (bitmap.width * bitmap.height > MAX_SOURCE_PIXELS) throw new FileProblem("The image is too large to process");

    // Fit inside the maximum box, keep the aspect ratio, never enlarge
    const scale = Math.min(1, MAX_IMAGE_WIDTH / bitmap.width, MAX_IMAGE_HEIGHT / bitmap.height);
    let width = Math.max(1, Math.round(bitmap.width * scale));
    let height = Math.max(1, Math.round(bitmap.height * scale));
    let canvas = draw(bitmap, width, height);
    await tick();

    // Encode at the normal quality. A photo that is still over the size limit gets a little less quality (down to
    // MIN_IMAGE_QUALITY), then a slightly smaller picture, until it fits.
    let quality = IMAGE_COMPRESSION_QUALITY;
    let blob = await encode(canvas, quality);
    while (blob.size > MAX_ATTACHMENT_BYTES) {
      if (quality > MIN_IMAGE_QUALITY + 0.001) {
        quality = Math.max(MIN_IMAGE_QUALITY, Math.round((quality - 0.1) * 100) / 100);
      } else {
        if (Math.max(width, height) * 0.85 < MIN_FIT_DIMENSION) throw new FileProblem(`Too detailed to fit in ${MAX_ATTACHMENT_MB} MB. Please try a smaller image`);
        width = Math.max(1, Math.round(width * 0.85));
        height = Math.max(1, Math.round(height * 0.85));
        canvas = draw(bitmap, width, height);
      }
      blob = await encode(canvas, quality);
      await tick();
    }
    let name = withExtension(file.name, blob.type);
    // A file that is already smaller than its re-encoded version (and needs no resizing) is kept as it is
    if (width === bitmap.width && height === bitmap.height && blob.size >= file.size && file.size <= MAX_ATTACHMENT_BYTES) {
      blob = new Blob([file], { type: sourceType });
      name = file.name;
    }
    await tick();

    // The thumbnail is drawn from the already-resized canvas, which keeps big reductions smooth
    const thumbScale = Math.min(1, THUMBNAIL_MAX_DIMENSION / Math.max(width, height));
    const thumbCanvas = draw(canvas as CanvasImageSource, Math.max(1, Math.round(width * thumbScale)), Math.max(1, Math.round(height * thumbScale)));
    const thumb = await encode(thumbCanvas, THUMBNAIL_QUALITY);

    return { blob, type: blob.type, thumb, thumbType: thumb.type, width, height, originalSize: file.size, contentHash, name };
  } finally {
    bitmap.close();
  }
}

export function formatBytes(n: number) {
  return n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

// "-84%" when the stored image is smaller than the file the user picked
export function savings(original: number, stored: number) {
  return stored < original ? `-${Math.round((1 - stored / original) * 100)}%` : null;
}

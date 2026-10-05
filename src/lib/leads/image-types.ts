import type { AllowedImageType } from "./constants";

// Identify an image by its first bytes, never by its file name or the type the browser reported.
// Shared by the browser (before compressing) and the server (after the upload).

const startsWith = (b: Uint8Array, sig: number[], at = 0) => sig.every((v, i) => b[at + i] === v);
const ascii = (b: Uint8Array, from: number, to: number) => String.fromCharCode(...Array.from(b.slice(from, to)));

export function sniffImageType(b: Uint8Array): AllowedImageType | null {
  if (startsWith(b, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (b.length >= 12 && ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP") return "image/webp";
  return null;
}

// Other well-known image formats we do not accept (GIF, BMP, TIFF, HEIC/HEIF, AVIF), so the user gets a clear message
export function looksLikeUnsupportedImage(b: Uint8Array): boolean {
  if (ascii(b, 0, 4) === "GIF8" || ascii(b, 0, 2) === "BM") return true;
  if (startsWith(b, [0x49, 0x49, 0x2a, 0x00]) || startsWith(b, [0x4d, 0x4d, 0x00, 0x2a])) return true;
  if (ascii(b, 4, 8) === "ftyp") return ["heic", "heix", "hevc", "hevx", "mif1", "msf1", "avif", "avis"].includes(ascii(b, 8, 12));
  return false;
}

// File names that claim to be an image
export const IMAGE_NAME_RE = /\.(jpe?g|jfif|png|webp|gif|bmp|tiff?|heic|heif|avif|svg|ico)$/i;

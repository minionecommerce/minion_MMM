// Audio recordings (for example a call recording attached to a follow-up). Shared by the browser and the server.
// An audio file is recognised by its first bytes, never by its file name or the type the browser reported.

export const MAX_AUDIO_MB = 5; // per audio file; audio is stored as it is, it cannot be compressed in the browser
export const MAX_AUDIO_BYTES = MAX_AUDIO_MB * 1024 * 1024;

export const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/mp4", "audio/wav", "audio/ogg", "audio/webm", "audio/aac", "audio/amr", "audio/flac"] as const;
export type AllowedAudioType = (typeof ALLOWED_AUDIO_TYPES)[number];
export const AUDIO_FILE_EXTENSIONS: Record<AllowedAudioType, string> = {
  "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/wav": "wav", "audio/ogg": "ogg", "audio/webm": "webm", "audio/aac": "aac", "audio/amr": "amr", "audio/flac": "flac",
};
export const AUDIO_FORMATS_LABEL = "MP3, M4A, WAV, OGG, AAC, AMR, FLAC or WebM";
// For the file picker (the content check above still decides)
export const AUDIO_ACCEPT = ["audio/*", ".mp3", ".m4a", ".wav", ".ogg", ".opus", ".aac", ".amr", ".flac", ".webm", ".3gp"].join(",");

export function isAllowedAudioType(type: string): type is AllowedAudioType {
  return (ALLOWED_AUDIO_TYPES as readonly string[]).includes(type);
}

const ascii = (b: Uint8Array, from: number, to: number) => String.fromCharCode(...Array.from(b.slice(from, to)));

// `loose`: also accept MP4-family files whose brand can be either audio or video (isom, mp42, 3gp). Used when the
// user chose the audio field, or on the server, where the declared type is checked against the content.
export function sniffAudioType(b: Uint8Array, loose = false): AllowedAudioType | null {
  if (b.length < 4) return null;
  if (ascii(b, 0, 3) === "ID3") return "audio/mpeg";
  if (b[0] === 0xff && (b[1] & 0xe0) === 0xe0) return (b[1] & 0x06) === 0 ? "audio/aac" : "audio/mpeg"; // frame sync: layer bits 00 = AAC (ADTS)
  if (b.length >= 12 && ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WAVE") return "audio/wav";
  if (ascii(b, 0, 4) === "OggS") return "audio/ogg"; // Vorbis and Opus (WhatsApp voice notes)
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return "audio/webm"; // browser-recorded audio
  if (ascii(b, 0, 4) === "fLaC") return "audio/flac";
  if (ascii(b, 0, 5) === "#!AMR") return "audio/amr";
  if (ascii(b, 4, 8) === "ftyp") {
    const brand = ascii(b, 8, 12);
    if (["M4A ", "M4B ", "M4P "].includes(brand)) return "audio/mp4";
    if (loose && ["isom", "iso2", "mp41", "mp42", "3gp4", "3gp5", "3gp6", "3ge6", "3gg6"].includes(brand)) return "audio/mp4";
  }
  return null;
}

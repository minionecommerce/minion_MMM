'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ATTACHMENT_BLOCKED_HINT, isAttachmentAllowed, MAX_ATTACHMENT_BYTES, MAX_ATTACHMENT_MB, UNKNOWN_MIME_TYPE } from '@/lib/leads/constants';
import { AUDIO_FORMATS_LABEL, MAX_AUDIO_MB, MAX_AUDIO_BYTES, sniffAudioType } from '@/lib/leads/audio-types';
import { uploadToSignedUrl } from '@/lib/leads/client';
import { classifyFile, FileProblem, IMAGE_ERROR_MESSAGE, optimizeImage } from '@/lib/leads/image-optimize';

export type FileStatus = 'processing' | 'ready' | 'uploading' | 'uploaded' | 'error';

// A file the user picked. Images are optimized as soon as they are picked, so what sits here is what will be uploaded.
export type QueuedFile = {
  key: string;
  name: string; // name that will be saved (its extension follows the stored format)
  status: FileStatus;
  error?: string;
  kind?: 'image' | 'document' | 'audio';
  audio?: boolean; // picked in the audio field
  blob?: Blob; // the bytes to upload
  type: string;
  size: number; // size of `blob`, or of the picked file while it is still being processed
  originalSize: number;
  thumb?: Blob;
  thumbType?: string;
  width?: number;
  height?: number;
  contentHash?: string;
  previewUrl?: string; // small thumbnail for the form (never the full-size image)
};

const newKey = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// What the server's sign endpoints expect for one file
export function toUploadFile(f: QueuedFile) {
  return {
    name: f.name,
    type: f.type,
    size: f.size,
    ...(f.thumb && f.width && f.height
      ? { image: { width: f.width, height: f.height, originalSize: f.originalSize, ...(f.contentHash ? { contentHash: f.contentHash } : {}), thumbnail: { type: f.thumbType!, size: f.thumb.size } } }
      : {}),
  };
}

// What the sign endpoints return for each file they accepted; `index` is the file's position in the request
export type SignedUpload = { index: number; id: string; name: string; uploadUrl: string; thumbnailUploadUrl: string | null };
export type SkippedFile = { index: number; name: string };

// Uploads each file (and its thumbnail) to the URLs the server issued, showing "Uploading…" per file
export async function putQueued(sent: QueuedFile[], uploads: SignedUpload[], patch: (key: string, changes: Partial<QueuedFile>) => void) {
  for (const u of uploads) {
    const item = sent[u.index];
    patch(item.key, { status: 'uploading' });
    try {
      await uploadToSignedUrl(u.uploadUrl, item.blob!);
      if (u.thumbnailUploadUrl && item.thumb) await uploadToSignedUrl(u.thumbnailUploadUrl, item.thumb);
    } catch {
      patch(item.key, { status: 'error', error: 'Upload failed' });
      throw new Error(`Upload of ${item.name} failed`);
    }
  }
}

// `audioField`: the user picked this in the audio field, so it must be a recording. Audio dropped into the file field is recognised too.
async function prepare(file: File, audioField: boolean): Promise<Partial<QueuedFile>> {
  if (file.size === 0) throw new FileProblem('File is empty');
  const audio = sniffAudioType(new Uint8Array(await file.slice(0, 32).arrayBuffer()), audioField);
  if (audio) {
    if (file.size > MAX_AUDIO_BYTES) throw new FileProblem(`Larger than ${MAX_AUDIO_MB} MB`);
    return { kind: 'audio', blob: new Blob([file], { type: audio }), type: audio, size: file.size }; // stored as it is, with a type the player understands
  }
  if (audioField) throw new FileProblem(`Not a supported audio file (${AUDIO_FORMATS_LABEL})`);
  const kind = await classifyFile(file);
  if (kind.kind === 'rejected') throw new FileProblem(kind.reason);
  if (kind.kind === 'document') {
    if (!isAttachmentAllowed(file.name)) throw new FileProblem(`Not allowed: ${ATTACHMENT_BLOCKED_HINT}`);
    if (file.size > MAX_ATTACHMENT_BYTES) throw new FileProblem(`Larger than ${MAX_ATTACHMENT_MB} MB`);
    return { kind: 'document', blob: file, type: file.type || UNKNOWN_MIME_TYPE, size: file.size };
  }
  const image = await optimizeImage(file, kind.type);
  return {
    kind: 'image', name: image.name, blob: image.blob, type: image.type, size: image.blob.size,
    thumb: image.thumb, thumbType: image.thumbType, width: image.width, height: image.height,
    contentHash: image.contentHash, previewUrl: URL.createObjectURL(image.thumb),
  };
}

export function useFileQueue({ max, onProblem }: { max: number; onProblem: (message: string) => void }) {
  const [items, setItems] = useState<QueuedFile[]>([]);
  const itemsRef = useRef<QueuedFile[]>([]);
  const maxRef = useRef(max);
  const problemRef = useRef(onProblem);
  const chain = useRef<Promise<void>>(Promise.resolve()); // files are processed one at a time so the page stays responsive
  useEffect(() => { maxRef.current = max; problemRef.current = onProblem; });

  const commit = useCallback((update: (cur: QueuedFile[]) => QueuedFile[]) => {
    itemsRef.current = update(itemsRef.current);
    setItems(itemsRef.current);
  }, []);
  const patch = useCallback((key: string, changes: Partial<QueuedFile>) => commit(cur => cur.map(i => (i.key === key ? { ...i, ...changes } : i))), [commit]);

  // Browser object URLs hold memory until released
  useEffect(() => () => itemsRef.current.forEach(i => i.previewUrl && URL.revokeObjectURL(i.previewUrl)), []);

  const processOne = useCallback(async (key: string, file: File, audioField: boolean) => {
    try {
      const result = await prepare(file, audioField);
      if (!itemsRef.current.some(i => i.key === key)) { if (result.previewUrl) URL.revokeObjectURL(result.previewUrl); return; } // removed meanwhile
      const twin = result.contentHash && itemsRef.current.some(i => i.key !== key && i.status !== 'error' && i.contentHash === result.contentHash);
      if (twin) {
        if (result.previewUrl) URL.revokeObjectURL(result.previewUrl);
        commit(cur => cur.filter(i => i.key !== key));
        problemRef.current(`${file.name}: this file was already added`);
        return;
      }
      patch(key, { ...result, status: 'ready' });
    } catch (err) {
      patch(key, { status: 'error', error: err instanceof FileProblem ? err.message : IMAGE_ERROR_MESSAGE });
    }
  }, [commit, patch]);

  const add = useCallback((files: File[], options: { audio?: boolean } = {}) => {
    const incoming: { key: string; file: File }[] = [];
    let room = maxRef.current - itemsRef.current.length;
    for (const file of files) {
      if (room <= 0) { problemRef.current(`At most ${maxRef.current} files can be attached here`); break; }
      room--;
      incoming.push({ key: newKey(), file });
    }
    if (!incoming.length) return;
    commit(cur => [...cur, ...incoming.map(({ key, file }): QueuedFile => ({ key, name: file.name, status: 'processing', type: file.type, size: file.size, originalSize: file.size, audio: options.audio }))]);
    for (const { key, file } of incoming) chain.current = chain.current.then(() => processOne(key, file, !!options.audio));
  }, [commit, processOne]);

  const remove = useCallback((key: string) => {
    const gone = itemsRef.current.find(i => i.key === key);
    if (gone?.previewUrl) URL.revokeObjectURL(gone.previewUrl);
    commit(cur => cur.filter(i => i.key !== key));
  }, [commit]);

  const clear = useCallback(() => {
    itemsRef.current.forEach(i => i.previewUrl && URL.revokeObjectURL(i.previewUrl));
    commit(() => []);
  }, [commit]);

  return {
    items,
    add,
    remove,
    patch,
    clear,
    processing: items.some(i => i.status === 'processing'),
    hasErrors: items.some(i => i.status === 'error'),
  };
}

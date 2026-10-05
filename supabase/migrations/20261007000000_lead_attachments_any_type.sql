-- Lead attachments and follow-up proof now accept any file format (the app blocks only programs and scripts
-- by file extension; see src/lib/leads/constants.ts). A NULL allowed_mime_types list means "any type".
-- The 10 MB per-file limit is unchanged and the bucket stays private.
UPDATE storage.buckets SET allowed_mime_types = NULL WHERE id = 'lead-attachments';

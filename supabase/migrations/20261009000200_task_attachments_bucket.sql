-- Private bucket for task attachments (proof photos, documents, call recordings).
-- Same model as the lead-attachments bucket: no storage policies on purpose, so only the server (service role key) can read or
-- write; files are shown through short-lived signed URLs after a permission check. 5 MB is the largest file the app allows (audio).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('task-attachments', 'task-attachments', false, 5242880, NULL)
ON CONFLICT (id) DO NOTHING;

-- Private bucket for lead attachments.
-- No storage policies are created on purpose: only the server (service role key) can read or write.
-- Files are shown through short-lived signed URLs created after a permission check.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('lead-attachments', 'lead-attachments', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

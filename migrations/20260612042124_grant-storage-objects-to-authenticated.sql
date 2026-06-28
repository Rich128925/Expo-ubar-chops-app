-- RLS policies on storage.objects are useless until the role has table privileges.
-- Grant the minimum DML needed for storage uploads; RLS policies added in the
-- previous migration then control which rows each role can actually touch.
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO anon;

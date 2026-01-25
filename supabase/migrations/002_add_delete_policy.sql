-- Enable RLS on documents table (if not already enabled)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Drop existing delete policy if it exists
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;

-- Create policy to allow authenticated users to delete documents
-- This allows any authenticated user to delete any document
-- If you want users to only delete their own documents, you need to add a user_id column first
CREATE POLICY "Authenticated users can delete documents"
  ON documents
  FOR DELETE
  TO authenticated
  USING (true);

-- Optional: If you have a user_id column, use this instead:
-- CREATE POLICY "Users can delete their own documents"
--   ON documents
--   FOR DELETE
--   TO authenticated
--   USING (auth.uid() = user_id);

-- Also ensure users can read and update documents
DROP POLICY IF EXISTS "Authenticated users can read documents" ON documents;
CREATE POLICY "Authenticated users can read documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert documents" ON documents;
CREATE POLICY "Authenticated users can insert documents"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update documents" ON documents;
CREATE POLICY "Authenticated users can update documents"
  ON documents
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Storage policies for signed-documents bucket
-- Allow authenticated users to delete files
DROP POLICY IF EXISTS "Authenticated users can delete files" ON storage.objects;
CREATE POLICY "Authenticated users can delete files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'signed-documents');

-- Ensure other storage operations are allowed
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
CREATE POLICY "Authenticated users can upload files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'signed-documents');

DROP POLICY IF EXISTS "Authenticated users can update files" ON storage.objects;
CREATE POLICY "Authenticated users can update files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'signed-documents')
  WITH CHECK (bucket_id = 'signed-documents');

DROP POLICY IF EXISTS "Public can read files" ON storage.objects;
CREATE POLICY "Public can read files"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'signed-documents');

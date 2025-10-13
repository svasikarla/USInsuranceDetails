-- Fix file paths in the database to use absolute paths
-- Run this after the backend directory path is known

-- First, let's see what needs fixing
SELECT
    id,
    original_filename,
    file_path,
    processing_status,
    LENGTH(extracted_text) as text_length
FROM policy_documents
WHERE file_path LIKE 'uploads/%';

-- Update file paths to be relative to backend directory
-- The backend code now handles this correctly, but we should update existing records

-- For the failing document, we can manually trigger reprocessing after the path is confirmed
-- The new code in save_upload_file() will create absolute paths for new uploads

-- To reprocess existing documents with wrong paths, update them:
UPDATE policy_documents
SET
    processing_status = 'pending',
    extracted_text = NULL,
    processing_error = NULL,
    auto_creation_status = NULL
WHERE
    id = '2fd56942-ca72-45b8-a34c-66399c8b11ae'
    AND processing_status = 'failed';

-- Note: The document will be reprocessed on next backend restart or manual trigger

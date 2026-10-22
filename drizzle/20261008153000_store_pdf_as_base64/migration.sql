ALTER TABLE "exercise_documents"
ALTER COLUMN "content" TYPE text
USING encode("content", 'base64');

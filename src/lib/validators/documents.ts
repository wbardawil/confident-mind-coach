import { z } from "zod";

export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/markdown",
  "text/plain",
] as const;

export const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".md", ".txt"] as const;

export const DOCUMENT_CATEGORIES = [
  "resume",
  "personality",
  "assessment",
  "notes",
  "other",
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_DOCUMENTS_PER_USER = 10;
export const MAX_EXTRACTED_CONTENT_LENGTH = 50_000; // ~50k chars

export const documentCategorySchema = z.enum(DOCUMENT_CATEGORIES);

export const documentUploadSchema = z.object({
  category: documentCategorySchema,
});

export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;

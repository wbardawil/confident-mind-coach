import { MAX_EXTRACTED_CONTENT_LENGTH } from "@/lib/validators/documents";

/**
 * Extract text content from an uploaded file buffer.
 * Supports PDF, DOCX, Markdown, and plain text.
 */
export async function extractText(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  let text: string;

  switch (mimeType) {
    case "application/pdf": {
      // pdf-parse v1 exports a single function
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse");
      const result = await pdfParse(buffer);
      text = result.text;
      break;
    }
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
      break;
    }
    case "text/markdown":
    case "text/plain": {
      text = buffer.toString("utf-8");
      break;
    }
    default:
      throw new Error(`Unsupported file type: ${mimeType}`);
  }

  // Trim and truncate to stay within token budget
  text = text.trim();
  if (text.length > MAX_EXTRACTED_CONTENT_LENGTH) {
    text = text.slice(0, MAX_EXTRACTED_CONTENT_LENGTH);
  }

  return text;
}

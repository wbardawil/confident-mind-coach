import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/utils/db";
import { getCurrentUser } from "@/lib/utils/user";
import { extractText } from "@/lib/utils/extract-text";
import {
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
  MAX_DOCUMENTS_PER_USER,
  documentCategorySchema,
} from "@/lib/validators/documents";

function getMimeType(fileName: string, declaredType: string): string {
  // Fallback to extension-based detection if browser sends generic type
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (declaredType && ALLOWED_FILE_TYPES.includes(declaredType as never)) {
    return declaredType;
  }
  switch (ext) {
    case "pdf":
      return "application/pdf";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "md":
      return "text/markdown";
    case "txt":
      return "text/plain";
    default:
      return declaredType;
  }
}

function getFileTypeLabel(mimeType: string): string {
  switch (mimeType) {
    case "application/pdf":
      return "pdf";
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return "docx";
    case "text/markdown":
      return "md";
    case "text/plain":
      return "txt";
    default:
      return "unknown";
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Check document limit
  const count = await db.userDocument.count({ where: { userId: user.id } });
  if (count >= MAX_DOCUMENTS_PER_USER) {
    return NextResponse.json(
      { error: `Maximum ${MAX_DOCUMENTS_PER_USER} documents allowed. Remove one first.` },
      { status: 400 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const category = formData.get("category") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate category
  const categoryResult = documentCategorySchema.safeParse(category);
  if (!categoryResult.success) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 5MB." },
      { status: 400 }
    );
  }

  // Validate file type
  const mimeType = getMimeType(file.name, file.type);
  if (!ALLOWED_FILE_TYPES.includes(mimeType as never)) {
    return NextResponse.json(
      { error: "Unsupported file type. Allowed: PDF, DOCX, MD, TXT." },
      { status: 400 }
    );
  }

  // Extract text
  const buffer = Buffer.from(await file.arrayBuffer());
  let extractedContent: string;
  try {
    extractedContent = await extractText(buffer, mimeType);
  } catch {
    return NextResponse.json(
      { error: "Failed to extract text from file. Please try a different file." },
      { status: 422 }
    );
  }

  if (!extractedContent) {
    return NextResponse.json(
      { error: "No text content could be extracted from the file." },
      { status: 422 }
    );
  }

  // Save to database
  const document = await db.userDocument.create({
    data: {
      userId: user.id,
      fileName: file.name,
      fileType: getFileTypeLabel(mimeType),
      fileSize: file.size,
      category: categoryResult.data,
      extractedContent,
    },
  });

  return NextResponse.json({
    id: document.id,
    fileName: document.fileName,
    fileType: document.fileType,
    fileSize: document.fileSize,
    category: document.category,
    createdAt: document.createdAt,
  });
}

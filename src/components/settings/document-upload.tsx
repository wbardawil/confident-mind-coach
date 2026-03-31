"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import {
  ALLOWED_EXTENSIONS,
  DOCUMENT_CATEGORIES,
  MAX_FILE_SIZE,
  type DocumentCategory,
} from "@/lib/validators/documents";

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  resume: "Resume / CV",
  personality: "Personality Assessment",
  assessment: "Performance Assessment",
  notes: "Coaching Notes",
  other: "Other",
};

interface DocumentUploadProps {
  currentCount: number;
  maxDocuments: number;
}

export function DocumentUpload({
  currentCount,
  maxDocuments,
}: DocumentUploadProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<DocumentCategory>("other");
  const [dragOver, setDragOver] = useState(false);

  const atLimit = currentCount >= maxDocuments;

  function handleFileSelect(file: File) {
    setError(null);
    const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
    if (!ALLOWED_EXTENSIONS.includes(ext as never)) {
      setError("Unsupported file type. Allowed: PDF, DOCX, MD, TXT.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("File too large. Maximum size is 5MB.");
      return;
    }
    setSelectedFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  function handleUpload() {
    if (!selectedFile || atLimit) return;
    setError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("category", category);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }

      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !atLimit && fileInputRef.current?.click()}
        className={`
          flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8
          transition-colors cursor-pointer
          ${dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"}
          ${atLimit ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <Upload className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {selectedFile
            ? selectedFile.name
            : "Drop a file here or click to browse"}
        </p>
        <p className="text-xs text-muted-foreground">
          PDF, DOCX, MD, or TXT up to 5MB
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.md,.txt"
          className="hidden"
          disabled={atLimit}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
        />
      </div>

      {/* Category + upload button */}
      {selectedFile && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as DocumentCategory)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {DOCUMENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={handleUpload} disabled={isPending || atLimit}>
            {isPending ? "Uploading..." : "Upload"}
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {atLimit && (
        <p className="text-sm text-muted-foreground">
          Maximum {maxDocuments} documents reached. Remove one to upload more.
        </p>
      )}
    </div>
  );
}

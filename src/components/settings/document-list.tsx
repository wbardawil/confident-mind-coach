"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Trash2 } from "lucide-react";
import { deleteDocument } from "@/lib/actions/documents";
import { useRouter } from "next/navigation";

interface Document {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: string;
  createdAt: Date;
}

const CATEGORY_LABELS: Record<string, string> = {
  resume: "Resume / CV",
  personality: "Personality",
  assessment: "Assessment",
  notes: "Notes",
  other: "Other",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentList({ documents }: { documents: Document[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleDelete(id: string) {
    setDeletingId(id);
    startTransition(async () => {
      await deleteDocument(id);
      setDeletingId(null);
      router.refresh();
    });
  }

  if (documents.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No documents uploaded yet. Upload files to give your coach more context
        about you.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between gap-3 rounded-lg border p-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{doc.fileName}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{doc.fileType.toUpperCase()}</span>
                <span>{formatFileSize(doc.fileSize)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="secondary">
              {CATEGORY_LABELS[doc.category] ?? doc.category}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(doc.id)}
              disabled={isPending && deletingId === doc.id}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

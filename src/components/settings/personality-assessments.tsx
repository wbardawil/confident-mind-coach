"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, CheckCircle, RefreshCw, Trash2 } from "lucide-react";
import {
  extractPersonality,
  verifyPersonalityAssessment,
  deletePersonalityAssessment,
} from "@/lib/actions/personality";

interface Assessment {
  id: string;
  documentId: string | null;
  framework: string;
  label: string;
  dimensions: unknown;
  summary: string;
  coachingTips: string;
  verified: boolean;
  createdAt: Date;
}

interface Document {
  id: string;
  fileName: string;
  category: string;
}

const FRAMEWORK_LABELS: Record<string, string> = {
  DISC: "DISC",
  MBTI: "MBTI",
  EA: "Working Genius / EA",
  StrengthsFinder: "CliftonStrengths",
  VIA: "VIA Strengths",
  Enneagram: "Enneagram",
  Big5: "Big Five (OCEAN)",
  other: "Other",
};

function formatDimensions(dimensions: unknown): string[] {
  if (!dimensions || typeof dimensions !== "object") return [];
  return Object.entries(dimensions as Record<string, unknown>).map(
    ([key, value]) => `${key}: ${value}`,
  );
}

export function PersonalityAssessments({
  assessments,
  documents,
}: {
  assessments: Assessment[];
  documents: Document[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionId, setActionId] = useState<string | null>(null);
  const [extractingDocId, setExtractingDocId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Documents that could have personality data but no assessments extracted yet
  const personalityDocs = documents.filter(
    (d) =>
      (d.category === "personality" || d.category === "assessment") &&
      !assessments.some((a) => a.documentId === d.id),
  );

  function handleExtract(documentId: string) {
    setExtractingDocId(documentId);
    setMessage(null);
    startTransition(async () => {
      const result = await extractPersonality(documentId);
      setExtractingDocId(null);
      if (!result.success) {
        setMessage(result.error);
      } else if (result.count === 0 && "message" in result) {
        setMessage(result.message);
      } else {
        setMessage(`Extracted ${result.count} assessment(s) successfully.`);
      }
      router.refresh();
    });
  }

  function handleVerify(assessmentId: string) {
    setActionId(assessmentId);
    startTransition(async () => {
      await verifyPersonalityAssessment(assessmentId);
      setActionId(null);
      router.refresh();
    });
  }

  function handleDelete(assessmentId: string) {
    setActionId(assessmentId);
    startTransition(async () => {
      await deletePersonalityAssessment(assessmentId);
      setActionId(null);
      router.refresh();
    });
  }

  if (assessments.length === 0 && personalityDocs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No personality assessments yet. Upload a DISC, MBTI, StrengthsFinder, or
        other assessment document to see your profile here.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {message && (
        <p className="text-sm text-muted-foreground rounded-md bg-muted px-3 py-2">
          {message}
        </p>
      )}

      {/* Extracted assessments */}
      {assessments.map((assessment) => {
        const dims = formatDimensions(assessment.dimensions);
        return (
          <div
            key={assessment.id}
            className="rounded-lg border p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">{assessment.label}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="secondary">
                      {FRAMEWORK_LABELS[assessment.framework] ?? assessment.framework}
                    </Badge>
                    {assessment.verified && (
                      <Badge variant="outline" className="text-green-600 border-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!assessment.verified && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVerify(assessment.id)}
                    disabled={isPending && actionId === assessment.id}
                    className="h-8 text-xs"
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    Verify
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(assessment.id)}
                  disabled={isPending && actionId === assessment.id}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Dimensions */}
            {dims.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {dims.map((dim) => (
                  <span
                    key={dim}
                    className="text-xs bg-muted rounded-md px-2 py-1"
                  >
                    {dim}
                  </span>
                ))}
              </div>
            )}

            {/* Summary */}
            <p className="text-sm text-muted-foreground">{assessment.summary}</p>

            {/* Coaching tips */}
            <div className="text-sm">
              <span className="font-medium">Coaching implications: </span>
              <span className="text-muted-foreground">{assessment.coachingTips}</span>
            </div>
          </div>
        );
      })}

      {/* Documents that haven't been extracted yet */}
      {personalityDocs.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-dashed p-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Brain className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{doc.fileName}</p>
              <p className="text-xs text-muted-foreground">
                Personality data not yet extracted
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExtract(doc.id)}
            disabled={isPending && extractingDocId === doc.id}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 mr-1 ${
                isPending && extractingDocId === doc.id ? "animate-spin" : ""
              }`}
            />
            Extract
          </Button>
        </div>
      ))}
    </div>
  );
}

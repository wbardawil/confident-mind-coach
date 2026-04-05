"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function ExportButton() {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const response = await fetch("/api/export");
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = response.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") ?? "coaching-export.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Silently handle — the download just won't start
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" onClick={handleExport} disabled={loading}>
      <Download className="mr-2 h-4 w-4" />
      {loading ? "Exporting..." : "Export My Data"}
    </Button>
  );
}

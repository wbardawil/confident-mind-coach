"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Flame,
  Pause,
  Play,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  proposeSystems,
  acceptSystem,
  createSystem,
  completeSystem,
  updateSystemStatus,
  deleteSystem,
} from "@/lib/actions/systems";
import { SYSTEM_FREQUENCY_LABELS, type SystemFrequency } from "@/lib/validators/systems";

interface ProposedSystem {
  title: string;
  description: string;
  frequency: "daily" | "weekly" | "per-event";
}
import { Input } from "@/components/ui/input";

interface SystemData {
  id: string;
  title: string;
  description: string | null;
  frequency: string;
  status: string;
  source: string;
  streak: number;
  lastDoneAt: Date | null;
}

export function GoalSystems({
  goalId,
  systems,
  isActive,
}: {
  goalId: string;
  systems: SystemData[];
  isActive: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [proposals, setProposals] = useState<ProposedSystem[] | null>(null);
  const [proposing, setProposing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  const activeSystems = systems.filter((s) => s.status === "active");
  const otherSystems = systems.filter((s) => s.status !== "active");

  function handlePropose() {
    setProposing(true);
    setProposals(null);
    startTransition(async () => {
      const result = await proposeSystems(goalId);
      setProposing(false);
      if (result.success) {
        setProposals(result.systems);
      }
    });
  }

  function handleAccept(proposal: ProposedSystem) {
    startTransition(async () => {
      await acceptSystem(goalId, proposal);
      setProposals((prev) =>
        prev ? prev.filter((p) => p.title !== proposal.title) : null,
      );
      router.refresh();
    });
  }

  function handleCreate() {
    if (!newTitle.trim()) return;
    startTransition(async () => {
      await createSystem(goalId, {
        title: newTitle.trim(),
        frequency: "daily",
      });
      setNewTitle("");
      setAdding(false);
      router.refresh();
    });
  }

  function handleComplete(systemId: string) {
    setActionId(systemId);
    startTransition(async () => {
      await completeSystem(systemId);
      setActionId(null);
      router.refresh();
    });
  }

  function handleStatusChange(systemId: string, status: "active" | "paused") {
    setActionId(systemId);
    startTransition(async () => {
      await updateSystemStatus(systemId, status);
      setActionId(null);
      router.refresh();
    });
  }

  function handleDelete(systemId: string) {
    setActionId(systemId);
    startTransition(async () => {
      await deleteSystem(systemId);
      setActionId(null);
      router.refresh();
    });
  }

  // Check if a system was done today
  function isDoneToday(lastDoneAt: Date | null): boolean {
    if (!lastDoneAt) return false;
    const today = new Date();
    return (
      lastDoneAt.getFullYear() === today.getFullYear() &&
      lastDoneAt.getMonth() === today.getMonth() &&
      lastDoneAt.getDate() === today.getDate()
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Systems
        </p>
        {isActive && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setAdding(!adding)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handlePropose}
              disabled={proposing}
            >
              <Sparkles className={`h-3 w-3 mr-1 ${proposing ? "animate-pulse" : ""}`} />
              {proposing ? "Thinking..." : "AI Suggest"}
            </Button>
          </div>
        )}
      </div>

      {/* Quick add */}
      {adding && (
        <div className="flex items-center gap-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="What will you do consistently?"
            className="h-8 text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <Button
            size="sm"
            className="h-8 text-xs shrink-0"
            onClick={handleCreate}
            disabled={isPending || !newTitle.trim()}
          >
            Add
          </Button>
        </div>
      )}

      {/* AI proposals */}
      {proposals && proposals.length > 0 && (
        <div className="space-y-2 rounded-md border border-dashed border-primary/30 p-3">
          <p className="text-xs font-medium text-primary">
            AI-suggested systems:
          </p>
          {proposals.map((p) => (
            <div
              key={p.title}
              className="flex items-start justify-between gap-2 rounded-md bg-muted p-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{p.title}</p>
                <p className="text-xs text-muted-foreground">{p.description}</p>
                <Badge variant="outline" className="text-xs mt-1">
                  {SYSTEM_FREQUENCY_LABELS[p.frequency as SystemFrequency]}
                </Badge>
              </div>
              <Button
                size="sm"
                className="h-7 text-xs shrink-0"
                onClick={() => handleAccept(p)}
                disabled={isPending}
              >
                Accept
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Active systems */}
      {activeSystems.length === 0 && !proposals?.length && !adding && (
        <p className="text-xs text-muted-foreground italic">
          No systems yet. Add your own or let AI suggest some.
        </p>
      )}

      {activeSystems.map((s) => {
        const doneToday = isDoneToday(s.lastDoneAt);
        return (
          <div
            key={s.id}
            className={`flex items-center gap-2 rounded-md border p-2 ${
              doneToday ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950" : ""
            }`}
          >
            {/* Complete button */}
            <Button
              variant={doneToday ? "default" : "outline"}
              size="sm"
              className={`h-7 w-7 p-0 shrink-0 ${doneToday ? "bg-green-600 hover:bg-green-700" : ""}`}
              onClick={() => handleComplete(s.id)}
              disabled={(isPending && actionId === s.id) || doneToday}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>

            <div className="flex-1 min-w-0">
              <p className={`text-sm ${doneToday ? "line-through text-muted-foreground" : ""}`}>
                {s.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-[10px] py-0">
                  {SYSTEM_FREQUENCY_LABELS[s.frequency as SystemFrequency]}
                </Badge>
                {s.streak > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] text-orange-600">
                    <Flame className="h-3 w-3" />
                    {s.streak}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-0.5 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground"
                onClick={() => handleStatusChange(s.id, "paused")}
                disabled={isPending && actionId === s.id}
              >
                <Pause className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(s.id)}
                disabled={isPending && actionId === s.id}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        );
      })}

      {/* Paused systems */}
      {otherSystems.length > 0 && (
        <div className="space-y-1">
          {otherSystems.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-2 rounded-md p-2 opacity-50"
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => handleStatusChange(s.id, "active")}
                disabled={isPending && actionId === s.id}
              >
                <Play className="h-3 w-3" />
              </Button>
              <p className="text-sm text-muted-foreground flex-1">{s.title}</p>
              <Badge variant="outline" className="text-[10px]">
                {s.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderPlus,
  History,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  FolderInput,
  FolderOutput,
} from "lucide-react";
import {
  getChatSessions,
  getChatFolders,
  deleteChatSession,
  createChatFolder,
  renameChatFolder,
  deleteChatFolder,
  moveChatToFolder,
  type ChatSessionSummary,
  type ChatFolderData,
} from "@/lib/actions/chat";

interface ChatHistoryProps {
  currentSessionId?: string | null;
}

export function ChatHistory({ currentSessionId }: ChatHistoryProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [folders, setFolders] = useState<ChatFolderData[]>([]);
  const [loading, startTransition] = useTransition();

  // Folder UI state
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Context menu state
  const [menuSessionId, setMenuSessionId] = useState<string | null>(null);
  const [menuFolderId, setMenuFolderId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteFolderId, setConfirmDeleteFolderId] = useState<string | null>(null);

  // Load data when sheet opens
  useEffect(() => {
    if (!open) return;
    startTransition(async () => {
      const [s, f] = await Promise.all([getChatSessions(), getChatFolders()]);
      setSessions(s);
      setFolders(f);
      // Auto-expand folders that have sessions
      const folderIds = new Set(s.filter((x) => x.folderId).map((x) => x.folderId!));
      setExpandedFolders(folderIds);
    });
  }, [open]);

  function reload() {
    startTransition(async () => {
      const [s, f] = await Promise.all([getChatSessions(), getChatFolders()]);
      setSessions(s);
      setFolders(f);
    });
  }

  function openSession(sessionId: string) {
    setOpen(false);
    router.push(`/coach?session=${sessionId}`);
  }

  function startNewChat() {
    setOpen(false);
    router.push("/coach?new=true");
  }

  function toggleFolder(folderId: string) {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }

  // ─── Delete session ────────────────────────────

  function handleDeleteSession(sessionId: string) {
    if (confirmDeleteId !== sessionId) {
      setConfirmDeleteId(sessionId);
      setMenuSessionId(null);
      return;
    }
    startTransition(async () => {
      await deleteChatSession(sessionId);
      setConfirmDeleteId(null);
      if (currentSessionId === sessionId) {
        router.push("/coach?new=true");
      }
      reload();
    });
  }

  // ─── Move to folder ────────────────────────────

  function handleMoveToFolder(sessionId: string, folderId: string | null) {
    setMenuSessionId(null);
    startTransition(async () => {
      await moveChatToFolder(sessionId, folderId);
      reload();
    });
  }

  // ─── Create folder ────────────────────────────

  function handleCreateFolder() {
    if (!newFolderName.trim()) return;
    startTransition(async () => {
      const result = await createChatFolder(newFolderName);
      if (result.success) {
        setCreatingFolder(false);
        setNewFolderName("");
        reload();
      }
    });
  }

  // ─── Rename folder ────────────────────────────

  function handleRenameFolder(folderId: string) {
    if (!renameValue.trim()) return;
    startTransition(async () => {
      await renameChatFolder(folderId, renameValue);
      setRenamingFolderId(null);
      setRenameValue("");
      reload();
    });
  }

  // ─── Delete folder ────────────────────────────

  function handleDeleteFolder(folderId: string) {
    if (confirmDeleteFolderId !== folderId) {
      setConfirmDeleteFolderId(folderId);
      setMenuFolderId(null);
      return;
    }
    startTransition(async () => {
      await deleteChatFolder(folderId);
      setConfirmDeleteFolderId(null);
      reload();
    });
  }

  // ─── Helpers ──────────────────────────────────

  function formatDate(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  const unfolderedSessions = sessions.filter((s) => !s.folderId);
  const folderSessionMap = new Map<string, ChatSessionSummary[]>();
  for (const s of sessions) {
    if (s.folderId) {
      const arr = folderSessionMap.get(s.folderId) ?? [];
      arr.push(s);
      folderSessionMap.set(s.folderId, arr);
    }
  }

  // ─── Session row ──────────────────────────────

  function SessionRow({ s }: { s: ChatSessionSummary }) {
    const isActive = s.id === currentSessionId;
    const title = s.title || s.preview || "Untitled chat";
    const showConfirm = confirmDeleteId === s.id;
    const showMenu = menuSessionId === s.id;

    return (
      <div
        className={`group relative rounded-md transition-colors ${
          isActive ? "bg-accent" : "hover:bg-accent/50"
        }`}
      >
        <button
          onClick={() => openSession(s.id)}
          className="w-full px-3 py-2.5 text-left"
        >
          <div className="flex items-start gap-2">
            <MessageSquare className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1 pr-6">
              <p className="text-sm font-medium truncate">
                {title.length > 55 ? title.slice(0, 55) + "..." : title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">
                  {formatDate(s.updatedAt)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {s.messageCount} msg{s.messageCount !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
        </button>

        {/* More menu trigger */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuSessionId(showMenu ? null : s.id);
            setConfirmDeleteId(null);
          }}
          className="absolute right-2 top-2.5 rounded p-1 opacity-0 group-hover:opacity-100 hover:bg-accent transition-opacity"
        >
          <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        {/* Dropdown menu */}
        {showMenu && (
          <div className="absolute right-2 top-9 z-10 w-44 rounded-md border bg-popover p-1 shadow-md">
            {folders.length > 0 && (
              <>
                {s.folderId ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleMoveToFolder(s.id, null); }}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <FolderOutput className="h-3.5 w-3.5" /> Remove from folder
                  </button>
                ) : null}
                {folders
                  .filter((f) => f.id !== s.folderId)
                  .map((f) => (
                    <button
                      key={f.id}
                      onClick={(e) => { e.stopPropagation(); handleMoveToFolder(s.id, f.id); }}
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                    >
                      <FolderInput className="h-3.5 w-3.5" />
                      <span className="truncate">Move to {f.name}</span>
                    </button>
                  ))}
                <div className="my-1 h-px bg-border" />
              </>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id); }}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        )}

        {/* Delete confirmation */}
        {showConfirm && (
          <div className="mx-3 mb-2 flex items-center gap-2">
            <span className="text-xs text-destructive">Delete this chat?</span>
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id); }}
              className="text-xs font-medium text-destructive hover:underline"
            >
              Confirm
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
              className="text-xs text-muted-foreground hover:underline"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─── Render ───────────────────────────────────

  return (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setMenuSessionId(null); setMenuFolderId(null); setConfirmDeleteId(null); setConfirmDeleteFolderId(null); setCreatingFolder(false); } }}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="h-4 w-4 mr-2" />
          History
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 sm:w-96">
        <SheetHeader>
          <SheetTitle>Chat History</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-2">
          {/* Top actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 justify-start"
              onClick={startNewChat}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => { setCreatingFolder(true); setNewFolderName(""); }}
              title="New folder"
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
          </div>

          {/* Create folder input */}
          {creatingFolder && (
            <div className="flex gap-2">
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                maxLength={50}
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleCreateFolder(); if (e.key === "Escape") setCreatingFolder(false); }}
                className="h-8 text-sm"
              />
              <Button size="sm" onClick={handleCreateFolder} disabled={!newFolderName.trim() || loading}>
                Add
              </Button>
            </div>
          )}

          <div className="h-px bg-border my-3" />

          {loading && sessions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
          )}

          {!loading && sessions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No past conversations yet.</p>
          )}

          <div className="space-y-1 max-h-[calc(100vh-240px)] overflow-y-auto">
            {/* Folders */}
            {folders.map((f) => {
              const folderSessions = folderSessionMap.get(f.id) ?? [];
              const isExpanded = expandedFolders.has(f.id);
              const showFolderMenu = menuFolderId === f.id;
              const showFolderDelete = confirmDeleteFolderId === f.id;
              const isRenaming = renamingFolderId === f.id;

              return (
                <div key={f.id}>
                  {/* Folder header */}
                  <div className="group flex items-center gap-1 rounded-md px-2 py-1.5 hover:bg-accent/50">
                    <button
                      onClick={() => toggleFolder(f.id)}
                      className="flex flex-1 items-center gap-2 text-sm font-medium"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      <Folder className="h-4 w-4 text-muted-foreground" />
                      {isRenaming ? (
                        <Input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => { if (e.key === "Enter") handleRenameFolder(f.id); if (e.key === "Escape") setRenamingFolderId(null); }}
                          className="h-6 text-sm px-1"
                          maxLength={50}
                          autoFocus
                        />
                      ) : (
                        <span className="truncate">{f.name}</span>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto mr-1">
                        {folderSessions.length}
                      </span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuFolderId(showFolderMenu ? null : f.id);
                        setConfirmDeleteFolderId(null);
                      }}
                      className="rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-accent transition-opacity"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>

                    {/* Folder dropdown */}
                    {showFolderMenu && (
                      <div className="absolute right-6 z-10 w-36 rounded-md border bg-popover p-1 shadow-md">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingFolderId(f.id);
                            setRenameValue(f.name);
                            setMenuFolderId(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Rename
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteFolder(f.id); }}
                          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete folder
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Folder delete confirmation */}
                  {showFolderDelete && (
                    <div className="ml-8 mb-1 flex items-center gap-2">
                      <span className="text-xs text-destructive">Delete folder? Chats will be kept.</span>
                      <button onClick={() => handleDeleteFolder(f.id)} className="text-xs font-medium text-destructive hover:underline">Confirm</button>
                      <button onClick={() => setConfirmDeleteFolderId(null)} className="text-xs text-muted-foreground hover:underline">Cancel</button>
                    </div>
                  )}

                  {/* Folder sessions */}
                  {isExpanded && (
                    <div className="ml-4 space-y-0.5">
                      {folderSessions.length === 0 && (
                        <p className="text-xs text-muted-foreground py-1 pl-3">Empty folder</p>
                      )}
                      {folderSessions.map((s) => (
                        <SessionRow key={s.id} s={s} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Unfoldered sessions */}
            {folders.length > 0 && unfolderedSessions.length > 0 && (
              <div className="h-px bg-border my-2" />
            )}
            {unfolderedSessions.map((s) => (
              <SessionRow key={s.id} s={s} />
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

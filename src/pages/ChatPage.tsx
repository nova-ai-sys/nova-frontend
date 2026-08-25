import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Sidebar, type ChatHistoryEntry, type ChatFolder } from '@/components/layout/Sidebar';
import { FolderModal } from '@/components/layout/FolderModal';
import { ChatArea } from '@/components/chat/ChatArea';
import { IntelligencePanel } from '@/components/intelligence/IntelligencePanel';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { SchedulerPanel } from '@/components/scheduler/SchedulerPanel';
import { ConnectionsPanel } from '@/components/connections/ConnectionsPanel';
import { SystemDock } from '@/components/system/SystemDock';
import { SystemMonitorButton } from '@/components/system/SystemMonitorButton';
import { ToastProvider } from '@/components/ui/Toast';
import { useChat } from '@/hooks/useChat';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useVisualViewport } from '@/hooks/useVisualViewport';
import { generateSessionId } from '@/lib/utils';
import * as chatRuns from '@/lib/chatRuns';
import { generateTitle, clearHistory, listSessions } from '@/lib/api';

const HISTORY_STORAGE_KEY = 'nova-chat-history';
const FOLDERS_STORAGE_KEY = 'nova-chat-folders';

/* ── Persistence helpers ──────────────────────────────────── */

function loadPersistedHistory(userId: string): ChatHistoryEntry[] {
  try {
    const raw = localStorage.getItem(`${HISTORY_STORAGE_KEY}:${userId}`);
    return raw ? (JSON.parse(raw) as ChatHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function persistHistory(userId: string, history: ChatHistoryEntry[]) {
  try {
    localStorage.setItem(`${HISTORY_STORAGE_KEY}:${userId}`, JSON.stringify(history));
  } catch { /* quota exceeded — ignore */ }
}

function loadPersistedFolders(userId: string): ChatFolder[] {
  try {
    const raw = localStorage.getItem(`${FOLDERS_STORAGE_KEY}:${userId}`);
    return raw ? (JSON.parse(raw) as ChatFolder[]) : [];
  } catch {
    return [];
  }
}

function persistFolders(userId: string, folders: ChatFolder[]) {
  try {
    localStorage.setItem(`${FOLDERS_STORAGE_KEY}:${userId}`, JSON.stringify(folders));
  } catch { /* quota exceeded — ignore */ }
}

/* ── ChatPage ─────────────────────────────────────────────── */

export function ChatPage() {
  const navigate = useNavigate();
  const { sessionId: sessionIdParam } = useParams<{ sessionId?: string }>();

  // The URL is the source of truth for which chat is open, so reloading (or
  // sharing a link) lands back on the same conversation. `/new-chat`
  // deliberately does NOT fall back to a remembered session — that previously
  // made a bare reload silently reopen whatever chat happened to be active
  // last, with the sidebar highlighting it as if the user had picked it.
  //
  // An unstarted chat holds its id locally without putting it in the URL: an
  // address bar full of uuids for conversations that were never sent is noise,
  // and the id only becomes meaningful — shareable, reloadable — once there is
  // something behind it. `promoteToStartedChat` puts it there on first send.
  const [activeSessionId, setActiveSessionIdState] = useState(() => sessionIdParam ?? generateSessionId());
  const isDraft = !sessionIdParam;
  const isMobile = useIsMobile();
  const viewport = useVisualViewport();

  // The chat owns the whole viewport and scrolls only on the inside — see
  // `.app-shell` in index.css. Scoped to this page so the landing and the docs
  // still scroll as documents.
  useEffect(() => {
    document.documentElement.classList.add('app-shell');
    return () => document.documentElement.classList.remove('app-shell');
  }, []);

  useEffect(() => {
    if (sessionIdParam) {
      // The URL is the external system this effect syncs from.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveSessionIdState((current) => (sessionIdParam !== current ? sessionIdParam : current));
      return;
    }
    // Back on /new-chat — mint a fresh id rather than reusing whatever
    // `activeSessionId` currently holds. Without this, navigating from an open
    // chat to /new-chat would reopen the same conversation, because the
    // component was already mounted and only the URL had changed.
    setActiveSessionIdState(generateSessionId());
  }, [sessionIdParam]);

  /**
   * Switch chats by pushing a new URL — the effect above syncs local state.
   *
   * On a phone the switch stays in local state and the URL is left alone.
   * Installed to the home screen, NOVA runs as a standalone app, and there a
   * history entry per chat is not navigation the user asked for: it makes the
   * back gesture walk through past conversations, and on iOS a URL change in
   * standalone mode is what pulls Safari's address bar and toolbar back over
   * the app. Reload-to-the-same-chat is a desktop affordance worth trading for
   * that, since a phone rarely reloads and never shares the address bar.
   */
  const setActiveSessionId = useCallback(
    (id: string) => {
      if (isMobile) {
        setActiveSessionIdState(id);
        return;
      }
      navigate(`/chat/${id}`);
    },
    [isMobile, navigate],
  );

  /** Start a fresh, unstarted chat. */
  const goToNewChat = useCallback(() => {
    if (isMobile) {
      setActiveSessionIdState(generateSessionId());
      return;
    }
    navigate('/new-chat');
  }, [isMobile, navigate]);

  /**
   * Move a draft chat into the URL, now that it has a message behind it.
   *
   * `replace`, not push: the empty /new-chat the user just left is not a step
   * worth going back to, and leaving it in the history would send Back to a
   * blank chat rather than out of the conversation.
   */
  const promoteToStartedChat = useCallback(() => {
    if (isMobile) return; // The phone never puts the chat id in the URL.
    if (isDraft) navigate(`/chat/${activeSessionId}`, { replace: true });
  }, [isMobile, isDraft, activeSessionId, navigate]);

  const [chatHistory, setChatHistory] = useState<ChatHistoryEntry[]>([]);
  const [folders, setFolders] = useState<ChatFolder[]>([]);
  const [showIntelligence, setShowIntelligence] = useState(false);
  const [showAppSettings, setShowAppSettings] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const [showSystemDock, setShowSystemDock] = useState(false);
  const [folderModal, setFolderModal] = useState<{ open: boolean; editing: ChatFolder | null }>({
    open: false,
    editing: null,
  });

  // Namespace for persisting chat history / folders in localStorage. NOVA
  // runs on one person's machine, so the namespace is a constant — it stays
  // in the key so an existing install's history survives this change.
  const storageKey = 'local-dev';

  const sessionJustChanged = useRef(false);
  const titleGeneratedFor = useRef<Set<string>>(new Set());

  const {
    messages,
    isLoading,
    isLoadingHistory,
    historyUnavailable,
    error,
    streamingContent,
    streamingTools,
    statusMessage,
    plan,
    taskStates,
    send,
    stop,
    retry,
    editMessage,
    loadHistory,
  } = useChat(activeSessionId);

  // Latest chat history, read by the effect below without making it a
  // dependency. Kept in sync from an effect: writing a ref during render is
  // not allowed. This effect is declared first so it runs before the reader.
  const chatHistoryRef = useRef(chatHistory);
  useEffect(() => {
    chatHistoryRef.current = chatHistory;
  }, [chatHistory]);

  useEffect(() => {
    const existsInHistory = chatHistoryRef.current.some((e) => e.id === activeSessionId);
    if (!existsInHistory) return;

    loadHistory().then((result) => {
      if (result === 'empty') {
        setChatHistory((prev) => prev.filter((e) => e.id !== activeSessionId));
      }
    });
  }, [loadHistory, activeSessionId]);

  useEffect(() => {
    const savedHistory = loadPersistedHistory(storageKey);
    const savedFolders = loadPersistedFolders(storageKey);
    // localStorage is an external store; this runs once on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (savedFolders.length > 0) setFolders(savedFolders);

    // The backend (data/sessions/*.json) is the source of truth for which
    // chats exist; localStorage only enriches titles (AI-generated) and folders.
    // Merge both so past chats show up even on a fresh browser.
    listSessions()
      .then((sessions) => {
        const localById = new Map(savedHistory.map((e) => [e.id, e]));
        const merged: ChatHistoryEntry[] = sessions.map((s) => {
          const local = localById.get(s.session_id);
          return {
            id: s.session_id,
            title: local?.title ?? s.title,
            messageCount: s.message_count,
            createdAt: local?.createdAt ?? Math.round(s.created_at * 1000),
            folderId: local?.folderId,
          };
        });
        // Keep any local-only entries the backend doesn't know about yet.
        const diskIds = new Set(sessions.map((s) => s.session_id));
        const localOnly = savedHistory.filter((e) => !diskIds.has(e.id));
        // Chats that already exist keep their title forever — mark them as
        // already-titled so opening them never regenerates a new title.
        for (const s of sessions) titleGeneratedFor.current.add(s.session_id);
        for (const e of savedHistory) titleGeneratedFor.current.add(e.id);
        setChatHistory([...merged, ...localOnly]);
      })
      .catch(() => {
        // Backend unreachable — fall back to local history only.
        for (const e of savedHistory) titleGeneratedFor.current.add(e.id);
        if (savedHistory.length > 0) setChatHistory(savedHistory);
      });
  }, []);

  useEffect(() => {
    if (chatHistory.length > 0) persistHistory(storageKey, chatHistory);
  }, [chatHistory]);

  useEffect(() => {
    persistFolders(storageKey, folders);
  }, [folders]);

  useEffect(() => {
    sessionJustChanged.current = true;
  }, [activeSessionId]);

  // Name the browser tab after the open conversation, so several NOVA tabs
  // are told apart without switching to them.
  const activeChatTitle = chatHistory.find((e) => e.id === activeSessionId)?.title;
  useEffect(() => {
    document.title = activeChatTitle ? `${activeChatTitle} — NOVA` : 'NOVA — AI Agent';
    return () => {
      document.title = 'NOVA — AI Agent';
    };
  }, [activeChatTitle]);

  useEffect(() => {
    if (messages.length === 0) return;

    if (sessionJustChanged.current) {
      sessionJustChanged.current = false;
      return;
    }

    const firstUserMsg = messages.find((m) => m.role === 'user');
    if (!firstUserMsg) return;

    const tempTitle = firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '');

    // The sidebar entry mirrors the conversation as it streams in.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChatHistory((prev) => {
      const existing = prev.findIndex((e) => e.id === activeSessionId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], messageCount: messages.length };
        return updated;
      }
      return [
        { id: activeSessionId, title: tempTitle, messageCount: messages.length, createdAt: Date.now() },
        ...prev,
      ];
    });

    if (
      !titleGeneratedFor.current.has(activeSessionId) &&
      messages.filter(m => m.role === 'user').length === 1 &&
      messages.filter(m => m.role === 'assistant').length >= 1
    ) {
      titleGeneratedFor.current.add(activeSessionId);
      const sid = activeSessionId;
      generateTitle(firstUserMsg.content).then((aiTitle) => {
        setChatHistory((prev) =>
          prev.map((e) => (e.id === sid ? { ...e, title: aiTitle } : e)),
        );
      });
    }
  }, [messages, activeSessionId]);

  /* ── Session handlers ───────────────────────────────────── */

  /**
   * The first message is what actually creates the chat.
   *
   * The send goes out against the id this page already holds, so nothing waits
   * on the navigation — the URL catching up is a cosmetic follow-up, not a
   * step the request depends on.
   */
  const handleSend = useCallback(
    (message: string, files?: Parameters<typeof send>[1]) => {
      send(message, files);
      promoteToStartedChat();
    },
    [send, promoteToStartedChat],
  );

  const handleNewChat = useCallback(() => {
    goToNewChat();
  }, [goToNewChat]);

  const handleSelectSession = useCallback((id: string) => {
    setActiveSessionId(id);
  }, [setActiveSessionId]);

  const handleDeleteChat = useCallback(async (id: string) => {
    // Cancel first: a generation left running would persist the session again
    // right after it was deleted, and the chat would come back on its own.
    if (chatRuns.getRun(id).isLoading) await chatRuns.stop(id);
    chatRuns.discard(id);
    await clearHistory(id);
    setChatHistory((prev) => prev.filter((e) => e.id !== id));
    if (id === activeSessionId) {
      goToNewChat();
    }
  }, [activeSessionId, goToNewChat]);

  const handleRenameChat = useCallback((id: string, newTitle: string) => {
    setChatHistory((prev) =>
      prev.map((e) => (e.id === id ? { ...e, title: newTitle } : e)),
    );
  }, []);

  const handleMoveToFolder = useCallback((chatId: string, folderId: string | null) => {
    setChatHistory((prev) =>
      prev.map((e) => (e.id === chatId ? { ...e, folderId: folderId ?? undefined } : e)),
    );
  }, []);

  /* ── Folder handlers ────────────────────────────────────── */

  const handleCreateFolder = useCallback(() => {
    setFolderModal({ open: true, editing: null });
  }, []);

  const handleEditFolder = useCallback((folder: ChatFolder) => {
    setFolderModal({ open: true, editing: folder });
  }, []);

  const handleSaveFolder = useCallback((data: { name: string; icon: string }) => {
    if (folderModal.editing) {
      setFolders((prev) =>
        prev.map((f) => (f.id === folderModal.editing!.id ? { ...f, ...data } : f)),
      );
    } else {
      setFolders((prev) => [...prev, { id: crypto.randomUUID(), ...data }]);
    }
  }, [folderModal.editing]);

  const handleDeleteFolder = useCallback((id: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== id));
    setChatHistory((prev) =>
      prev.map((e) => (e.folderId === id ? { ...e, folderId: undefined } : e)),
    );
  }, []);

  const openIntelligence = useCallback(() => setShowIntelligence(true), []);
  const openAppSettings = useCallback(() => setShowAppSettings(true), []);
  const openScheduler = useCallback(() => setShowScheduler(true), []);
  const openConnections = useCallback(() => setShowConnections(true), []);

  return (
    <ToastProvider>
      {/* `h-full`, filling the fixed body from index.css, rather than a viewport
          unit: with `viewport-fit=cover` that body spans the whole screen, edge
          to edge, so the sidebar's surface runs right down into the home-bar
          strip instead of stopping above a black band. What keeps the UI off
          the hardware is the safe-area padding inside each column.

          Once the keyboard is up, the shell is pinned to the visible area
          instead: it takes the visual viewport's height and follows its offset,
          so iOS sliding that viewport up no longer carries the app off the top
          of the screen. The sidebar stays put and only the chat gives way. */}
      <div
        className="relative flex h-full overflow-hidden"
        style={
          viewport.keyboardInset
            ? { height: viewport.height, transform: `translateY(${viewport.offsetTop}px)` }
            : undefined
        }
      >
        {/* Column, not a single pane: the resource dock takes the bottom of
            the chat and the conversation shrinks above it instead of being
            covered by an overlay. */}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="relative min-h-0 flex-1">
            <ChatArea
              messages={messages}
              isLoading={isLoading}
              isLoadingHistory={isLoadingHistory}
              historyUnavailable={historyUnavailable}
              error={error}
              streamingContent={streamingContent}
              streamingTools={streamingTools}
              statusMessage={statusMessage}
              plan={plan}
              taskStates={taskStates}
              onSend={handleSend}
              onStop={stop}
              onRetry={retry}
              onEditMessage={editMessage}
            />

            <AnimatePresence>
              {!showSystemDock && (
                <SystemMonitorButton onClick={() => setShowSystemDock(true)} />
              )}
            </AnimatePresence>
          </div>

          <SystemDock open={showSystemDock} onClose={() => setShowSystemDock(false)} />
        </main>

          <Sidebar
          chatHistory={chatHistory}
          folders={folders}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
          onRenameChat={handleRenameChat}
          onMoveToFolder={handleMoveToFolder}
          onCreateFolder={handleCreateFolder}
          onEditFolder={handleEditFolder}
          onDeleteFolder={handleDeleteFolder}
          onOpenIntelligence={openIntelligence}
          onOpenScheduler={openScheduler}
          onOpenConnections={openConnections}
          onOpenAppSettings={openAppSettings}
        />

        <FolderModal
          open={folderModal.open}
          onClose={() => setFolderModal({ open: false, editing: null })}
          onSave={handleSaveFolder}
          initial={folderModal.editing}
        />

        <IntelligencePanel
          open={showIntelligence}
          onClose={() => setShowIntelligence(false)}
        />

        <SettingsPanel
          open={showAppSettings}
          onClose={() => setShowAppSettings(false)}
        />

        <SchedulerPanel
          open={showScheduler}
          onClose={() => setShowScheduler(false)}
        />

        <ConnectionsPanel
          open={showConnections}
          onClose={() => setShowConnections(false)}
        />

      </div>
    </ToastProvider>
  );
}

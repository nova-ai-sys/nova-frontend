import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ChatPage } from '@/pages/ChatPage';
import { Spinner } from '@/components/ui/Spinner';

/**
 * The docs render Markdown at runtime, which pulls in react-markdown and
 * highlight.js — around 350 kB that someone who came to chat should never
 * download. Splitting the route keeps that weight behind the one navigation
 * that needs it.
 */
const DocsPage = lazy(() =>
  import('@/pages/DocsPage').then((m) => ({ default: m.DocsPage })),
);

function DocsRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-surface-950">
          <Spinner />
        </div>
      }
    >
      <DocsPage />
    </Suspense>
  );
}

export default function App() {
  return (
    <Routes>
      {/* A chat that has not been started yet has no id to put in the URL, so
          it lives at /new-chat until the first message is sent. `/` and
          `/chat` are the same thing by another name. */}
      <Route path="/" element={<Navigate to="/new-chat" replace />} />
      <Route path="/chat" element={<Navigate to="/new-chat" replace />} />
      <Route path="/new-chat" element={<ChatPage />} />
      <Route path="/chat/:sessionId" element={<ChatPage />} />
      <Route path="/docs" element={<Navigate to="/docs/setup" replace />} />
      <Route path="/docs/:slug" element={<DocsRoute />} />
    </Routes>
  );
}

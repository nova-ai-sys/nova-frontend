import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { LanguageProvider } from '@/lib/i18n'
import { initScrollbars } from '@/lib/scrollbars'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

initScrollbars();

const rootCrashFallback = (
  <div className="flex h-screen flex-col items-center justify-center gap-4 bg-surface-950 px-6 text-center">
    <h1 className="text-lg font-semibold text-surface-200">Something went wrong</h1>
    <p className="max-w-sm text-sm text-surface-500">
      NOVA hit an unexpected error. Reloading usually fixes it — your chats are saved on the server.
    </p>
    {/* A full-width thumb target on a phone: this is the only control on a
        crashed screen, and a pointer-sized button is a poor thing to hunt for
        when the app has just fallen over. */}
    <button
      onClick={() => window.location.reload()}
      className="w-full max-w-xs rounded-2xl bg-primary-600 px-6 py-4 text-base font-semibold text-surface-950 hover:bg-primary-500 md:w-auto md:rounded-lg md:px-4 md:py-2 md:text-sm md:font-medium"
    >
      Reload
    </button>
  </div>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary label="root" fallback={rootCrashFallback}>
      <BrowserRouter>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)

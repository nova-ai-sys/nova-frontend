import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  Brain,
  Clock,
  Code,
  Cpu,
  Database,
  FileText,
  Github,
  Globe,
  HelpCircle,
  Link2,
  Menu,
  Network,
  Plug,
  Rocket,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { DocsMarkdown } from '@/components/docs/DocsMarkdown';
import { Spinner } from '@/components/ui/Spinner';
import { useDocs, type DocPage } from '@/hooks/useDocs';

/**
 * The documentation reader.
 *
 * The pages themselves are not in this file — they are Markdown under
 * `docs/content/`, bundled at build time and loaded by `useDocs`. This
 * component is only the shell around them: navigation, breadcrumb and layout.
 */

/* ─── Icons ───
   Frontmatter names an icon as a string, so the bundle stays plain data. Only
   the icons the docs actually use are imported; anything unrecognised falls
   back rather than rendering nothing. */
const ICONS: Record<string, React.ElementType> = {
  Rocket,
  Zap,
  HelpCircle,
  Cpu,
  Network,
  Wrench,
  Brain,
  Globe,
  Code,
  Clock,
  Plug,
  Link2,
  FileText,
  Database,
};

/* ─── Sidebar entry ─── */
function NavItem({
  doc,
  isActive,
  onClick,
}: {
  doc: DocPage;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = ICONS[doc.icon] ?? BookOpen;
  return (
    <button
      onClick={onClick}
      title={doc.summary}
      className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-all ${
        isActive
          ? 'bg-primary-500/10 text-primary-300'
          : 'text-surface-400 hover:bg-surface-800/50 hover:text-surface-200'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{doc.title}</span>
    </button>
  );
}

/* ─── Whole-page states ─── */
function DocsShellMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-surface-950 px-6 text-center">
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   DOCS PAGE
   ═══════════════════════════════════════════════════════ */
export function DocsPage() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const docs = useDocs();
  const activeDoc = useMemo(
    () => docs.pages.find((d) => d.slug === slug) ?? docs.pages[0],
    [docs.pages, slug],
  );

  useEffect(() => {
    if (!activeDoc) return;
    document.title = `${activeDoc.title} — NOVA Docs`;
    contentRef.current?.scrollTo(0, 0);
  }, [activeDoc]);

  // Closing the drawer belongs to the tap that picked a page, not to the page
  // changing — a reader who followed a link inside the text never opened it.
  const goToDoc = (target: string) => {
    setSidebarOpen(false);
    navigate(`/docs/${target}`);
  };

  const categories = useMemo(
    () =>
      docs.categories.length > 0
        ? docs.categories
        : Array.from(new Set(docs.pages.map((d) => d.category))),
    [docs.categories, docs.pages],
  );

  if (docs.status === 'loading') {
    return (
      <DocsShellMessage>
        <Spinner />
        <p className="text-sm text-surface-500">Loading the documentation…</p>
      </DocsShellMessage>
    );
  }

  if (docs.status === 'error' || !activeDoc) {
    return (
      <DocsShellMessage>
        <h1 className="text-lg font-semibold text-surface-200">
          The documentation could not be loaded
        </h1>
        <p className="max-w-md text-sm text-surface-500">
          {docs.status === 'error' ? docs.error : 'The bundle came back empty.'} You can read the
          same pages in the repository, under <code className="text-primary-400">docs/content/</code>.
        </p>
        <button
          onClick={() => navigate('/')}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-surface-950 transition-colors hover:bg-primary-500"
        >
          Back to NOVA
        </button>
      </DocsShellMessage>
    );
  }

  const ActiveIcon = ICONS[activeDoc.icon] ?? BookOpen;

  return (
    <div className="flex h-screen bg-surface-950 text-surface-100">
      {/* ─── Sidebar ─── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-surface-700/30 bg-surface-950 transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between border-b border-surface-700/30 px-5 py-4">
          <button
            onClick={() => navigate('/')}
            className="flex cursor-pointer items-center gap-2 text-surface-300 transition-colors hover:text-primary-400"
          >
            <ArrowLeft className="h-4 w-4" />
            <img src={`${import.meta.env.BASE_URL}ai-bot.png`} alt="NOVA" className="h-5 w-5" />
            <span className="text-sm font-bold text-primary-400 tracking-wider">NOVA</span>
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="cursor-pointer rounded-lg p-1.5 text-surface-400 hover:bg-surface-800 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="scrollbar-thin overflow-y-auto p-4" style={{ height: 'calc(100% - 65px)' }}>
          {categories.map((cat) => (
            <div key={cat} className="mb-6">
              <div className="mb-2 px-3 text-xs font-medium text-surface-500 uppercase tracking-widest">
                {cat}
              </div>
              <div className="space-y-0.5">
                {docs.pages
                  .filter((d) => d.category === cat)
                  .map((doc) => (
                    <NavItem
                      key={doc.slug}
                      doc={doc}
                      isActive={doc.slug === activeDoc.slug}
                      onClick={() => goToDoc(doc.slug)}
                    />
                  ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Main content ─── */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-surface-700/30 px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="cursor-pointer rounded-lg p-1.5 text-surface-400 hover:bg-surface-800 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-sm text-surface-400">
              <BookOpen className="h-4 w-4" />
              <span>{activeDoc.category}</span>
              <span className="text-surface-600">/</span>
              <span className="text-surface-200">{activeDoc.title}</span>
            </div>
          </div>
          <a
            href="https://github.com/nova-ai-sys/nova-agent"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg p-2 text-surface-400 transition-colors hover:bg-surface-800 hover:text-surface-200"
          >
            <Github className="h-4 w-4" />
          </a>
        </div>

        {/* Content */}
        <div ref={contentRef} className="scrollbar-thin flex-1 overflow-y-auto">
          <motion.div
            key={activeDoc.slug}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mx-auto max-w-3xl px-8 py-10"
          >
            {/* Page title */}
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500/10">
                <ActiveIcon className="h-5 w-5 text-primary-400" />
              </div>
              <h1 className="text-3xl font-bold text-surface-100">{activeDoc.title}</h1>
            </div>
            <p className="mb-10 text-surface-500">{activeDoc.summary}</p>

            <DocsMarkdown content={activeDoc.content} />
          </motion.div>
        </div>
      </main>
    </div>
  );
}

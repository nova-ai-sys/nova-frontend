import { useEffect, useState } from 'react';

/**
 * The documentation, loaded from the generated bundle.
 *
 * The pages live as Markdown in `docs/content/` and are baked into
 * `docs-bundle.json` by `scripts/build_docs_bundle.py` at build time. Nothing
 * about the docs is written in this app — a page added to the repository shows
 * up here on the next build, with no component to edit.
 *
 * `VITE_DOCS_BUNDLE_URL` overrides where the bundle comes from. Once the docs
 * live in their own repository and are published separately, the local agent
 * can point at that published bundle and get documentation updates without
 * updating NOVA itself; the bundle shipped in the build stays as the offline
 * fallback below.
 */

export interface DocPage {
  slug: string;
  title: string;
  category: string;
  categoryRank: number;
  order: number;
  /** Name of a lucide-react icon; the docs page maps it to a component. */
  icon: string;
  summary: string;
  /** Markdown body, frontmatter already stripped. */
  content: string;
}

interface DocsBundle {
  generatedAt: string;
  hash: string;
  categories: string[];
  pages: DocPage[];
}

type DocsState =
  | { status: 'loading'; pages: DocPage[]; categories: string[] }
  | { status: 'ready'; pages: DocPage[]; categories: string[] }
  | { status: 'error'; pages: DocPage[]; categories: string[]; error: string };

/** Bundle shipped with this build. Always reachable, never stale-proof. */
const LOCAL_BUNDLE = `${import.meta.env.BASE_URL}docs-bundle.json`;

/** Published bundle, when one is configured. Tried first, falls back to local. */
const REMOTE_BUNDLE = import.meta.env.VITE_DOCS_BUNDLE_URL?.trim();

const CACHE_KEY = 'nova-docs-bundle';

function readCache(): DocsBundle | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as DocsBundle) : null;
  } catch {
    // A private window, cleared site data, or a browser that throws on access.
    return null;
  }
}

function writeCache(bundle: DocsBundle) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(bundle));
  } catch {
    // The bundle is ~115 kB and quota is the likely failure. Not being able to
    // cache costs a refetch, which is not worth surfacing to the reader.
  }
}

async function fetchBundle(url: string): Promise<DocsBundle> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const bundle = (await res.json()) as DocsBundle;
  if (!Array.isArray(bundle.pages) || bundle.pages.length === 0) {
    throw new Error('bundle has no pages');
  }
  return bundle;
}

/**
 * Load the documentation.
 *
 * Renders from the cached copy immediately when there is one, then replaces it
 * with whatever the network returns — so a reader on a slow connection, or
 * offline entirely, still gets the docs rather than a spinner.
 */
export function useDocs(): DocsState {
  const cached = readCache();
  const [state, setState] = useState<DocsState>(
    cached
      ? { status: 'ready', pages: cached.pages, categories: cached.categories }
      : { status: 'loading', pages: [], categories: [] },
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const sources = REMOTE_BUNDLE ? [REMOTE_BUNDLE, LOCAL_BUNDLE] : [LOCAL_BUNDLE];
      let lastError = 'unknown error';

      for (const url of sources) {
        try {
          const bundle = await fetchBundle(url);
          if (cancelled) return;
          writeCache(bundle);
          setState({
            status: 'ready',
            pages: bundle.pages,
            categories: bundle.categories,
          });
          return;
        } catch (err) {
          lastError = err instanceof Error ? err.message : String(err);
        }
      }

      if (cancelled) return;
      setState((prev) =>
        // A failed refresh must not throw away pages already on screen.
        prev.pages.length > 0
          ? prev
          : { status: 'error', pages: [], categories: [], error: lastError },
      );
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

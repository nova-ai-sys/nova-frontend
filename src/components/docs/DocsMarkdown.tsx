import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Mermaid } from '@/components/ui/Mermaid';
import { CopyButton, InlineCode } from '@/components/ui/MarkdownRenderer';
import { extractText } from '@/lib/markdown';
import 'highlight.js/styles/vs2015.min.css';

/**
 * Markdown renderer for the documentation pages.
 *
 * Separate from the chat's `MarkdownRenderer` because a doc page is read, not
 * skimmed: the type is larger, the vertical rhythm is looser, and two things
 * the chat has no use for are handled here — ```mermaid fences become
 * diagrams, and links between pages navigate in-app instead of opening a tab.
 * The copy button and inline-code styling are shared with the chat renderer so
 * code looks the same wherever it appears.
 */

interface DocsMarkdownProps {
  content: string;
}

export function DocsMarkdown({ content }: DocsMarkdownProps) {
  const navigate = useNavigate();

  return (
    <div className="docs-content text-[15px] leading-7 text-surface-300">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          pre({ children }) {
            const codeEl = children as React.ReactElement<{
              className?: string;
              children?: ReactNode;
            }>;
            const codeClass = codeEl?.props?.className ?? '';
            const lang = /language-(\w+)/.exec(codeClass)?.[1] ?? '';
            const plainText = extractText(codeEl?.props?.children).replace(/\n$/, '');

            // A diagram is the content, not a listing of it.
            if (lang === 'mermaid') {
              return <Mermaid chart={plainText} />;
            }

            return (
              <div className="my-5 overflow-hidden rounded-xl border border-surface-700/40 bg-surface-950">
                <div className="flex items-center justify-between border-b border-surface-700/40 bg-surface-900/60 px-4 py-1.5">
                  <span className="text-[10px] font-medium text-primary-600">
                    {lang || 'code'}
                  </span>
                  <CopyButton text={plainText} />
                </div>
                <pre className="code-scroll overflow-x-auto p-4 text-sm leading-relaxed !bg-transparent !m-0">
                  {children}
                </pre>
              </div>
            );
          },

          code({ className: codeClass, children }) {
            if (/language-/.test(codeClass || '')) {
              return <code className={codeClass}>{children}</code>;
            }
            return <InlineCode>{children}</InlineCode>;
          },

          h2: ({ children }) => (
            <h2 className="mt-12 mb-4 text-2xl font-bold text-surface-100 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-8 mb-3 text-lg font-semibold text-surface-200">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="mt-6 mb-2 font-semibold text-surface-200">{children}</h4>
          ),

          p: ({ children }) => <p className="mb-4">{children}</p>,

          ul: ({ children }) => <ul className="mb-4 list-disc space-y-2 pl-6">{children}</ul>,
          ol: ({ children }) => <ol className="mb-4 list-decimal space-y-2 pl-6">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,

          hr: () => <hr className="my-10 border-surface-700/40" />,

          blockquote: ({ children }) => (
            <blockquote className="my-5 border-l-2 border-primary-700 pl-4 text-surface-400">
              {children}
            </blockquote>
          ),

          a: ({ href, children }) => {
            // Links written as /docs/<slug> point at another page of this same
            // site; sending the reader through a full page load — or worse, a
            // new tab — would lose their place in the docs.
            const isInternal = href?.startsWith('/');
            if (isInternal) {
              return (
                <a
                  href={href}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(href!);
                  }}
                  className="font-medium text-primary-400 underline decoration-primary-800 underline-offset-2 transition-colors hover:text-primary-300"
                >
                  {children}
                </a>
              );
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary-400 underline decoration-primary-800 underline-offset-2 transition-colors hover:text-primary-300"
              >
                {children}
              </a>
            );
          },

          strong: ({ children }) => (
            <strong className="font-semibold text-surface-100">{children}</strong>
          ),

          table: ({ children }) => (
            <div className="code-scroll my-5 overflow-x-auto rounded-xl border border-surface-700/40">
              <table className="min-w-full divide-y divide-surface-700/40 text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-surface-900/60">{children}</thead>,
          th: ({ children }) => (
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-primary-500">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 align-top text-surface-300">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

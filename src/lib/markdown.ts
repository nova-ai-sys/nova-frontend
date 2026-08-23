import type { ReactNode } from 'react';

/**
 * Flatten a React children tree to plain text.
 *
 * Both markdown renderers need the raw source of a fenced block: the chat and
 * docs renderers to fill the copy button, and the docs renderer to hand a
 * mermaid fence to the diagram component. By the time the block reaches the
 * component it is already a React tree, so the text has to be walked back out.
 */
export function extractText(node: ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    const el = node as React.ReactElement<{ children?: ReactNode }>;
    return extractText(el.props.children);
  }
  return '';
}

'use client';

/**
 * Carsai Mozambique — Chat Markdown Renderer
 *
 * Renders AI chat responses with full Markdown support including:
 * - GFM (GitHub Flavored Markdown): tables, strikethrough, task lists, autolinks
 * - Code blocks with syntax highlighting + copy button
 * - Inline code styling
 * - Safe HTML rendering (rehype-raw + rehype-sanitize)
 * - Dark mode support
 * - Responsive layout
 */

import { useState, useCallback, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Allow safe HTML tags in rehype-sanitize ──

const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'u', 's', 'mark', 'sub', 'sup', 'abbr', 'kbd', 'var', 'samp',
    'details', 'summary', 'input',
  ],
  attributes: {
    ...defaultSchema.attributes,
    '*': ['className', 'style'],
    input: ['type', 'checked', 'disabled'],
    a: ['href', 'target', 'rel', 'title'],
    img: ['src', 'alt', 'title', 'loading'],
    code: ['language'],
  },
};

// ── Copy Button for Code Blocks ──

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'absolute top-2 right-2 z-10 p-1.5 rounded-md transition-all',
        'opacity-0 group-hover:opacity-100 focus:opacity-100',
        copied
          ? 'bg-emerald-500/20 text-emerald-400'
          : 'bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
      aria-label={copied ? 'Copied' : 'Copy code'}
      title={copied ? 'Copied!' : 'Copy'}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

// ── Markdown component overrides ──

function CodeBlock({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<'code'> & { children?: ReactNode }) {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeText = String(children).replace(/\n$/, '');

  // Check if this is a multi-line code block (inside <pre>) or inline code
  const isInline = !className && !codeText.includes('\n');

  if (isInline) {
    return (
      <code
        className="px-1.5 py-0.5 rounded bg-red-100/70 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-[0.85em] font-mono"
        {...props}
      >
        {children}
      </code>
    );
  }

  return (
    <div className="group relative my-3 rounded-lg overflow-hidden border border-border/50">
      {/* Language label */}
      {language && (
        <div className="flex items-center justify-between px-4 py-1.5 bg-muted/60 border-b border-border/40">
          <span className="text-[11px] font-mono text-muted-foreground/70 uppercase tracking-wider">
            {language}
          </span>
        </div>
      )}
      <div className="relative">
        <CopyButton text={codeText} />
        <SyntaxHighlighter
          language={language || 'text'}
          style={oneDark}
          PreTag="div"
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'transparent',
            fontSize: '0.8rem',
            lineHeight: '1.5',
          }}
          codeTagProps={{
            style: { fontFamily: 'inherit' },
          }}
          wrapLongLines
        >
          {codeText}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

// ── Main Component ──

interface ChatMarkdownRendererProps {
  content: string;
  className?: string;
  /** Whether this is a user message (lighter styling) */
  isUser?: boolean;
}

export function ChatMarkdownRenderer({ content, className, isUser = false }: ChatMarkdownRendererProps) {
  // For user messages, just render plain text with basic formatting
  if (isUser) {
    return (
      <p className={cn('whitespace-pre-wrap break-words overflow-wrap-anywhere leading-relaxed', className)}>
        {content}
      </p>
    );
  }

  return (
    <div className={cn('chat-markdown-content', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
        components={{
          // Code blocks (inline & block)
          code: CodeBlock,

          // Paragraphs
          p: ({ children }) => (
            <p className="mb-2 last:mb-0 leading-relaxed break-words">{children}</p>
          ),

          // Headers
          h1: ({ children }) => (
            <h1 className="text-base font-bold mt-4 mb-2 first:mt-0 break-words">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-bold mt-3 mb-1.5 first:mt-0 break-words">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold mt-2 mb-1 first:mt-0 break-words">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs font-semibold mt-2 mb-1 first:mt-0 break-words">{children}</h4>
          ),

          // Bold
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),

          // Italic
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),

          // Links — open in new tab
          a: ({ href, children, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-600 dark:text-red-400 underline underline-offset-2 hover:text-red-700 dark:hover:text-red-300 transition-colors break-all"
              {...props}
            >
              {children}
            </a>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-outside ml-4 mb-2 space-y-0.5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside ml-4 mb-2 space-y-0.5">{children}</ol>
          ),
          li: ({ children, ...props }) => {
            // Task list items — react-markdown passes node properties
            const checked = (props as { checked?: boolean | null })?.checked;
            if (checked !== undefined && checked !== null) {
              return (
                <li className="flex items-start gap-1.5 mb-0.5">
                  <input
                    type="checkbox"
                    checked={!!checked}
                    readOnly
                    className="mt-0.5 rounded border-border"
                  />
                  <span className="flex-1">{children}</span>
                </li>
              );
            }
            return <li className="mb-0.5">{children}</li>;
          },

          // Blockquote
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-red-300 dark:border-red-700 pl-3 my-2 italic text-muted-foreground">
              {children}
            </blockquote>
          ),

          // Horizontal rule
          hr: () => (
            <hr className="border-border/50 my-3" />
          ),

          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-2 -mx-1 px-1">
              <table className="w-full text-xs border-collapse border border-border/50 rounded-md">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/50">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border border-border/50 px-2 py-1 text-left font-semibold whitespace-nowrap">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border/50 px-2 py-1 break-words">{children}</td>
          ),

          // Images
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt || ''}
              className="max-w-full h-auto rounded-md my-2"
              loading="lazy"
            />
          ),

          // Pre tag (for code blocks without language) — delegate to CodeBlock
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

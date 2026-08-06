/**
 * Carsai Mozambique - Rich Text Editor Component
 *
 * A reusable rich text editor built on react-quill-new (React 19 compatible)
 * with 3 configurable levels:
 * - Full (admin): Complete toolbar with all features
 * - Basic (partner): Limited toolbar — bold, italic, underline, headers, lists, links
 * - Minimal (user): Very basic — bold, italic, links only
 *
 * Uses dynamic import for Next.js SSR compatibility.
 * Outputs HTML content for storing in the database.
 */

'use client';

import dynamic from 'next/dynamic';
import { useCallback, useMemo } from 'react';

// Dynamically import react-quill-new to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => (
    <div className="border rounded-md p-4 min-h-[120px] bg-muted/20 flex items-center justify-center text-muted-foreground">
      Loading editor...
    </div>
  ),
});

// Import Quill styles — react-quill-new includes its own CSS
import 'react-quill-new/dist/quill.snow.css';

export type EditorLevel = 'full' | 'basic' | 'minimal';

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  level?: EditorLevel;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
}

// ── Toolbar configurations ──

const FULL_TOOLBAR = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ size: ['small', false, 'large', 'huge'] }],
  ['bold', 'italic', 'underline', 'strike', 'blockquote'],
  [{ color: [] }, { background: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ indent: '-1' }, { indent: '+1' }],
  [{ align: [] }],
  [{ direction: 'rtl' }],
  ['link', 'image', 'video', 'code-block'],
  ['clean'],
];

const BASIC_TOOLBAR = [
  [{ header: [2, 3, false] }],
  ['bold', 'italic', 'underline'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['link'],
  ['clean'],
];

const MINIMAL_TOOLBAR = [
  ['bold', 'italic'],
  ['link'],
  ['clean'],
];

function getToolbar(level: EditorLevel) {
  switch (level) {
    case 'full':
      return FULL_TOOLBAR;
    case 'basic':
      return BASIC_TOOLBAR;
    case 'minimal':
      return MINIMAL_TOOLBAR;
    default:
      return BASIC_TOOLBAR;
  }
}

export function RichTextEditor({
  value = '',
  onChange,
  level = 'basic',
  placeholder = 'Write something...',
  readOnly = false,
  className = '',
}: RichTextEditorProps) {
  const toolbar = useMemo(() => getToolbar(level), [level]);

  const handleChange = useCallback(
    (content: string) => {
      if (onChange) {
        onChange(content);
      }
    },
    [onChange]
  );

  const modules = useMemo(
    () => ({
      toolbar,
    }),
    [toolbar]
  );

  const formats = useMemo(() => {
    if (level === 'full') {
      return [
        'header', 'font', 'size', 'bold', 'italic', 'underline', 'strike',
        'blockquote', 'color', 'background', 'list', 'bullet', 'indent',
        'align', 'direction', 'link', 'image', 'video', 'code-block', 'clean',
      ];
    }
    if (level === 'basic') {
      return ['header', 'bold', 'italic', 'underline', 'list', 'bullet', 'link', 'clean'];
    }
    return ['bold', 'italic', 'link', 'clean'];
  }, [level]);

  return (
    <div className={`rich-text-editor-wrapper ${className}`}>
      <div className="quill-wrapper dark:quill-dark">
        <ReactQuill
          theme="snow"
          value={value}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}

/**
 * RichTextRenderer — renders HTML content from the editor for display
 * Uses DOMPurify sanitization for safe HTML rendering
 */
export function RichTextRenderer({
  content,
  className = '',
}: {
  content: string;
  className?: string;
}) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { sanitizeQuillHtml } = require('@/lib/sanitize-html') as typeof import('@/lib/sanitize-html');

  if (!content) return null;

  return (
    <div
      className={`ql-editor-content prose prose-sm max-w-none dark:prose-invert ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizeQuillHtml(content) }}
    />
  );
}

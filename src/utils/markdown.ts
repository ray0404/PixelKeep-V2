import { Marked } from 'marked';
import hljs from 'highlight.js';
import DOMPurify from 'dompurify';

export const DOMPURIFY_CONFIG = {
  ADD_TAGS: ['iframe', 'picture', 'source', 'button', 'video', 'audio'],
  ADD_ATTR: [
    'allow',
    'allowfullscreen',
    'frameborder',
    'scrolling',
    'srcset',
    'media',
    'sizes',
    'type',
    'loading',
    'data-code',
    'target',
    'id',
    'width',
    'height',
    'referrerpolicy',
    'title',
    'src',
    'alt',
    'controls',
    'autoplay',
    'loop',
    'muted',
    'poster',
    'sandbox',
    'name'
  ]
};

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function createMarkdownParser(): Marked {
  const parser = new Marked();

  parser.use({
    breaks: false, // Standard markdown: requires double-space before newline or double-enter for new paragraph
    gfm: true,
    renderer: {
      heading(token: any) {
        const renderedText = this.parser.parseInline(token.tokens);
        const slug = slugifyHeading(token.text);
        return `<h${token.depth} id="${slug}">${renderedText}</h${token.depth}>`;
      },
      code({ text, lang }: { text: string; lang?: string }) {
        const cleanLang = (lang || '').trim().split(/\s+/)[0];
        const language = cleanLang && hljs.getLanguage(cleanLang) ? cleanLang : undefined;
        let highlighted = '';

        if (language) {
          try {
            highlighted = hljs.highlight(text, { language, ignoreIllegals: true }).value;
          } catch {
            highlighted = text;
          }
        } else {
          try {
            highlighted = hljs.highlightAuto(text).value;
          } catch {
            highlighted = text;
          }
        }

        const encoded = encodeURIComponent(text);
        const displayLang = language || cleanLang || 'code';

        return `<div class="code-block-wrapper relative group my-3">
  <div class="code-block-header flex items-center justify-between px-3 py-1 bg-surface/80 border-t-2 border-x-2 border-border-light text-[10px] font-mono select-none">
    <span class="code-block-lang uppercase text-text-meta">${displayLang}</span>
    <button type="button" class="code-copy-btn flex items-center gap-1 text-[10px] uppercase text-primary hover:text-text-light cursor-pointer px-1 py-0.5 border border-primary/40 bg-primary/10 transition-colors" data-code="${encoded}" title="Copy code">
      <span class="material-symbols-outlined text-xs pointer-events-none">content_copy</span>
      <span class="pointer-events-none copy-label">COPY</span>
    </button>
  </div>
  <pre class="m-0 p-3 overflow-x-auto border-2 border-border-light"><code class="hljs ${language ? 'language-' + language : ''}">${highlighted}</code></pre>
</div>`;
      }
    },
    tokenizer: {
      code(src: string) {
        // Prevent indented HTML tags (e.g., <a><picture>...</picture></a>) from being parsed as indented code blocks
        if (/^(?: {4}|\t)+<[a-zA-Z\/!]/.test(src)) {
          return undefined;
        }
        return false;
      }
    }
  });

  return parser;
}

const markdownParser = createMarkdownParser();

export function renderMarkdown(content: string): string {
  const rawHtml = markdownParser.parse(content) as string;
  return DOMPurify.sanitize(rawHtml, DOMPURIFY_CONFIG);
}

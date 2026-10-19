import { describe, it, expect } from 'vitest';
import { renderMarkdown, slugifyHeading } from './markdown';
import { htmlToPlainText } from './ui';

describe('htmlToPlainText', () => {
  it('preserves single newlines between div blocks without adding blank lines', () => {
    const html = '<div>Line 1</div><div>Line 2</div><div>Line 3</div>';
    const text = htmlToPlainText(html);
    expect(text).toBe('Line 1\nLine 2\nLine 3');
  });

  it('preserves double newlines for intentional empty lines (double enter)', () => {
    const html = '<div>Paragraph 1</div><div><br></div><div>Paragraph 2</div>';
    const text = htmlToPlainText(html);
    expect(text).toBe('Paragraph 1\n\nParagraph 2');
  });

  it('preserves double spaces before a newline', () => {
    const html = '<div>Line 1  </div><div>Line 2</div>';
    const text = htmlToPlainText(html);
    expect(text).toBe('Line 1  \nLine 2');
  });

  it('leaves raw plain text unchanged', () => {
    const raw = 'Line 1\nLine 2\n\nLine 3';
    expect(htmlToPlainText(raw)).toBe(raw);
  });

  it('preserves embedded <iframe> tags without stripping them', () => {
    const rawIframe = '<div>Video:</div><div><iframe width="560" height="315" src="https://www.youtube.com/embed/YJ_e-dsMruc?si=fKqgTiOeYVvoJJJf" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>';
    const text = htmlToPlainText(rawIframe);
    expect(text).toContain('<iframe width="560" height="315" src="https://www.youtube.com/embed/YJ_e-dsMruc?si=fKqgTiOeYVvoJJJf"');
    expect(text).toContain('allowfullscreen');
  });
});

describe('slugifyHeading', () => {
  it('generates URL-safe lowercase slugs without emojis or special characters', () => {
    expect(slugifyHeading('🚀 Key Features')).toBe('key-features');
    expect(slugifyHeading('Table of Contents!')).toBe('table-of-contents');
    expect(slugifyHeading('Code Blocks (Updated)')).toBe('code-blocks-updated');
  });
});

describe('renderMarkdown', () => {
  it('adheres to standard markdown line break rules (breaks: false)', () => {
    // Single Enter: same paragraph, no <br>
    const singleEnter = renderMarkdown('Line 1\nLine 2');
    expect(singleEnter).toContain('<p>Line 1\nLine 2</p>');
    expect(singleEnter).not.toContain('<br');

    // Double Space + Enter: inserts <br>
    const doubleSpace = renderMarkdown('Line 1  \nLine 2');
    expect(doubleSpace).toContain('<p>Line 1<br>Line 2</p>');

    // Double Enter: two distinct paragraphs
    const doubleEnter = renderMarkdown('Paragraph 1\n\nParagraph 2');
    expect(doubleEnter).toContain('<p>Paragraph 1</p>');
    expect(doubleEnter).toContain('<p>Paragraph 2</p>');
  });

  it('renders <a> with <picture> tags as valid HTML and NOT as a codeblock', () => {
    const input = `<a href="https://pixelkeep.app">
  <picture>
    <source srcset="logo.webp" type="image/webp">
    <img src="logo.png" alt="PixelKeep Logo">
  </picture>
</a>`;
    const rendered = renderMarkdown(input);

    expect(rendered).not.toContain('<pre>');
    expect(rendered).not.toContain('<code>');
    expect(rendered).toContain('<a href="https://pixelkeep.app"');
    expect(rendered).toContain('<picture>');
    expect(rendered).toContain('<source srcset="logo.webp"');
    expect(rendered).toContain('<img src="logo.png" alt="PixelKeep Logo"');
  });

  it('renders embedded YouTube <iframe> with full attributes intact', () => {
    const input = '<iframe width="560" height="315" src="https://www.youtube.com/embed/YJ_e-dsMruc?si=fKqgTiOeYVvoJJJf" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>';
    const rendered = renderMarkdown(input);

    expect(rendered).toContain('<iframe');
    expect(rendered).toContain('width="560"');
    expect(rendered).toContain('height="315"');
    expect(rendered).toContain('src="https://www.youtube.com/embed/YJ_e-dsMruc?si=fKqgTiOeYVvoJJJf"');
    expect(rendered).toContain('title="YouTube video player"');
    expect(rendered).toContain('frameborder="0"');
    expect(rendered).toContain('allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"');
    expect(rendered).toContain('referrerpolicy="strict-origin-when-cross-origin"');
    expect(rendered).toContain('allowfullscreen');
  });

  it('renders language-specific syntax highlighted codeblocks with copy button', () => {
    const input = '```typescript\nconst quest: string = "Find the ancient scroll";\n```';
    const rendered = renderMarkdown(input);

    expect(rendered).toContain('class="code-block-wrapper');
    expect(rendered).toContain('class="code-block-header');
    expect(rendered).toContain('class="code-copy-btn');
    expect(rendered).toContain('data-code="const%20quest%3A%20string%20%3D%20%22Find%20the%20ancient%20scroll%22%3B"');
    expect(rendered).toContain('class="code-block-lang uppercase text-text-meta">typescript</span>');
    expect(rendered).toContain('hljs-keyword');
    expect(rendered).toContain('const');
    expect(rendered).toContain('hljs-string');
  });

  it('adds slug IDs to headings for Table of Contents navigation', () => {
    const input = '# Table of Contents\n\n[🚀 Key Features](#key-features)\n\n## 🚀 Key Features';
    const rendered = renderMarkdown(input);

    expect(rendered).toContain('<h1 id="table-of-contents">Table of Contents</h1>');
    expect(rendered).toContain('<h2 id="key-features">🚀 Key Features</h2>');
    expect(rendered).toContain('<a href="#key-features">🚀 Key Features</a>');
  });
});

import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import toc from 'markdown-it-table-of-contents';
import texmath from 'markdown-it-texmath';
import hljs from 'highlight.js';
import katex from 'katex';

export type RenderOptions = {
  offline: boolean;
  toc: boolean;
};

export function createRenderer(options: RenderOptions) {
  const highlight = (code: string, lang: string) => {
    if (lang && hljs.getLanguage(lang)) {
      const rendered = hljs.highlight(code, { language: lang }).value;
      return `<pre class="hljs"><code>${rendered}</code></pre>`;
    }
    return `<pre class="hljs"><code>${escapeHtml(code)}</code></pre>`;
  };

  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    highlight,
  });

  md.use(anchor, { permalink: anchor.permalink.ariaHidden({}) });
  if (options.toc) {
    md.use(toc, {
      includeLevel: [1, 2, 3, 4, 5, 6],
      containerHeaderHtml: '<div class="table-of-contents">TOC</div>',
    });
  }
  md.use(texmath, {
    engine: katex,
    delimiters: 'dollars',
    katexOptions: { throwOnError: false },
  });

  return md;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

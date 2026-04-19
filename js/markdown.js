import { marked } from 'https://cdn.jsdelivr.net/npm/marked@9.1.6/lib/marked.esm.js';

marked.setOptions({
  gfm: true,
  breaks: true,
});

export function renderMarkdown(text) {
  return marked.parse(text);
}

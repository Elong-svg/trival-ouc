import { marked } from 'https://cdn.jsdelivr.net/npm/marked@9.1.6/lib/marked.esm.js';

marked.setOptions({
  gfm: true,
  breaks: true,
});

export function renderMarkdown(text) {
  // 预处理：确保标题前有空行，以便 marked.js 正确解析
  let processedText = text;
  
  // 在 ### 前添加空行（如果前面不是空行或开头）
  processedText = processedText.replace(/([^\n])\n(#{1,6}\s)/g, '$1\n\n$2');
  
  // 确保标题前后都有空行
  processedText = processedText.replace(/\n(#{1,6}\s[^\n]+)\n/g, '\n\n$1\n\n');
  
  return marked.parse(processedText);
}

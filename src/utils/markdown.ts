const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function renderInline(text: string) {
  let html = escapeHtml(text);
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-lg" />');
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-primary underline" target="_blank" rel="noreferrer">$1</a>',
  );
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded">$1</code>');
  return html;
}

export function renderMarkdown(markdown: string): string {
  if (!markdown.trim()) return "";

  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const blocks: string[] = [];
  let listBuffer: string[] = [];
  let orderedListBuffer: string[] = [];

  const flushLists = () => {
    if (listBuffer.length) {
      blocks.push(`<ul class="list-disc pl-6 space-y-1">${listBuffer.join("")}</ul>`);
      listBuffer = [];
    }
    if (orderedListBuffer.length) {
      blocks.push(`<ol class="list-decimal pl-6 space-y-1">${orderedListBuffer.join("")}</ol>`);
      orderedListBuffer = [];
    }
  };

  for (const line of lines) {
    if (/^\s*-\s+/.test(line)) {
      orderedListBuffer = [];
      listBuffer.push(`<li>${renderInline(line.replace(/^\s*-\s+/, ""))}</li>`);
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      listBuffer = [];
      orderedListBuffer.push(`<li>${renderInline(line.replace(/^\s*\d+\.\s+/, ""))}</li>`);
      continue;
    }

    flushLists();

    if (/^#{1,6}\s+/.test(line)) {
      const level = Math.min(6, line.match(/^#+/)?.[0].length || 1);
      const content = renderInline(line.replace(/^#{1,6}\s+/, ""));
      blocks.push(`<h${level} class="font-semibold text-foreground mt-4">${content}</h${level}>`);
      continue;
    }

    if (/^>\s+/.test(line)) {
      const content = renderInline(line.replace(/^>\s+/, ""));
      blocks.push(`<blockquote class="border-l-4 border-primary/50 pl-3 italic text-muted-foreground">${content}</blockquote>`);
      continue;
    }

    if (line.trim() === "") {
      blocks.push("<div class=\"h-3\"></div>");
      continue;
    }

    blocks.push(`<p class="leading-relaxed">${renderInline(line)}</p>`);
  }

  flushLists();

  return blocks.join("\n");
}

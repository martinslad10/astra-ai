import React from "react";

type Props = { content: string };

function inline(text: string, key: string): React.ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|~~[^~]+~~|`[^`]+`|\*[^*]+\*|\[[^\]]+\]\(https?:\/\/[^)]+\)|https?:\/\/[^\s<]+)/g;
  return text.split(pattern).filter(Boolean).map((part, index) => {
    const id = key + "-" + index;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={id}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("~~") && part.endsWith("~~")) return <del key={id}>{part.slice(2, -2)}</del>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={id}>{part.slice(1, -1)}</code>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={id}>{part.slice(1, -1)}</em>;
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (link) return <a key={id} href={link[2]} target="_blank" rel="noopener noreferrer">{link[1]}</a>;
    if (/^https?:\/\//i.test(part)) { const url = part.replace(/[),.;!?]+$/, ""); const suffix = part.slice(url.length); return <React.Fragment key={id}><a href={url} target="_blank" rel="noopener noreferrer">{url}</a>{suffix}</React.Fragment>; }
    return part;
  });
}

function cells(line: string): string[] {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(value => value.trim());
}

export default function MarkdownMessage({ content }: Props) {
  const lines = content.replace(/\r/g, "").split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (/^\s*```/.test(line)) {
      const language = line.trim().slice(3).trim();
      i++;
      const code: string[] = [];
      while (i < lines.length && !/^\s*```/.test(lines[i])) code.push(lines[i++]);
      if (i < lines.length) i++;
      blocks.push(<pre key={"code-" + i} data-language={language}><code>{code.join("\n")}</code></pre>);
      continue;
    }
    const heading = line.match(/^\s*(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const children = inline(heading[2], "h" + i);
      blocks.push(React.createElement("h" + level, { key: "h-" + i }, children));
      i++; continue;
    }
    if (/^\s*(---+|___+|\*\s*\*\s*\*)\s*$/.test(line)) {
      blocks.push(<hr key={"hr-" + i}/>); i++; continue;
    }
    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) {
      const headers = cells(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) rows.push(cells(lines[i++]));
      blocks.push(<div className="markdown-table-wrap" key={"table-" + i}><table><thead><tr>{headers.map((cell, n) => <th key={n}>{inline(cell, "th-" + i + "-" + n)}</th>)}</tr></thead><tbody>{rows.map((row, r) => <tr key={r}>{headers.map((_, c) => <td key={c}>{inline(row[c] || "", "td-" + i + "-" + r + "-" + c)}</td>)}</tr>)}</tbody></table></div>);
      continue;
    }
    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*+]\s+/, ""));
      blocks.push(<ul key={"ul-" + i}>{items.map((item, n) => <li key={n}>{inline(item, "li-" + i + "-" + n)}</li>)}</ul>);
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+[.)]\s+/, ""));
      blocks.push(<ol key={"ol-" + i}>{items.map((item, n) => <li key={n}>{inline(item, "oli-" + i + "-" + n)}</li>)}</ol>);
      continue;
    }
    if (/^\s*>\s?/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) quote.push(lines[i++].replace(/^\s*>\s?/, ""));
      blocks.push(<blockquote key={"quote-" + i}>{quote.map((part, n) => <p key={n}>{inline(part, "q-" + i + "-" + n)}</p>)}</blockquote>);
      continue;
    }
    const paragraph: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^\s*(#{1,6}\s|[-*+]\s+|\d+[.)]\s+|>|\`\`\`|---+$)/.test(lines[i])) {
      if (lines[i].includes("|") && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) break;
      paragraph.push(lines[i++]);
    }
    blocks.push(<p key={"p-" + i}>{paragraph.map((part, n) => <React.Fragment key={n}>{n > 0 && <br/>}{inline(part, "p-" + i + "-" + n)}</React.Fragment>)}</p>);
  }
  return <div className="markdown-message">{blocks}</div>;
}

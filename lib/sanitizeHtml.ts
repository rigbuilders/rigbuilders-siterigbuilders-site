// lib/sanitizeHtml.ts
// Minimal, dependency-free HTML sanitizer for admin-authored blog content.
//
// Blog posts are intentionally rich HTML (headings, bold, links, images), so we
// keep markup but strip the vectors that turn stored HTML into stored XSS:
//   - <script>/<style>/<iframe>/<object> and other executable elements
//   - inline event handlers (onclick, onerror, ...)
//   - javascript:/data: URLs in href/src
//
// This is a safety net. The primary control is that only authenticated admins can
// create/edit posts. For untrusted input, use a full library (DOMPurify + jsdom).

const FORBIDDEN_TAGS = [
  "script", "style", "iframe", "object", "embed", "link", "meta",
  "form", "input", "button", "textarea", "svg", "math", "base",
];

export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== "string") return "";

  let out = input;

  // Remove forbidden elements entirely (opening tag through closing tag).
  for (const tag of FORBIDDEN_TAGS) {
    const paired = new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, "gi");
    const selfClosing = new RegExp(`<${tag}\\b[^>]*\\/?>`, "gi");
    out = out.replace(paired, "").replace(selfClosing, "");
  }

  // Strip inline event handlers: on*="..."  on*='...'  on*=value
  out = out.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "");
  out = out.replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "");
  out = out.replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "");

  // Neutralize dangerous URL schemes in href/src.
  out = out.replace(
    /\s(href|src)\s*=\s*("|')?\s*(javascript|data|vbscript):[^"'>\s]*("|')?/gi,
    ' $1="#"'
  );

  return out;
}

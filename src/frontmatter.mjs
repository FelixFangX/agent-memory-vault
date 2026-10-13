// Minimal YAML-frontmatter reader: flat `key: value` pairs, `# comments`, booleans.
// Returns { data, bodyStart } or null when the file has no frontmatter block.
export function parseFrontmatter(text) {
  const lines = text.split(/\r?\n/);
  if (lines[0] !== "---") return null;
  const end = lines.indexOf("---", 1);
  if (end === -1) return null;
  const data = {};
  for (const raw of lines.slice(1, end)) {
    const line = raw.replace(/\s+#.*$/, "").trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!m) continue;
    const v = m[2].replace(/^["']|["']$/g, "");
    data[m[1]] = v === "true" ? true : v === "false" ? false : v;
  }
  return { data, bodyStart: end + 1 };
}

// Keeps scripts/setup-box.sh and docs/box-environment.md listing the same tools and tiers.
const TIERS = new Set(['required', 'optional']);

export function toolsFromScript(sh) {
  const block = sh.match(/TOOLS=\(([\s\S]*?)\n\)/);
  if (!block) return [];
  return [...block[1].matchAll(/"([^|"]+)\|([^|"]+)\|[^"]*"/g)].map(([, name, tier]) => ({ name, tier }));
}

export function toolsFromDoc(md) {
  return [...md.matchAll(/^\| `([^`]+)` \| (\w+) \|/gm)]
    .filter(([, , tier]) => TIERS.has(tier))
    .map(([, name, tier]) => ({ name, tier }));
}

export function checkBoxEnvSync(sh, md) {
  const a = new Map(toolsFromScript(sh).map((t) => [t.name, t.tier]));
  const b = new Map(toolsFromDoc(md).map((t) => [t.name, t.tier]));
  const out = [];
  if (!a.size) out.push({ level: 'error', rule: 'box-env-sync', message: 'no TOOLS list in setup script' });
  for (const [n, t] of a) {
    if (!b.has(n)) out.push({ level: 'error', rule: 'box-env-sync', message: `${n} is in the setup script but not the doc` });
    else if (b.get(n) !== t) out.push({ level: 'error', rule: 'box-env-sync', message: `${n} is ${t} in the script but ${b.get(n)} in the doc` });
  }
  for (const n of b.keys()) if (!a.has(n)) out.push({ level: 'error', rule: 'box-env-sync', message: `${n} is in the doc but not the setup script` });
  return out;
}

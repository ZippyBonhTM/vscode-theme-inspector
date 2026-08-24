#!/usr/bin/env node
// @ts-check
/**
 * Regenerates packages/theme-colors/src/data/theme-colors.generated.ts from
 * the official VS Code Theme Color reference.
 *
 * Source of truth: the same Markdown source used to publish
 * https://code.visualstudio.com/api/references/theme-color, fetched from the
 * vscode-docs repository so we parse structured Markdown (`## Category`
 * headings, `- \`id\`: description` bullets) instead of scraping rendered
 * HTML.
 *
 * Run manually when VS Code ships new/renamed Theme Color IDs:
 *
 *   node scripts/generate-theme-colors.mjs
 *
 * This intentionally does not run automatically in CI or at install time:
 * the registry is a point-in-time snapshot that must be reviewed (via
 * `git diff`) before being committed, not silently regenerated on every
 * build.
 */

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const SOURCE_URL =
  'https://raw.githubusercontent.com/microsoft/vscode-docs/main/api/references/theme-color.md';

const OUTPUT_PATH = fileURLToPath(
  new URL('../packages/theme-colors/src/data/theme-colors.generated.ts', import.meta.url),
);

const HEADING_PATTERN = /^##\s+(.+)$/;
const ENTRY_PATTERN = /^-\s+`([^`]+)`:\s*(.+)$/;

/**
 * @param {string} markdown
 * @returns {{ id: string; category: string; description: string }[]}
 */
function parse(markdown) {
  /** @type {{ id: string; category: string; description: string }[]} */
  const entries = [];
  let category = '';
  let inCodeFence = false;

  for (const line of markdown.split('\n')) {
    if (line.trimStart().startsWith('```')) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;

    const heading = HEADING_PATTERN.exec(line);
    if (heading?.[1]) {
      category = heading[1].trim();
      continue;
    }

    const entry = ENTRY_PATTERN.exec(line);
    if (entry?.[1] && entry[2] && category) {
      entries.push({
        id: entry[1].trim(),
        category,
        description: entry[2].trim(),
      });
    }
  }

  return entries;
}

async function main() {
  const response = await fetch(SOURCE_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${SOURCE_URL}: ${response.status} ${response.statusText}`);
  }
  const markdown = await response.text();
  const entries = parse(markdown);

  if (entries.length === 0) {
    throw new Error(
      'Parsed zero Theme Color entries — the source Markdown structure may have changed.',
    );
  }

  const seen = new Set();
  const duplicates = entries.filter((entry) => {
    if (seen.has(entry.id)) return true;
    seen.add(entry.id);
    return false;
  });
  if (duplicates.length > 0) {
    throw new Error(`Duplicate Theme Color IDs found: ${duplicates.map((d) => d.id).join(', ')}`);
  }

  const header = `/**
 * GENERATED FILE — do not edit by hand.
 *
 * Produced by \`node scripts/generate-theme-colors.mjs\` from:
 * ${SOURCE_URL}
 *
 * Regenerate when VS Code ships new or renamed Theme Color IDs, and review
 * the diff before committing.
 */

import type { ThemeColorDefinition } from '../types';

export const GENERATED_AT = '${new Date().toISOString()}';

export const THEME_COLORS: readonly ThemeColorDefinition[] = ${JSON.stringify(entries, null, 2)};
`;

  await writeFile(OUTPUT_PATH, header, 'utf8');
  console.log(`Wrote ${entries.length} Theme Color definitions to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

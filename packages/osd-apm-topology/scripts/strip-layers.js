/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Post-processes Tailwind v4 CSS output to remove @layer wrappers.
 *
 * Tailwind v4 wraps generated CSS in @layer directives (theme, base, utilities, etc.).
 * When loaded alongside OSD's unlayered styles, CSS cascade layers cause layered rules
 * to always lose to unlayered rules — making all Tailwind utilities ineffective.
 *
 * This script:
 * 1. Removes @layer base { ... } entirely (Tailwind preflight/reset conflicts with OSD styles)
 * 2. Unwraps @layer theme { ... } and @layer utilities { ... } (keeps content, removes wrapper)
 * 3. Removes @layer components; (empty layer declaration)
 * 4. Keeps @layer properties { ... } as-is (CSS @property declarations work fine in layers)
 */

const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../src/_celestial.generated.scss');
let css = fs.readFileSync(filePath, 'utf8');

// Since the CSS is minified, we need to handle nested braces carefully.
// Strategy: find @layer <name>{ and match to closing brace accounting for nesting.

function findLayerBlock(css, layerName) {
  const pattern = `@layer ${layerName}{`;
  const startIdx = css.indexOf(pattern);
  if (startIdx === -1) return null;

  const contentStart = startIdx + pattern.length;
  let depth = 1;
  let i = contentStart;
  while (i < css.length && depth > 0) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') depth--;
    i++;
  }
  // i now points to the character after the closing brace
  return {
    fullStart: startIdx,
    fullEnd: i,
    contentStart,
    contentEnd: i - 1, // the closing brace position
    content: css.substring(contentStart, i - 1),
  };
}

// Also handle the @layer properties{@supports ... pattern
function findLayerBlockAny(css, layerName) {
  // Try with space: @layer name{
  let result = findLayerBlock(css, layerName);
  if (!result) {
    // Try alternate patterns
    const patterns = [`@layer ${layerName} {`, `@layer ${layerName}\n{`];
    for (const p of patterns) {
      const idx = css.indexOf(p);
      if (idx !== -1) {
        // Reconstruct with the found pattern
        const contentStart = idx + p.length;
        let depth = 1;
        let i = contentStart;
        while (i < css.length && depth > 0) {
          if (css[i] === '{') depth++;
          else if (css[i] === '}') depth--;
          i++;
        }
        result = {
          fullStart: idx,
          fullEnd: i,
          contentStart,
          contentEnd: i - 1,
          content: css.substring(contentStart, i - 1),
        };
        break;
      }
    }
  }
  return result;
}

// Process from end to start to avoid index shifting issues
const layers = ['utilities', 'components', 'base', 'theme', 'properties'];
const operations = [];

for (const layer of layers) {
  const block = findLayerBlockAny(css, layer);
  if (!block) continue;

  if (layer === 'base') {
    // Remove entirely — Tailwind preflight conflicts with OSD
    operations.push({ start: block.fullStart, end: block.fullEnd, replacement: '' });
  } else if (layer === 'components') {
    // Remove empty layer declaration (@layer components; or @layer components{})
    operations.push({ start: block.fullStart, end: block.fullEnd, replacement: '' });
  } else if (layer === 'theme' || layer === 'utilities') {
    // Unwrap — keep content, remove @layer wrapper
    operations.push({ start: block.fullStart, end: block.fullEnd, replacement: block.content });
  }
  // 'properties' — leave as-is (or unwrap if needed)
}

// Sort by start position descending to apply replacements from end
operations.sort((a, b) => b.start - a.start);
for (const op of operations) {
  css = css.substring(0, op.start) + op.replacement + css.substring(op.end);
}

// Remove the initial @layer declaration if present: @layer theme, base, components, utilities;
css = css.replace(/@layer\s+theme\s*,\s*base\s*,\s*components\s*,\s*utilities\s*;/g, '');
// Remove standalone @layer components; (empty declaration without braces)
css = css.replace(/@layer\s+components\s*;/g, '');

fs.writeFileSync(filePath, css, 'utf8');

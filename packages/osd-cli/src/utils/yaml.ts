/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Minimal YAML serializer for outputting dashboard definitions.
 * Handles objects, arrays, strings, numbers, booleans, and null.
 * For reading YAML, JSON is used primarily; full YAML parsing is a future enhancement.
 */

function indent(level: number): string {
  return '  '.repeat(level);
}

function needsQuoting(value: string): boolean {
  if (value === '') return true;
  if (value === 'true' || value === 'false' || value === 'null') return true;
  if (/^\d+(\.\d+)?$/.test(value)) return true;
  if (/[:{}\[\],&*?|>!%#@`"']/.test(value)) return true;
  if (value.startsWith(' ') || value.endsWith(' ')) return true;
  if (value.includes('\n')) return true;
  return false;
}

function serializeValue(value: unknown, level: number): string {
  if (value === null || value === undefined) {
    return 'null';
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'string') {
    if (value.includes('\n')) {
      const lines = value.split('\n');
      const indented = lines.map((line) => `${indent(level)}${line}`).join('\n');
      return `|\n${indented}`;
    }
    return needsQuoting(value) ? JSON.stringify(value) : value;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }
    const items = value.map((item) => {
      const serialized = serializeValue(item, level + 1);
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        const entries = Object.entries(item);
        if (entries.length === 0) {
          return `${indent(level)}- {}`;
        }
        const [firstKey, firstVal] = entries[0];
        const firstLine = `${indent(level)}- ${firstKey}: ${serializeValue(firstVal, level + 2)}`;
        const rest = entries.slice(1).map(([k, v]) => {
          return `${indent(level)}  ${k}: ${serializeValue(v, level + 2)}`;
        });
        return [firstLine, ...rest].join('\n');
      }
      return `${indent(level)}- ${serialized}`;
    });
    return '\n' + items.join('\n');
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      return '{}';
    }
    const lines = entries.map(([key, val]) => {
      const serializedVal = serializeValue(val, level + 1);
      if (
        typeof val === 'object' &&
        val !== null &&
        ((Array.isArray(val) && val.length > 0) ||
          (!Array.isArray(val) && Object.keys(val).length > 0))
      ) {
        return `${indent(level)}${key}:${serializedVal}`;
      }
      return `${indent(level)}${key}: ${serializedVal}`;
    });
    return '\n' + lines.join('\n');
  }

  return String(value);
}

/**
 * Serialize a JavaScript value to YAML string.
 */
export function toYaml(value: unknown): string {
  if (typeof value !== 'object' || value === null) {
    return serializeValue(value, 0) + '\n';
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]\n';
    const items = value.map((item) => {
      const serialized = serializeValue(item, 1);
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        const entries = Object.entries(item);
        if (entries.length === 0) return '- {}';
        const [firstKey, firstVal] = entries[0];
        const firstLine = `- ${firstKey}: ${serializeValue(firstVal, 2)}`;
        const rest = entries.slice(1).map(([k, v]) => {
          return `  ${k}: ${serializeValue(v, 2)}`;
        });
        return [firstLine, ...rest].join('\n');
      }
      return `- ${serialized}`;
    });
    return items.join('\n') + '\n';
  }

  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return '{}\n';

  const lines = entries.map(([key, val]) => {
    const serializedVal = serializeValue(val, 1);
    if (
      typeof val === 'object' &&
      val !== null &&
      ((Array.isArray(val) && val.length > 0) ||
        (!Array.isArray(val) && Object.keys(val).length > 0))
    ) {
      return `${key}:${serializedVal}`;
    }
    return `${key}: ${serializedVal}`;
  });

  return lines.join('\n') + '\n';
}

/**
 * Parse a simple YAML string. For now, delegates to JSON parsing if the input
 * is JSON. Full YAML parsing is a future enhancement.
 */
export function fromYaml(input: string): unknown {
  const trimmed = input.trim();
  // Attempt JSON parse first
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // fall through
    }
  }
  // Minimal YAML key-value parser for simple flat objects
  return parseSimpleYaml(trimmed);
}

function parseSimpleYaml(input: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = input.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine === '' || trimmedLine.startsWith('#')) continue;

    const colonIndex = trimmedLine.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmedLine.substring(0, colonIndex).trim();
    let value: string | number | boolean | null = trimmedLine.substring(colonIndex + 1).trim();

    // strip inline comments
    const commentIdx = value.indexOf(' #');
    if (commentIdx !== -1) {
      value = value.substring(0, commentIdx).trim();
    }

    // type coercion
    if (value === 'true') {
      result[key] = true;
    } else if (value === 'false') {
      result[key] = false;
    } else if (value === 'null' || value === '~' || value === '') {
      result[key] = null;
    } else if (/^-?\d+$/.test(value)) {
      result[key] = parseInt(value, 10);
    } else if (/^-?\d+\.\d+$/.test(value)) {
      result[key] = parseFloat(value);
    } else if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      result[key] = value.slice(1, -1);
    } else {
      result[key] = value;
    }
  }

  return result;
}

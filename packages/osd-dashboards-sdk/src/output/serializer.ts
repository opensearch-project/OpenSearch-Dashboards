/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { DashboardDefinition } from '../types';

/**
 * Serializer for dashboard definitions to JSON and YAML formats.
 */
export class Serializer {
  /**
   * Serialize a dashboard definition to deterministic JSON with sorted keys.
   * Optionally writes to a file.
   */
  static toJSON(definition: DashboardDefinition, filepath?: string): string {
    const json = JSON.stringify(definition, Serializer.sortedReplacer(), 2);

    if (filepath) {
      const absolutePath = path.resolve(filepath);
      const dir = path.dirname(absolutePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(absolutePath, json, 'utf-8');
    }

    return json;
  }

  /**
   * Serialize a dashboard definition to YAML.
   * Optionally writes to a file.
   */
  static toYAML(definition: DashboardDefinition, filepath?: string): string {
    const yaml = Serializer.objectToYAML(definition, 0);

    if (filepath) {
      const absolutePath = path.resolve(filepath);
      const dir = path.dirname(absolutePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(absolutePath, yaml, 'utf-8');
    }

    return yaml;
  }

  /**
   * A JSON.stringify replacer that sorts object keys for deterministic output.
   */
  private static sortedReplacer(): (key: string, value: unknown) => unknown {
    return (_key: string, value: unknown): unknown => {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        const sorted: Record<string, unknown> = {};
        const keys = Object.keys(value as Record<string, unknown>).sort();
        for (const k of keys) {
          sorted[k] = (value as Record<string, unknown>)[k];
        }
        return sorted;
      }
      return value;
    };
  }

  /**
   * Simple YAML serializer that handles objects, arrays, strings, numbers, and booleans.
   */
  private static objectToYAML(obj: unknown, indent: number): string {
    const prefix = '  '.repeat(indent);

    if (obj === null || obj === undefined) {
      return 'null\n';
    }

    if (typeof obj === 'string') {
      // Escape strings that contain special YAML characters
      if (
        obj.includes(':') ||
        obj.includes('#') ||
        obj.includes('\n') ||
        obj.includes('"') ||
        obj.includes("'") ||
        obj.startsWith(' ') ||
        obj.endsWith(' ') ||
        obj === '' ||
        obj === 'true' ||
        obj === 'false' ||
        obj === 'null' ||
        /^\d+$/.test(obj)
      ) {
        const escaped = obj.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        return `"${escaped}"\n`;
      }
      return `${obj}\n`;
    }

    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return `${obj}\n`;
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0) {
        return '[]\n';
      }

      let result = '\n';
      for (const item of obj) {
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          const entries = Object.keys(item).sort();
          if (entries.length === 0) {
            result += `${prefix}- {}\n`;
          } else {
            const firstKey = entries[0];
            const firstValue = Serializer.objectToYAML(
              (item as Record<string, unknown>)[firstKey],
              indent + 2
            ).trimEnd();
            result += `${prefix}- ${firstKey}: ${firstValue}\n`;
            for (let i = 1; i < entries.length; i++) {
              const key = entries[i];
              const value = Serializer.objectToYAML(
                (item as Record<string, unknown>)[key],
                indent + 2
              );
              result += `${prefix}  ${key}: ${value}`;
            }
          }
        } else {
          const value = Serializer.objectToYAML(item, indent + 1).trimEnd();
          result += `${prefix}- ${value}\n`;
        }
      }
      return result;
    }

    if (typeof obj === 'object') {
      const entries = Object.keys(obj as Record<string, unknown>).sort();
      if (entries.length === 0) {
        return '{}\n';
      }

      let result = '\n';
      for (const key of entries) {
        const value = (obj as Record<string, unknown>)[key];
        if (value === undefined) {
          continue;
        }
        if (
          typeof value === 'object' &&
          value !== null &&
          ((Array.isArray(value) && value.length > 0) ||
            (!Array.isArray(value) && Object.keys(value).length > 0))
        ) {
          const nested = Serializer.objectToYAML(value, indent + 1);
          result += `${prefix}${key}:${nested}`;
        } else {
          const scalar = Serializer.objectToYAML(value, indent + 1).trimEnd();
          result += `${prefix}${key}: ${scalar}\n`;
        }
      }
      return result;
    }

    return `${obj}\n`;
  }
}

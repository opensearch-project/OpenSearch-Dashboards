/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
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
      const cwd = process.cwd();
      if (!absolutePath.startsWith(cwd)) {
        throw new Error(`Output path must be within the current working directory. Got: ${absolutePath}`);
      }
      const dir = path.dirname(absolutePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(absolutePath, json, 'utf-8');
    }

    return json;
  }

  /**
   * Serialize a dashboard definition to YAML using js-yaml for correct
   * handling of nested structures, special characters, and edge cases.
   * Optionally writes to a file.
   */
  static toYAML(definition: DashboardDefinition, filepath?: string): string {
    const output = yaml.dump(definition, { sortKeys: true, lineWidth: -1 });

    if (filepath) {
      const absolutePath = path.resolve(filepath);
      const cwd = process.cwd();
      if (!absolutePath.startsWith(cwd)) {
        throw new Error(`Output path must be within the current working directory. Got: ${absolutePath}`);
      }
      const dir = path.dirname(absolutePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(absolutePath, output, 'utf-8');
    }

    return output;
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
}

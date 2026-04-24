/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { resolve } from 'path';
import { readFileSync } from 'fs';

/**
 * Descriptor for a single JSON Schema definition loaded by the registry.
 */
export interface SavedObjectSchemaDefinition {
  /** The saved object type (e.g. 'dashboard', 'visualization'). */
  type: string;
  /** Schema version string (e.g. 'v1'). */
  version: string;
  /** The parsed JSON Schema object. */
  schema: Record<string, unknown>;
}

/**
 * Public interface for the saved object schema registry.
 */
export interface ISavedObjectSchemaRegistry {
  /** Get a schema by type and version. Returns undefined if not found. */
  getSchema(type: string, version: string): Record<string, unknown> | undefined;
  /** Get all registered schema definitions. */
  getAllSchemas(): SavedObjectSchemaDefinition[];
  /** Get the list of supported saved object types. */
  getTypes(): string[];
  /** Get all available versions for a given type. */
  getVersions(type: string): string[];
}

/** Metadata mapping type to its schema file and version. */
interface SchemaFileEntry {
  type: string;
  version: string;
  filename: string;
}

const SCHEMA_FILES: SchemaFileEntry[] = [
  { type: 'dashboard', version: 'v1', filename: 'dashboard.v1.schema.json' },
  { type: 'visualization', version: 'v1', filename: 'visualization.v1.schema.json' },
  { type: 'index-pattern', version: 'v1', filename: 'index-pattern.v1.schema.json' },
  { type: 'search', version: 'v1', filename: 'search.v1.schema.json' },
];

const COMMON_SCHEMA_FILE = 'common.schema.json';

/**
 * Loads all saved object JSON schemas from disk and returns them as an array
 * of {@link SavedObjectSchemaDefinition} objects, along with the shared
 * common definitions schema.
 */
export function loadSavedObjectSchemas(): {
  schemas: SavedObjectSchemaDefinition[];
  commonSchema: Record<string, unknown>;
} {
  const schemasDir = resolve(__dirname);

  const commonSchema = JSON.parse(
    readFileSync(resolve(schemasDir, COMMON_SCHEMA_FILE), 'utf-8')
  ) as Record<string, unknown>;

  const schemas: SavedObjectSchemaDefinition[] = SCHEMA_FILES.map((entry) => {
    const filePath = resolve(schemasDir, entry.filename);
    const schema = JSON.parse(readFileSync(filePath, 'utf-8')) as Record<string, unknown>;
    return {
      type: entry.type,
      version: entry.version,
      schema,
    };
  });

  return { schemas, commonSchema };
}

export { SavedObjectSchemaRegistry } from './schema_registry';

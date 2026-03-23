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
import {
  ISavedObjectSchemaRegistry,
  SavedObjectSchemaDefinition,
  loadSavedObjectSchemas,
} from './index';

/**
 * A single validation error with a human-readable message and the JSON path
 * to the field that caused the error.
 */
export interface SchemaValidationError {
  /** The JSON pointer path to the invalid field (e.g. '/panelsJSON'). */
  path: string;
  /** Human-readable error message. */
  message: string;
}

/**
 * Result object returned by {@link SavedObjectSchemaRegistry.validate}.
 */
export interface SchemaValidationResult {
  /** Whether the object passed validation. */
  valid: boolean;
  /** Array of validation errors. Empty when valid is true. */
  errors: SchemaValidationError[];
}

/**
 * Resolve a $ref string against the loaded schema map.
 * Supports references like "common.schema.json#/$defs/gridData" and local "#/$defs/panel".
 */
function resolveRef(
  ref: string,
  currentSchema: Record<string, unknown>,
  schemaMap: Map<string, Record<string, unknown>>
): Record<string, unknown> | undefined {
  const [file, pointer] = ref.split('#');
  const baseSchema = file ? schemaMap.get(file) : currentSchema;
  if (!baseSchema || !pointer) return baseSchema as Record<string, unknown> | undefined;

  const parts = pointer.split('/').filter(Boolean);
  let node: unknown = baseSchema;
  for (const part of parts) {
    if (node === null || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return node as Record<string, unknown> | undefined;
}

/**
 * Lightweight JSON Schema validator supporting the subset of JSON Schema
 * features used by the saved object schemas. This avoids adding Ajv as an
 * external dependency.
 *
 * Supported keywords: type, required, properties, additionalProperties,
 * items, enum, minimum, maximum, minItems, maxItems, oneOf, $ref, $defs.
 */
function validateNode(
  value: unknown,
  schema: Record<string, unknown>,
  path: string,
  rootSchema: Record<string, unknown>,
  schemaMap: Map<string, Record<string, unknown>>,
  errors: SchemaValidationError[]
): void {
  // Resolve $ref
  if (schema.$ref) {
    const resolved = resolveRef(schema.$ref as string, rootSchema, schemaMap);
    if (!resolved) {
      errors.push({ path, message: `Unable to resolve $ref: ${schema.$ref}` });
      return;
    }
    validateNode(value, resolved, path, rootSchema, schemaMap, errors);
    return;
  }

  // oneOf
  if (schema.oneOf) {
    const variants = schema.oneOf as Record<string, unknown>[];
    const matchCount = variants.filter((variant) => {
      const subErrors: SchemaValidationError[] = [];
      validateNode(value, variant, path, rootSchema, schemaMap, subErrors);
      return subErrors.length === 0;
    }).length;
    if (matchCount !== 1) {
      errors.push({ path, message: `must match exactly one schema in oneOf` });
    }
    return;
  }

  // Type check
  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type)
      ? (schema.type as string[])
      : [schema.type as string];
    if (!matchesType(value, types)) {
      errors.push({ path, message: `must be ${types.join(' or ')}` });
      return; // skip deeper checks on type mismatch
    }
  }

  // Enum
  if (schema.enum) {
    const allowed = schema.enum as unknown[];
    if (!allowed.includes(value)) {
      errors.push({
        path,
        message: `must be one of: ${allowed.map((v) => JSON.stringify(v)).join(', ')}`,
      });
    }
  }

  // Numeric constraints
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < (schema.minimum as number)) {
      errors.push({ path, message: `must be >= ${schema.minimum}` });
    }
    if (schema.maximum !== undefined && value > (schema.maximum as number)) {
      errors.push({ path, message: `must be <= ${schema.maximum}` });
    }
  }

  // Array validation
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < (schema.minItems as number)) {
      errors.push({ path, message: `must have at least ${schema.minItems} items` });
    }
    if (schema.maxItems !== undefined && value.length > (schema.maxItems as number)) {
      errors.push({ path, message: `must have at most ${schema.maxItems} items` });
    }
    if (schema.items) {
      const itemSchema = schema.items as Record<string, unknown>;
      for (let i = 0; i < value.length; i++) {
        validateNode(value[i], itemSchema, `${path}/${i}`, rootSchema, schemaMap, errors);
      }
    }
  }

  // Object validation
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    const properties = (schema.properties as Record<string, Record<string, unknown>>) || {};
    const additionalProperties = schema.additionalProperties;

    // Required
    if (schema.required) {
      for (const key of schema.required as string[]) {
        if (!(key in obj)) {
          errors.push({ path: `${path}/${key}`, message: `is required` });
        }
      }
    }

    // Validate known properties
    for (const [key, propSchema] of Object.entries(properties)) {
      if (key in obj) {
        validateNode(obj[key], propSchema, `${path}/${key}`, rootSchema, schemaMap, errors);
      }
    }

    // Additional properties
    if (additionalProperties === false) {
      for (const key of Object.keys(obj)) {
        if (!(key in properties)) {
          errors.push({ path: `${path}/${key}`, message: `is not allowed` });
        }
      }
    } else if (
      additionalProperties !== undefined &&
      additionalProperties !== true &&
      typeof additionalProperties === 'object'
    ) {
      const addPropSchema = additionalProperties as Record<string, unknown>;
      for (const key of Object.keys(obj)) {
        if (!(key in properties)) {
          validateNode(
            obj[key],
            addPropSchema,
            `${path}/${key}`,
            rootSchema,
            schemaMap,
            errors
          );
        }
      }
    }
  }
}

/**
 * Check whether a value matches one of the given JSON Schema type strings.
 */
function matchesType(value: unknown, types: string[]): boolean {
  for (const t of types) {
    switch (t) {
      case 'string':
        if (typeof value === 'string') return true;
        break;
      case 'number':
        if (typeof value === 'number') return true;
        break;
      case 'integer':
        if (typeof value === 'number' && Number.isInteger(value)) return true;
        break;
      case 'boolean':
        if (typeof value === 'boolean') return true;
        break;
      case 'array':
        if (Array.isArray(value)) return true;
        break;
      case 'object':
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) return true;
        break;
      case 'null':
        if (value === null) return true;
        break;
    }
  }
  return false;
}

/**
 * Runtime registry that loads saved object JSON schemas and validates objects
 * against them. Uses a lightweight built-in JSON Schema validator to avoid
 * adding external dependencies.
 */
export class SavedObjectSchemaRegistry implements ISavedObjectSchemaRegistry {
  private readonly definitions: SavedObjectSchemaDefinition[];
  private readonly schemaKeyMap: Map<string, Record<string, unknown>>;
  private readonly fileSchemaMap: Map<string, Record<string, unknown>>;

  constructor() {
    this.definitions = [];
    this.schemaKeyMap = new Map();
    this.fileSchemaMap = new Map();
    this.loadSchemas();
  }

  /**
   * Load all schemas from disk.
   */
  private loadSchemas(): void {
    const schemasDir = resolve(__dirname);

    // Load the common definitions schema for $ref resolution.
    const commonSchemaPath = resolve(schemasDir, 'common.schema.json');
    const commonSchema = JSON.parse(readFileSync(commonSchemaPath, 'utf-8'));
    this.fileSchemaMap.set('common.schema.json', commonSchema);

    const { schemas } = loadSavedObjectSchemas();
    for (const def of schemas) {
      const key = `${def.type}/${def.version}`;
      this.schemaKeyMap.set(key, def.schema);
      this.definitions.push(def);
    }
  }

  /** @inheritdoc */
  getSchema(type: string, version: string): Record<string, unknown> | undefined {
    return this.schemaKeyMap.get(`${type}/${version}`);
  }

  /** @inheritdoc */
  getAllSchemas(): SavedObjectSchemaDefinition[] {
    return [...this.definitions];
  }

  /** @inheritdoc */
  getTypes(): string[] {
    const types = new Set(this.definitions.map((d) => d.type));
    return [...types];
  }

  /** @inheritdoc */
  getVersions(type: string): string[] {
    return this.definitions.filter((d) => d.type === type).map((d) => d.version);
  }

  /**
   * Validate a saved object's attributes against the schema for the given
   * type and version.
   *
   * @param type - Saved object type (e.g. 'dashboard').
   * @param version - Schema version (e.g. 'v1').
   * @param attributes - The attributes object to validate.
   * @returns A {@link SchemaValidationResult} with validity flag and errors.
   */
  validate(
    type: string,
    version: string,
    attributes: Record<string, unknown>
  ): SchemaValidationResult {
    const key = `${type}/${version}`;
    const schema = this.schemaKeyMap.get(key);

    if (!schema) {
      return {
        valid: false,
        errors: [
          {
            path: '',
            message: `Unknown saved object schema: type="${type}", version="${version}"`,
          },
        ],
      };
    }

    const errors: SchemaValidationError[] = [];
    validateNode(attributes, schema, '', schema, this.fileSchemaMap, errors);

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

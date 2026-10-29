/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MappingProperty, MappingTypeMapping } from '@opensearch-project/opensearch/api/types';
import { OpenSearchClient } from '../../../../core/server';

/**
 * Fetch the mapping of an existing target index (the same call the preview route makes). When
 * `indexName` is an alias the response is keyed by the concrete index; a single backing index is
 * used, otherwise undefined is returned (no coercion). Throws if the request fails.
 */
export const fetchIndexMapping = async (
  client: OpenSearchClient,
  indexName: string
): Promise<MappingTypeMapping | undefined> => {
  const body = (await client.indices.getMapping({ index: indexName })).body as
    Record<string, { mappings?: MappingTypeMapping }> | undefined;
  if (!body) {
    return undefined;
  }
  if (body[indexName]) {
    return body[indexName].mappings;
  }
  const entries = Object.values(body);
  return entries.length === 1 ? entries[0].mappings : undefined;
};

/**
 * Field types that accept any scalar once it is rendered as a string
 */
const STRING_FIELD_TYPES = new Set([
  'text',
  'keyword',
  'match_only_text',
  'wildcard',
  'constant_keyword',
]);

/**
 * Collect the dotted paths of every field the mapping declares as a string type. Undeclared fields
 * are deliberately absent: their type is decided by OpenSearch (dynamic mapping), not the importer.
 */
export const getStringFieldPaths = (mapping: MappingTypeMapping | undefined): Set<string> => {
  const paths = new Set<string>();
  const walk = (properties: Record<string, MappingProperty> | undefined, prefix: string) => {
    if (!properties) {
      return;
    }
    Object.entries(properties).forEach(([name, property]) => {
      const path = prefix ? `${prefix}.${name}` : name;
      const type = (property as { type?: string }).type;
      if (type && STRING_FIELD_TYPES.has(type)) {
        paths.add(path);
      }
      walk((property as { properties?: Record<string, MappingProperty> }).properties, path);
    });
  };
  walk(mapping?.properties as Record<string, MappingProperty> | undefined, '');
  return paths;
};

const toStringIfScalar = (value: unknown): unknown =>
  typeof value === 'number' || typeof value === 'boolean' ? String(value) : value;

/**
 * Return a copy of `document` where number/boolean values (and arrays of them) at string-typed
 * paths are converted to strings, so that `_source` agrees with the mapped type. Everything else,
 * including numeric target fields and undeclared fields, passes through unchanged.
 */
export const coerceToStringFields = (
  document: Record<string, unknown>,
  stringFields: Set<string>,
  prefix = ''
): Record<string, unknown> => {
  if (stringFields.size === 0) {
    return document;
  }

  const result: Record<string, unknown> = {};
  Object.entries(document).forEach(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (stringFields.has(path)) {
      result[key] = Array.isArray(value) ? value.map(toStringIfScalar) : toStringIfScalar(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = coerceToStringFields(value as Record<string, unknown>, stringFields, path);
    } else {
      result[key] = value;
    }
  });
  return result;
};

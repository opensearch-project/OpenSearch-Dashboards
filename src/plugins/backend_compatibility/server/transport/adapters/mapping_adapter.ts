/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BackendInfo, DEFAULT_DOCUMENT_TYPE } from '../types';
import { isPlainObject, extractQueryString } from './normalization_utils';

interface FieldDefinition {
  type?: string;
  properties?: Record<string, FieldDefinition>;
  enabled?: boolean;
  dynamic?: boolean | 'true' | 'false' | 'strict';
  value?: any;
  null_value?: any;
  [key: string]: any;
}

type FieldTypeDowngrader = (def: FieldDefinition) => FieldDefinition;

/**
 * Field types not supported in ES 6.x and their downgrade strategies.
 *
 * | Type               | Introduced | Downgrade Strategy                    |
 * |--------------------|------------|---------------------------------------|
 * | flattened          | ES 7.3     | object with enabled:false             |
 * | search_as_you_type | ES 7.2     | text (loses edge ngram functionality) |
 * | constant_keyword   | ES 7.7     | keyword with null_value               |
 * | histogram          | ES 7.6     | object with enabled:false             |
 * | wildcard           | ES 7.9     | keyword (loses wildcard optimization) |
 * | version            | ES 7.10    | keyword                               |
 * | match_only_text    | ES 7.14    | text                                  |
 * | unsigned_long      | ES 7.10    | long (values > 2^63-1 will overflow)  |
 */
const FIELD_TYPE_DOWNGRADES: Record<string, FieldTypeDowngrader> = {
  flattened: (def) => ({
    type: 'object',
    enabled: false,
  }),

  search_as_you_type: (def) => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { max_shingle_size, ...rest } = def;
    return { ...rest, type: 'text' };
  },

  constant_keyword: (def) => {
    const { value, type, ...rest } = def;
    return { ...rest, type: 'keyword', ...(value !== undefined && { null_value: value }) };
  },

  histogram: (def) => ({
    type: 'object',
    enabled: false,
  }),

  wildcard: (def) => {
    const { ...rest } = def;
    return { ...rest, type: 'keyword' };
  },

  version: (def) => ({
    type: 'keyword',
  }),

  match_only_text: (def) => ({
    type: 'text',
  }),

  unsigned_long: (def) => ({
    type: 'long',
  }),
};

export const UNSUPPORTED_ES6_TYPES = Object.keys(FIELD_TYPE_DOWNGRADES);

export function downgradeFieldTypes(
  properties: Record<string, FieldDefinition>,
  path: string = ''
): { properties: Record<string, FieldDefinition>; downgrades: string[] } {
  const downgrades: string[] = [];
  const result: Record<string, FieldDefinition> = {};

  for (const [fieldName, fieldDef] of Object.entries(properties)) {
    const fieldPath = path ? `${path}.${fieldName}` : fieldName;
    let newDef = { ...fieldDef };

    if (fieldDef.type && FIELD_TYPE_DOWNGRADES[fieldDef.type]) {
      const downgrader = FIELD_TYPE_DOWNGRADES[fieldDef.type];
      newDef = downgrader(fieldDef);
      downgrades.push(
        `${fieldPath}: ${fieldDef.type} → ${newDef.type}${
          newDef.enabled === false ? ' (disabled)' : ''
        }`
      );
    }

    if (fieldDef.properties) {
      const nested = downgradeFieldTypes(fieldDef.properties, fieldPath);
      newDef.properties = nested.properties;
      downgrades.push(...nested.downgrades);
    }

    if (fieldDef.fields) {
      const multiFields: Record<string, FieldDefinition> = {};
      for (const [subName, subDef] of Object.entries(
        fieldDef.fields as Record<string, FieldDefinition>
      )) {
        const subPath = `${fieldPath}.${subName}`;
        if (subDef.type && FIELD_TYPE_DOWNGRADES[subDef.type]) {
          const downgrader = FIELD_TYPE_DOWNGRADES[subDef.type];
          multiFields[subName] = downgrader(subDef);
          downgrades.push(`${subPath}: ${subDef.type} → ${multiFields[subName].type}`);
        } else {
          multiFields[subName] = subDef;
        }
      }
      newDef.fields = multiFields;
    }

    result[fieldName] = newDef;
  }

  return { properties: result, downgrades };
}

function downgradeMappings(mappings: any): { mappings: any; downgrades: string[] } {
  if (!mappings || typeof mappings !== 'object') {
    return { mappings, downgrades: [] };
  }

  // Typeless format: { properties: { ... } }
  if ('properties' in mappings && typeof mappings.properties === 'object') {
    const result = downgradeFieldTypes(mappings.properties);
    return {
      mappings: { ...mappings, properties: result.properties },
      downgrades: result.downgrades,
    };
  }

  // Typed format: { _doc: { properties: { ... } } }
  const allDowngrades: string[] = [];
  const newMappings: any = {};

  for (const [typeName, typeMapping] of Object.entries(mappings)) {
    if (typeMapping && typeof typeMapping === 'object' && 'properties' in (typeMapping as any)) {
      const result = downgradeFieldTypes((typeMapping as any).properties);
      newMappings[typeName] = { ...typeMapping, properties: result.properties };
      allDowngrades.push(...result.downgrades);
    } else {
      newMappings[typeName] = typeMapping;
    }
  }

  return { mappings: newMappings, downgrades: allDowngrades };
}

// ── Request/Response Translators ─────────────────────────────────────────────

export function translateRequest(params: any, backend: BackendInfo): any {
  const existing = extractQueryString(params);
  const qs = { ...existing, include_type_name: true };

  // Rewrite /{index}/_mapping → /{index}/_doc/_mapping (ES 6.x requires type in path)
  let { path } = params;
  if (path && !path.includes(`/${DEFAULT_DOCUMENT_TYPE}/`)) {
    path = path.replace(/^(\/[^/]+)\/_mapping(s)?/, `$1/${DEFAULT_DOCUMENT_TYPE}/_mapping$2`);
  }

  let body = params.body;
  if (isPlainObject(body)) {
    if (body.properties || Object.values(body).some((v: any) => v?.properties)) {
      const { mappings: downgradedBody } = downgradeMappings(body);
      body = downgradedBody;
    }
  }

  return { ...params, path, querystring: qs, body };
}

export function translateIndexCreateRequest(params: any, backend: BackendInfo): any {
  const existing = extractQueryString(params);
  const qs = { ...existing, include_type_name: true };

  if (!isPlainObject(params.body) || !params.body.mappings) {
    return { ...params, querystring: qs };
  }

  let mappings = params.body.mappings;

  if ('properties' in mappings) {
    const { mappings: downgradedMappings } = downgradeMappings(mappings);
    mappings = downgradedMappings;
  }

  // Wrap in _doc type for ES 6.x
  if ('properties' in mappings) {
    const typedMappings = { [DEFAULT_DOCUMENT_TYPE]: mappings };
    return {
      ...params,
      querystring: qs,
      body: { ...params.body, mappings: typedMappings },
    };
  }

  return { ...params, querystring: qs, body: { ...params.body, mappings } };
}

export function translateResponse(response: any, backend: BackendInfo): any {
  const body = response?.body || response;
  if (!body) return response;

  for (const [indexName, indexData] of Object.entries(body)) {
    if (indexData && typeof indexData === 'object' && 'mappings' in (indexData as any)) {
      (indexData as any).mappings = unwrapTypedMappings((indexData as any).mappings);
    }
  }

  return response;
}

export function translateGetIndexResponse(response: any, backend: BackendInfo): any {
  return translateResponse(response, backend);
}

function unwrapTypedMappings(mappings: any): any {
  if (!mappings || typeof mappings !== 'object') return mappings;
  if ('properties' in mappings) return mappings;

  const keys = Object.keys(mappings);
  if (keys.length === 1) {
    const typeMapping = mappings[keys[0]];
    if (typeMapping && typeof typeMapping === 'object' && 'properties' in typeMapping) {
      return typeMapping;
    }
  }
  return mappings;
}

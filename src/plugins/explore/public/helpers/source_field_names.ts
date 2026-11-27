/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isPlainObject } from 'lodash';

// Internal metadata field injected by the data importer on lookup rows (the per-import UUID the
// filtered alias matches on). Kept in sync with the data_importer plugin's LOOKUP_FIELD by
// convention — a stable data contract — to avoid an explore -> data_importer plugin dependency.
export const LOOKUP_METADATA_FIELD = '__lookup';

function isParentContainer(value: unknown): value is Record<string, unknown> | unknown[] {
  return (
    isPlainObject(value) ||
    (Array.isArray(value) && value.some((entry) => isPlainObject(entry) || Array.isArray(entry)))
  );
}

/**
 * The fields the `_source` column shows for a flattened hit, in order: every key except the
 * dataset's meta fields, the data importer's `__lookup` field, and the parent containers that
 * flattenHit keeps alongside their flattened children.
 */
export const getSourceFieldNames = (
  flattened: Record<string, unknown>,
  metaFields: string[] = []
): string[] => {
  const hiddenFields = new Set([...metaFields, LOOKUP_METADATA_FIELD]);
  const keys = Object.keys(flattened).filter((key) => !hiddenFields.has(key));

  let parentPrefixes: Set<string> | undefined;
  return keys.filter((key) => {
    if (!isParentContainer(flattened[key])) return true;
    // Index prefixes once to avoid repeated scans, only when a container needs checking.
    if (!parentPrefixes) {
      parentPrefixes = new Set<string>();
      for (const k of keys) {
        let dotIndex = k.indexOf('.');
        while (dotIndex !== -1) {
          parentPrefixes.add(k.slice(0, dotIndex));
          dotIndex = k.indexOf('.', dotIndex + 1);
        }
      }
    }
    return !parentPrefixes.has(key);
  });
};

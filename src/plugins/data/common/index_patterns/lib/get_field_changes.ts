/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { FieldSpec, UpdateFieldsRequest } from '../types';

type FieldChanges = Pick<UpdateFieldsRequest, 'scripted' | 'counts'>;

/**
 * Compares the last saved and the current serialized field lists of an index pattern and returns
 * what a save has to send for them: scripted fields that are new or changed, scripted fields that
 * were removed, and fields whose popularity count changed. Any other difference is discovered
 * metadata, which only a field refresh writes, so it is ignored. Returns undefined when nothing
 * needs saving.
 */
export const getFieldChanges = (
  savedFields: string | undefined,
  currentFields: string | undefined
): FieldChanges | undefined => {
  const saved: FieldSpec[] = JSON.parse(savedFields || '[]');
  const current: FieldSpec[] = JSON.parse(currentFields || '[]');
  const savedByName = new Map(saved.map((field) => [field.name, field]));
  const currentScriptedNames = new Set(
    current.filter((field) => field.scripted).map((field) => field.name)
  );

  // Both lists come from the same serializer, so an unchanged field serializes identically.
  const upsert = current.filter(
    (field) =>
      field.scripted && JSON.stringify(field) !== JSON.stringify(savedByName.get(field.name))
  );
  const remove = saved
    .filter((field) => field.scripted && !currentScriptedNames.has(field.name))
    .map((field) => field.name);
  const counts: Record<string, number> = {};
  current.forEach((field) => {
    if (!field.scripted && (field.count ?? 0) !== (savedByName.get(field.name)?.count ?? 0)) {
      counts[field.name] = field.count ?? 0;
    }
  });

  const changes: FieldChanges = {};
  if (upsert.length || remove.length) {
    changes.scripted = {
      ...(upsert.length ? { upsert } : {}),
      ...(remove.length ? { remove } : {}),
    };
  }
  if (Object.keys(counts).length) {
    changes.counts = counts;
  }
  return Object.keys(changes).length ? changes : undefined;
};

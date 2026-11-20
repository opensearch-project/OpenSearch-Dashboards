/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { FieldSpec } from '../types';

/**
 * Returns one definition per field name: the one Dashboards uses. As when a saved list is loaded,
 * a later entry replaces an earlier one and each name keeps the position of its first entry.
 * Merges append scripted fields after mapped ones, so a scripted field that reuses the name of a
 * mapped field shadows it.
 */
export const getEffectiveFields = <T extends Pick<FieldSpec, 'name'>>(fields: T[]): T[] => {
  const effective: T[] = [];
  const indexByName = new Map<string, number>();
  fields.forEach((field) => {
    const index = indexByName.get(field.name);
    if (index === undefined) {
      indexByName.set(field.name, effective.length);
      effective.push(field);
    } else {
      effective[index] = field;
    }
  });
  return effective;
};

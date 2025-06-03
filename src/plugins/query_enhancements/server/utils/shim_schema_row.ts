/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IPPLEventsDataSource } from '../types';

export function shimSchemaRow(response: IPPLEventsDataSource) {
  const schemaLength = response.schema.length;

  const data = response.datarows.map((row) => {
    return row.reduce((record: any, item: any, index: number) => {
      if (index < schemaLength) {
        const cur = response.schema[index];
        const value =
          typeof item === 'object'
            ? JSON.stringify(item)
            : typeof item === 'boolean'
            ? item.toString()
            : item;
        record[cur.name] = value;
      }
      return record;
    }, {});
  });

  return { ...response, jsonData: data };
}

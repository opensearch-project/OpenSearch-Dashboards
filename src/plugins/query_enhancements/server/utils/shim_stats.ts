/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IPPLVisualizationDataSource } from '../types';

/**
 * Add vis mapping for runtime fields
 * json data structure added to response will be
 * [{
 *  agent: "mozilla",
 *  avg(bytes): 5756
 *  ...
 * }, {
 *  agent: "MSIE",
 *  avg(bytes): 5605
 *  ...
 * }, {
 *  agent: "chrome",
 *  avg(bytes): 5648
 *  ...
 * }]
 *
 * @internal
 */
export function shimStats(response: IPPLVisualizationDataSource) {
  if (!response?.metadata?.fields || !response?.data) {
    return { ...response };
  }

  const {
    data: statsDataSet,
    metadata: { fields: queriedFields },
    size,
  } = response;
  const data = new Array(size).fill(null).map((_, i) => {
    const entry: Record<string, any> = {};
    queriedFields.forEach(({ name }: { name: string }) => {
      if (statsDataSet[name] && i < statsDataSet[name].length) {
        entry[name] = statsDataSet[name][i];
      }
    });
    return entry;
  });

  return { ...response, jsonData: data };
}

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const appendDataSourceNameToVegaSpec = (spec: string, dataSourceName: string): string => {
  return '';
};

export const parseJSONSpec = (spec: string) => {
  try {
    const jsonSpec = JSON.parse(spec);

    if (jsonSpec && typeof jsonSpec === 'object') {
      return jsonSpec;
    }
  } catch (e) {
    return false;
  }

  return false;
};

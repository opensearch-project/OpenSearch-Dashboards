/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { parse, stringify } from 'hjson';

export const appendDataSourceNameToVegaSpec = (spec: string, dataSourceName: string): string => {
  let parsedSpec = parseJSONSpec(spec);
  const isJSONString = !!parsedSpec;
  if (!parsedSpec) {
    parsedSpec = parse(spec, { keepWsc: true });
  }

  const data = parsedSpec.data;

  if (data instanceof Array) {
    parsedSpec.data = data.map((urlObject) => {
      if (
        urlObject.hasOwnProperty('url') &&
        urlObject.url.hasOwnProperty('index') &&
        !urlObject.url.hasOwnProperty('data_source_name')
      ) {
        urlObject.url.data_source_name = dataSourceName;
      }
      return urlObject;
    });
  } else if (data instanceof Object) {
    if (
      data.hasOwnProperty('url') &&
      data.url.hasOwnProperty('index') &&
      !data.url.hasOwnProperty('data_source_name')
    ) {
      parsedSpec.data.url.data_source_name = dataSourceName;
    }
  } else {
    throw new Error(`"data" field should be a URL object or an array of URL objects`);
  }

  return isJSONString
    ? JSON.stringify(parsedSpec)
    : stringify(parsedSpec, {
        bracesSameLine: true,
        keepWsc: true,
      });
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

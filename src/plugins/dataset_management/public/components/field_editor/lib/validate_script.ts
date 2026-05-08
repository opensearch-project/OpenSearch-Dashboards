/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { HttpStart } from 'src/core/public';
import { ExecuteScriptParams, ExecuteScriptResult } from '../types';

export const executeScript = async ({
  name,
  script,
  indexPatternTitle,
  query,
  additionalFields = [],
  http,
  dataSourceId,
}: ExecuteScriptParams): Promise<ExecuteScriptResult> => {
  return http
    .post('/internal/index-pattern-management/preview_scripted_field', {
      body: JSON.stringify({
        index: indexPatternTitle,
        name,
        script,
        query,
        additionalFields,
      }),
      query: {
        dataSourceId,
      },
    })
    .then((res) => ({
      status: res.statusCode,
      hits: res.body.hits,
    }))
    .catch((err) => ({
      status: err.statusCode,
      error: err.body.attributes.error,
    }));
};

export const isScriptValid = async ({
  name,
  script,
  indexPatternTitle,
  http,
  dataSourceId,
}: {
  name: string;
  script: string;
  indexPatternTitle: string;
  http: HttpStart;
  dataSourceId?: string;
}) => {
  const scriptResponse = await executeScript({
    name,
    script,
    indexPatternTitle,
    http,
    dataSourceId,
  });

  if (scriptResponse.status !== 200) {
    return false;
  }

  return true;
};

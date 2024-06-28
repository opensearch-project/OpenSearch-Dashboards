/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IDataFrame } from 'src/plugins/data/common';
import { from } from 'rxjs';
import { FetchDataFrameContext } from './types';

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return (
    date.getFullYear() +
    '-' +
    ('0' + (date.getMonth() + 1)).slice(-2) +
    '-' +
    ('0' + date.getDate()).slice(-2) +
    ' ' +
    ('0' + date.getHours()).slice(-2) +
    ':' +
    ('0' + date.getMinutes()).slice(-2) +
    ':' +
    ('0' + date.getSeconds()).slice(-2)
  );
};

export const getFields = (rawResponse: any) => {
  return rawResponse.data.schema?.map((field: any, index: any) => ({
    ...field,
    values: rawResponse.data.datarows?.map((row: any) => row[index]),
  }));
};

export const removeKeyword = (queryString: string | undefined) => {
  return queryString?.replace(new RegExp('.keyword'), '') ?? '';
};

export const fetchDataFrame = (
  context: FetchDataFrameContext,
  queryString: string,
  df: IDataFrame
) => {
  const { http, path, signal } = context;
  const body = JSON.stringify({ query: { qs: queryString, format: 'jdbc' }, df });
  return from(
    http.fetch({
      method: 'POST',
      path,
      body,
      signal,
    })
  );
};

export const fetchDataFramePolling = (  
  context: FetchDataFrameContext,
  df: IDataFrame
) => {
  const { http, path, signal } = context;
  const queryId = df.meta?.queryId;
  return from(
    http.fetch({
      method: 'GET',
      path: `${path}/${queryId}`,
      signal
    })
  );
}

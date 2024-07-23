/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ASYNC_QUERY_SESSION_ID } from '../constants';

export const setAsyncSessionId = (dataSource: string, value: string | null) => {
  if (value !== null) {
    sessionStorage.setItem(`${ASYNC_QUERY_SESSION_ID}_${dataSource}`, value);
  }
};

export const getAsyncSessionId = (dataSource: string) => {
  return sessionStorage.getItem(`${ASYNC_QUERY_SESSION_ID}_${dataSource}`);
};

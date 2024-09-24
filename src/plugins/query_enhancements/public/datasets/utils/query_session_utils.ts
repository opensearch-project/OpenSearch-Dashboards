/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ASYNC_QUERY_SESSION_ID } from '../constants';

function get<T = unknown>(obj: Record<string, any>, path: string, defaultValue?: T): T {
  return path.split('.').reduce((acc: any, part: string) => acc && acc[part], obj) || defaultValue;
}

export const setAsyncSessionId = (dataSource: string, sessionId: string | null) => {
  if (sessionId !== null) {
    sessionStorage.setItem(`${ASYNC_QUERY_SESSION_ID}_${dataSource}`, sessionId);
  }
};

export const setAsyncSessionIdByObj = (dataSource: string, obj: Record<string, any>) => {
  const sessionId = get(obj, 'sessionId', null);
  setAsyncSessionId(dataSource, sessionId);
};

export const getAsyncSessionId = (dataSource: string) => {
  return sessionStorage.getItem(`${ASYNC_QUERY_SESSION_ID}_${dataSource}`);
};

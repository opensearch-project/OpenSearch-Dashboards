/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SessionCache {
  get: (datasource: string | undefined) => string | undefined;
  set: (datasource: string, session: string) => void;
  clear: () => void;
}

export function createSessionCache(): SessionCache {
  let sessionCache: { [key: string]: string } = {};

  const cache: SessionCache = {
    get: (datasource: string | undefined) => {
      if (!datasource) {
        return undefined;
      }
      if (datasource in sessionCache) {
        return sessionCache[datasource];
      }
      return undefined;
    },
    set: (datasource: string, session: string) => {
      sessionCache[datasource] = session;
    },
    clear: () => {
      sessionCache = {};
    },
  };
  return cache;
}

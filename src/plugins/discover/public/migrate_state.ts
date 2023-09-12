/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { matchPath } from 'react-router-dom';
import { getStateFromOsdUrl, setStateToOsdUrl } from '../../opensearch_dashboards_utils/public';
import { Filter, Query } from '../../data/public';

interface CommonParams {
  appState?: string;
}

interface DiscoverParams extends CommonParams {
  id?: string;
}

interface ContextParams extends CommonParams {
  indexPattern: string;
  id: string;
}

interface DocParams extends CommonParams {
  indexPattern: string;
  index: string;
}

export interface LegacyDiscoverState {
  /**
   * Columns displayed in the table
   */
  columns?: string[];
  /**
   * Array of applied filters
   */
  filters?: Filter[];
  /**
   * id of the used index pattern
   */
  index?: string;
  /**
   * Used interval of the histogram
   */
  interval?: string;
  /**
   * Lucence or DQL query
   */
  query?: Query;
  /**
   * Array of the used sorting [[field,direction],...]
   */
  sort?: string[][];
  /**
   * id of the used saved query
   */
  savedQuery?: string;
}

// TODO: Write unit tests once all routes have been migrated.
/**
 * Migrates legacy URLs to the current URL format.
 * @param oldPath The legacy hash that contains the state.
 * @param newPath The new base path.
 */
export function migrateUrlState(oldPath: string, newPath = '/'): string {
  let path = newPath;
  const pathPatterns = [
    {
      pattern: '#/context/:indexPattern/:id\\?:appState?',
      extraState: { docView: 'context' },
      path: `context`,
    },
    {
      pattern: '#/doc/:indexPattern/:index\\?:appState?',
      extraState: { docView: 'doc' },
      path: `doc`,
    },
    {
      pattern: '#/view/:id',
      extraState: {},
      path: `savedSearch`,
    },
    { pattern: '#/', extraState: {}, path: `discover` },
  ];

  // Get the first matching path pattern.
  const matchingPathPattern = pathPatterns.find((pathPattern) =>
    matchPath(oldPath, { path: pathPattern.pattern, strict: false })
  );

  if (!matchingPathPattern) {
    return path;
  }

  // Migrate the path.
  switch (matchingPathPattern.path) {
    // doc and context views will use the same legacy path and state
    // so we can use the saved legacy path in new discover
    case `doc`:
    case `context`:
      path = oldPath;
    case `discover`:
    case `savedSearch`:
      const params = matchPath<DiscoverParams>(oldPath, {
        path: matchingPathPattern.pattern,
      })!.params;

      // if there is a saved search id, use the saved search path
      if (params.id) {
        path = `${path}#/view/${params.id}`;
      }

      const appState = getStateFromOsdUrl<LegacyDiscoverState>('_a', oldPath);

      if (!appState) return path;

      const { columns, filters, index, interval, query, sort, savedQuery } = appState;

      const _q = {
        query,
        filters,
      };

      const _a = {
        discover: {
          columns,
          interval,
          sort,
          savedQuery,
        },
        metadata: {
          indexPattern: index,
        },
      };

      path = setStateToOsdUrl('_a', _a, { useHash: false }, path);
      path = setStateToOsdUrl('_q', _q, { useHash: false }, path);

      break;
  }

  return path;
}

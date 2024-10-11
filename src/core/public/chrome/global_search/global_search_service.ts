/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode } from 'react';

export enum SearchObjectTypes {
  PAGES = 'pages',
  SAVED_OBJECTS = 'saved_objects',
}

/**
 * @experimental
 */
export interface GlobalSearchHandler {
  /**
   * unique id of this strategy
   */
  id: string;
  /**
   * search object type
   * @type {SearchObjectTypes}
   */
  type: SearchObjectTypes;
  /**
   * do the search and return search result with a React element
   * @param value search query
   * @param callback callback function when search is done
   */
  invoke(value: string, callback?: () => void): Promise<ReactNode[]>;
}

export interface GlobalSearchServiceSetupContract {
  registerSearchHandler(searchStrategy: GlobalSearchHandler): void;
}

export interface GlobalSearchServiceStartContract {
  getAllSearchHandlers(): GlobalSearchHandler[];
}

/**
 * {@link GlobalSearchHandler | APIs} for registering new global search strategy when do search from header search bar .
 *
 * @example
 * Register a GlobalSearchHandler to search pages
 * ```jsx
 * chrome.globalSearch.registerSearchHandler({
 *   id: 'test',
 *   type: SearchObjectTypes.PAGES,
 *   run: async (query) => {
 *     return [];
 *   },
 * })
 * ```
 *
 * @experimental
 */
export class GlobalSearchService {
  private searchHandlers = [] as GlobalSearchHandler[];

  private registerSearchHandler(searchHandler: GlobalSearchHandler) {
    const exists = this.searchHandlers.find((item) => {
      return item.id === searchHandler.id;
    });
    if (exists) {
      // eslint-disable-next-line no-console
      console.warn('Duplicate SearchHandlers id found');
      return;
    }
    this.searchHandlers.push(searchHandler);
  }

  public setup() {
    return {
      registerSearchHandler: this.registerSearchHandler.bind(this),
    };
  }

  public start() {
    return {
      getAllSearchHandlers: () => this.searchHandlers,
    };
  }
}

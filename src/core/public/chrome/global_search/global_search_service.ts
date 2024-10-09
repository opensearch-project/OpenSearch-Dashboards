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
export interface GlobalSearchStrategy {
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
   */
  doSearch(value: string, callback?: () => void): Promise<ReactNode[]>;
}

export interface GlobalSearchServiceSetupContract {
  registerSearchStrategy(searchStrategy: GlobalSearchStrategy): void;
}

export interface GlobalSearchServiceStartContract {
  getAllSearchStrategies(): GlobalSearchStrategy[];
}

/** @experimental */
export class GlobalSearchService {
  private searchStrategies = [] as GlobalSearchStrategy[];

  private registerSearchStrategy(searchStrategy: GlobalSearchStrategy) {
    const exists = this.searchStrategies.find((item) => {
      return item.id === searchStrategy.id;
    });
    if (exists) {
      // eslint-disable-next-line no-console
      console.warn('duplicate SearchStrategy id found');
      return;
    }
    this.searchStrategies.push(searchStrategy);
  }

  public setup() {
    return {
      registerSearchStrategy: this.registerSearchStrategy.bind(this),
    };
  }
  public start() {
    return {
      getAllSearchStrategies: () => this.searchStrategies,
    };
  }
}

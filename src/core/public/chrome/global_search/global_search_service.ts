/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export enum SearchObjectTypes {
  PAGES = 'pages',
  SAVED_OBJECTS = 'saved_objects',
}

/**
 * @experimental
 */
export interface SearchStrategy {
  /**
   * unique id of this strategy
   */
  id: string;
  /**
   * search object type
   * @type {SearchObjectTypes}
   * @memberof SearchStrategy
   */
  type: SearchObjectTypes;
  /**
   * do the search and return search result with a React element
   * @param value search query
   */
  doSearch(value: string): Promise<React.JSX.Element | undefined>;
}

export interface GlobalSearchServiceSetupContract {
  registerSearchStrategy(searchStrategy: SearchStrategy): void;
}

export interface GlobalSearchServiceStartContract {
  getAllSearchStrategies(): SearchStrategy[];
}

/** @experimental */
export class GlobalSearchService {
  private searchStrategies = [] as SearchStrategy[];

  private registerSearchStrategy(searchStrategy: SearchStrategy) {
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

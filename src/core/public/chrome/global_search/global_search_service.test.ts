/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// test global_search_service.ts
import { GlobalSearchService, SearchObjectTypes } from './global_search_service';

describe('GlobalSearchService', () => {
  it('registerSearchStrategy', async () => {
    const globalSearchService = new GlobalSearchService();
    const setup = globalSearchService.setup();
    const start = globalSearchService.start();

    setup.registerSearchStrategy({
      id: 'test1',
      type: SearchObjectTypes.PAGES,
      doSearch: async (query) => {
        return [];
      },
    });

    expect(start.getAllSearchStrategies()).toHaveLength(1);
    expect(start.getAllSearchStrategies()[0].id).toEqual('test1');
    expect(start.getAllSearchStrategies()[0].type).toEqual(SearchObjectTypes.PAGES);
  });

  it('registerSearchStrategy with duplicate id', async () => {
    const globalSearchService = new GlobalSearchService();
    const setup = globalSearchService.setup();
    const start = globalSearchService.start();

    setup.registerSearchStrategy({
      id: 'test2',
      type: SearchObjectTypes.PAGES,
      doSearch: async (query) => {
        return [];
      },
    });

    setup.registerSearchStrategy({
      id: 'test2',
      type: SearchObjectTypes.SAVED_OBJECTS,
      doSearch: async (query) => {
        return [];
      },
    });

    // the second one will not overwrite the first one
    expect(start.getAllSearchStrategies()).toHaveLength(1);
    expect(start.getAllSearchStrategies()[0].id).toEqual('test2');
    expect(start.getAllSearchStrategies()[0].type).toEqual(SearchObjectTypes.PAGES);
  });
});

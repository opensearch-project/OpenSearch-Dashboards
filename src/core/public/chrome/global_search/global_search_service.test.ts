/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// test global_search_service.ts
import { GlobalSearchService, SearchObjectTypes } from './global_search_service';

describe('GlobalSearchService', () => {
  const globalSearchService = new GlobalSearchService();
  const setup = globalSearchService.setup();
  const start = globalSearchService.start();

  it('registerSearchStrategy', async () => {
    setup.registerSearchStrategy({
      id: 'test',
      type: SearchObjectTypes.PAGES,
      doSearch: async (query) => {
        return [];
      },
    });

    expect(start.getAllSearchStrategies()).toHaveLength(1);
    expect(start.getAllSearchStrategies()[0].id).toEqual('test');
    expect(start.getAllSearchStrategies()[0].type).toEqual(SearchObjectTypes.PAGES);
  });

  it('registerSearchStrategy with duplicate id', async () => {
    setup.registerSearchStrategy({
      id: 'test',
      type: SearchObjectTypes.PAGES,
      doSearch: async (query) => {
        return [];
      },
    });

    setup.registerSearchStrategy({
      id: 'test',
      type: SearchObjectTypes.PAGES,
      doSearch: async (query) => {
        return [];
      },
    });

    expect(start.getAllSearchStrategies()).toHaveLength(1);
  });
});

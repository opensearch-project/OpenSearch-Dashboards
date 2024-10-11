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

    setup.registerSearchHandler({
      id: 'test1',
      type: SearchObjectTypes.PAGES,
      invoke: async (query) => {
        return [];
      },
    });

    expect(start.getAllSearchHandlers()).toHaveLength(1);
    expect(start.getAllSearchHandlers()[0].id).toEqual('test1');
    expect(start.getAllSearchHandlers()[0].type).toEqual(SearchObjectTypes.PAGES);
  });

  it('registerSearchStrategy with duplicate id', async () => {
    const globalSearchService = new GlobalSearchService();
    const setup = globalSearchService.setup();
    const start = globalSearchService.start();

    setup.registerSearchHandler({
      id: 'test2',
      type: SearchObjectTypes.PAGES,
      invoke: async (query) => {
        return [];
      },
    });

    setup.registerSearchHandler({
      id: 'test2',
      type: SearchObjectTypes.SAVED_OBJECTS,
      invoke: async (query) => {
        return [];
      },
    });

    // the second one will not overwrite the first one
    expect(start.getAllSearchHandlers()).toHaveLength(1);
    expect(start.getAllSearchHandlers()[0].id).toEqual('test2');
    expect(start.getAllSearchHandlers()[0].type).toEqual(SearchObjectTypes.PAGES);
  });
});

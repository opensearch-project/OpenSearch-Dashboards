/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// test global_search_service.ts
import { GlobalSearchService } from './global_search_service';

describe('GlobalSearchService', () => {
  it('registerSearchCommand', async () => {
    const globalSearchService = new GlobalSearchService();
    const setup = globalSearchService.setup();
    const start = globalSearchService.start();

    setup.registerSearchCommand({
      id: 'test1',
      type: 'PAGES',
      run: async (query) => {
        return [];
      },
    });

    expect(start.getAllSearchCommands()).toHaveLength(1);
    expect(start.getAllSearchCommands()[0].id).toEqual('test1');
    expect(start.getAllSearchCommands()[0].type).toEqual('PAGES');
  });

  it('registerSearchCommand with duplicate id', async () => {
    const globalSearchService = new GlobalSearchService();
    const setup = globalSearchService.setup();
    const start = globalSearchService.start();

    setup.registerSearchCommand({
      id: 'test2',
      type: 'PAGES',
      run: async (query) => {
        return [];
      },
    });

    setup.registerSearchCommand({
      id: 'test2',
      type: 'SAVED_OBJECTS',
      run: async (query) => {
        return [];
      },
    });

    // the second one will not overwrite the first one
    expect(start.getAllSearchCommands()).toHaveLength(1);
    expect(start.getAllSearchCommands()[0].id).toEqual('test2');
    expect(start.getAllSearchCommands()[0].type).toEqual('PAGES');
  });
});

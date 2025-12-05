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

    const mockAction = jest.fn();
    const customPlaceholder = 'Search for pages...';

    setup.registerSearchCommand({
      id: 'test1',
      type: 'PAGES',
      inputPlaceholder: customPlaceholder,
      action: mockAction,
      run: async (query) => {
        return [];
      },
    });

    expect(start.getAllSearchCommands()).toHaveLength(1);
    expect(start.getAllSearchCommands()[0].id).toEqual('test1');
    expect(start.getAllSearchCommands()[0].type).toEqual('PAGES');
    expect(start.getAllSearchCommands()[0].inputPlaceholder).toEqual(customPlaceholder);
    expect(start.getAllSearchCommands()[0].action).toBeDefined();

    // Test that action can be called with payload
    start.getAllSearchCommands()[0].action?.({ content: 'test query' });
    expect(mockAction).toHaveBeenCalledWith({ content: 'test query' });
  });

  it('unregisterSearchCommand', async () => {
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

    start.unregisterSearchCommand('test1');

    expect(start.getAllSearchCommands()).toHaveLength(0);
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

  it('registerSearchCommand with action callback', async () => {
    const globalSearchService = new GlobalSearchService();
    const setup = globalSearchService.setup();
    const start = globalSearchService.start();

    const mockAction = jest.fn();

    setup.registerSearchCommand({
      id: 'test-action',
      type: 'ACTIONS',
      run: async (query) => {
        return [];
      },
      action: mockAction,
    });

    const commands = start.getAllSearchCommands();
    expect(commands).toHaveLength(1);
    expect(commands[0].action).toBeDefined();

    // Test that action can be called with payload
    commands[0].action?.({ content: 'test query' });
    expect(mockAction).toHaveBeenCalledWith({ content: 'test query' });
  });

  it('getAllSearchCommands$', async () => {
    const globalSearchService = new GlobalSearchService();
    const setup = globalSearchService.setup();
    const start = globalSearchService.start();

    const commands$ = start.getAllSearchCommands$();
    const receivedCommands: any[] = [];

    const subscription = commands$.subscribe((commands) => {
      receivedCommands.push(commands);
    });

    // Initially should have empty array
    expect(receivedCommands[0]).toHaveLength(0);

    // Register a command
    setup.registerSearchCommand({
      id: 'test-observable',
      type: 'PAGES',
      run: async (query) => {
        return [];
      },
    });

    // Should receive updated commands
    expect(receivedCommands[1]).toHaveLength(1);
    expect(receivedCommands[1][0].id).toEqual('test-observable');

    // Unregister the command
    start.unregisterSearchCommand('test-observable');

    // Should receive empty array again
    expect(receivedCommands[2]).toHaveLength(0);

    subscription.unsubscribe();
  });
});

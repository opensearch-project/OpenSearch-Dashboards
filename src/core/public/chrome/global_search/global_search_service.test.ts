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

  it('registerSearchSubmitCommand', () => {
    const globalSearchService = new GlobalSearchService();
    const setup = globalSearchService.setup();
    const start = globalSearchService.start();

    const mockRun = jest.fn();
    setup.registerSearchSubmitCommand({
      id: 'submit1',
      name: 'Submit Command 1',
      run: mockRun,
    });

    let commands: any[] = [];
    start.getSearchSubmitCommands$().subscribe((cmds) => {
      commands = cmds;
    });

    expect(commands).toHaveLength(1);
    expect(commands[0].id).toEqual('submit1');
    expect(commands[0].name).toEqual('Submit Command 1');
  });

  it('unregisterSearchSubmitCommand', () => {
    const globalSearchService = new GlobalSearchService();
    const setup = globalSearchService.setup();
    const start = globalSearchService.start();

    setup.registerSearchSubmitCommand({
      id: 'submit1',
      name: 'Submit Command 1',
      run: jest.fn(),
    });

    let commands: any[] = [];
    start.getSearchSubmitCommands$().subscribe((cmds) => {
      commands = cmds;
    });

    expect(commands).toHaveLength(1);

    start.unregisterSearchSubmitCommand('submit1');

    expect(commands).toHaveLength(0);
  });

  it('registerSearchSubmitCommand with duplicate id', () => {
    const globalSearchService = new GlobalSearchService();
    const setup = globalSearchService.setup();
    const start = globalSearchService.start();

    setup.registerSearchSubmitCommand({
      id: 'submit1',
      name: 'Submit Command 1',
      run: jest.fn(),
    });

    setup.registerSearchSubmitCommand({
      id: 'submit1',
      name: 'Submit Command 1 Duplicate',
      run: jest.fn(),
    });

    let commands: any[] = [];
    start.getSearchSubmitCommands$().subscribe((cmds) => {
      commands = cmds;
    });

    // the second one will not overwrite the first one
    expect(commands).toHaveLength(1);
    expect(commands[0].name).toEqual('Submit Command 1');
  });

  it('getSearchSubmitCommands$ returns observable that emits updates', () => {
    const globalSearchService = new GlobalSearchService();
    const setup = globalSearchService.setup();
    const start = globalSearchService.start();

    const emittedValues: any[][] = [];
    start.getSearchSubmitCommands$().subscribe((cmds) => {
      emittedValues.push([...cmds]);
    });

    // Initial empty state
    expect(emittedValues).toHaveLength(1);
    expect(emittedValues[0]).toHaveLength(0);

    // Register first command
    setup.registerSearchSubmitCommand({
      id: 'submit1',
      name: 'Submit Command 1',
      run: jest.fn(),
    });

    expect(emittedValues).toHaveLength(2);
    expect(emittedValues[1]).toHaveLength(1);
    expect(emittedValues[1][0].id).toEqual('submit1');

    // Register second command
    setup.registerSearchSubmitCommand({
      id: 'submit2',
      name: 'Submit Command 2',
      run: jest.fn(),
    });

    expect(emittedValues).toHaveLength(3);
    expect(emittedValues[2]).toHaveLength(2);

    // Unregister first command
    start.unregisterSearchSubmitCommand('submit1');

    expect(emittedValues).toHaveLength(4);
    expect(emittedValues[3]).toHaveLength(1);
    expect(emittedValues[3][0].id).toEqual('submit2');
  });
});

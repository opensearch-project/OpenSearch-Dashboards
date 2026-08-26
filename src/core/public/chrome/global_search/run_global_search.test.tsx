/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { GlobalSearchCommand, GlobalSearchResult } from './global_search_service';
import { runGlobalSearch } from './run_global_search';

const createResult = (id: string): GlobalSearchResult => ({
  id,
  label: id,
  content: <span>{id}</span>,
  execute: jest.fn(),
});

const createCommand = (
  id: string,
  type: GlobalSearchCommand['type'],
  results: GlobalSearchResult[] = []
): GlobalSearchCommand => ({
  id,
  type,
  run: jest.fn().mockResolvedValue(results),
});

describe('runGlobalSearch', () => {
  it('runs default commands and appends actions last', async () => {
    const recentlyAccessedCommand = createCommand('recent', 'RECENTLY_ACCESSED', [
      createResult('recent'),
    ]);
    const pageCommand = createCommand('pages', 'PAGES', [createResult('page')]);
    const assetCommand = createCommand('assets', 'SAVED_OBJECTS', [createResult('asset')]);
    const actionCommand = createCommand('actions', 'ACTIONS', [createResult('action')]);

    const groups = await runGlobalSearch({
      commands: [pageCommand, assetCommand, actionCommand, recentlyAccessedCommand],
      value: 'dashboard',
    });

    expect(recentlyAccessedCommand.run).toHaveBeenCalledWith('dashboard', {
      abortSignal: undefined,
    });
    expect(pageCommand.run).toHaveBeenCalledWith('dashboard', { abortSignal: undefined });
    expect(assetCommand.run).not.toHaveBeenCalled();
    expect(actionCommand.run).toHaveBeenCalledWith('dashboard', { abortSignal: undefined });
    expect(groups.map((group) => group.type)).toEqual(['PAGES', 'RECENTLY_ACCESSED', 'ACTIONS']);
  });

  it('routes aliases and removes the matching prefix', async () => {
    const pageCommand = createCommand('pages', 'PAGES');
    const assetCommand = createCommand('assets', 'SAVED_OBJECTS', [createResult('asset')]);
    const actionCommand = createCommand('actions', 'ACTIONS');

    const groups = await runGlobalSearch({
      commands: [pageCommand, assetCommand, actionCommand],
      value: '@ dashboard',
    });

    expect(pageCommand.run).not.toHaveBeenCalled();
    expect(assetCommand.run).toHaveBeenCalledWith('dashboard', { abortSignal: undefined });
    expect(actionCommand.run).toHaveBeenCalledWith('@ dashboard', { abortSignal: undefined });
    expect(groups.map((group) => group.type)).toEqual(['SAVED_OBJECTS', 'ACTIONS']);
  });

  it('merges commands with the same type and preserves result ownership', async () => {
    const firstCommand = createCommand('first', 'PAGES', [createResult('one')]);
    const secondCommand = createCommand('second', 'PAGES', [createResult('two')]);

    const groups = await runGlobalSearch({
      commands: [firstCommand, secondCommand],
      value: 'page',
    });

    expect(groups).toHaveLength(1);
    expect(groups[0].results.map(({ commandId, result }) => [commandId, result.id])).toEqual([
      ['first', 'one'],
      ['second', 'two'],
    ]);
  });

  it('keeps fulfilled results when another command rejects', async () => {
    const successfulCommand = createCommand('success', 'PAGES', [createResult('result')]);
    const rejectedCommand = createCommand('failure', 'PAGES');
    (rejectedCommand.run as jest.Mock).mockRejectedValue(new Error('search failed'));

    const groups = await runGlobalSearch({
      commands: [successfulCommand, rejectedCommand],
      value: 'page',
    });

    expect(groups[0].results).toHaveLength(1);
    expect(groups[0].results[0].result.id).toBe('result');
  });

  it('passes the abort signal to every selected command', async () => {
    const controller = new AbortController();
    const firstCommand = createCommand('first', 'PAGES');
    const secondCommand = createCommand('second', 'ACTIONS');

    await runGlobalSearch({
      commands: [firstCommand, secondCommand],
      value: 'page',
      abortSignal: controller.signal,
    });

    expect(firstCommand.run).toHaveBeenCalledWith('page', { abortSignal: controller.signal });
    expect(secondCommand.run).toHaveBeenCalledWith('page', { abortSignal: controller.signal });
  });

  it('runs selected commands with an empty value and returns their results', async () => {
    const pageCommand = createCommand('pages', 'PAGES');
    const recentlyAccessedCommand = createCommand('recent', 'RECENTLY_ACCESSED', [
      createResult('recent'),
    ]);
    const actionCommand = createCommand('actions', 'ACTIONS');

    const groups = await runGlobalSearch({
      commands: [pageCommand, recentlyAccessedCommand, actionCommand],
      value: '',
    });

    expect(groups.find(({ type }) => type === 'RECENTLY_ACCESSED')?.results).toEqual([
      {
        commandId: 'recent',
        result: expect.objectContaining({ id: 'recent' }),
      },
    ]);
    expect(pageCommand.run).toHaveBeenCalledWith('', { abortSignal: undefined });
    expect(recentlyAccessedCommand.run).toHaveBeenCalledWith('', { abortSignal: undefined });
    expect(actionCommand.run).toHaveBeenCalledWith('', { abortSignal: undefined });
  });
});

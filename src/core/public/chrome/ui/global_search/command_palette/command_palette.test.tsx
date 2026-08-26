/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { BehaviorSubject } from 'rxjs';
import { KeyboardShortcutStart, ShortcutDefinition } from '../../../../keyboard_shortcut';
import { GlobalSearchCommand, GlobalSearchResult } from '../../../global_search';
import { GlobalSearchCommandPalette } from './command_palette';

const createResult = (
  id: string,
  execute: GlobalSearchResult['execute'] = jest.fn()
): GlobalSearchResult => ({
  id,
  label: id,
  content: <span>{id}</span>,
  execute,
});

const createCommand = (id: string, results: GlobalSearchResult[] = []): GlobalSearchCommand => ({
  id,
  type: 'PAGES',
  run: jest.fn().mockResolvedValue(results),
});

const createKeyboardShortcut = () => {
  const shortcuts: ShortcutDefinition[] = [];
  const keyboardShortcut = {
    register: jest.fn(),
    unregister: jest.fn(),
    useKeyboardShortcut: jest.fn((shortcut: ShortcutDefinition) => {
      shortcuts.push(shortcut);
    }),
    getAllShortcuts: jest.fn(),
  } as jest.Mocked<KeyboardShortcutStart>;

  return { keyboardShortcut, shortcuts };
};

describe('<GlobalSearchCommandPalette />', () => {
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: jest.fn(),
    });
  });

  it('registers Cmd+K and opens with an empty initial state', async () => {
    const command = createCommand('pages');
    const commands$ = new BehaviorSubject([command]);
    const { keyboardShortcut, shortcuts } = createKeyboardShortcut();
    const { getByTestId, queryByTestId } = render(
      <GlobalSearchCommandPalette
        globalSearchCommands$={commands$}
        keyboardShortcut={keyboardShortcut}
      />
    );

    expect(queryByTestId('global-search-command-palette')).not.toBeInTheDocument();
    expect(shortcuts[0]).toEqual(
      expect.objectContaining({
        id: 'toggle_global_search_command_palette',
        pluginId: 'core',
        keys: 'cmd+k',
        allowInEditable: true,
      })
    );

    act(() => shortcuts[0].execute());

    expect(getByTestId('global-search-command-palette')).toBeVisible();
    await waitFor(() => {
      expect(getByTestId('global-search-command-palette-initial')).toBeVisible();
    });
    expect(getByTestId('global-search-command-palette-footer')).toHaveTextContent('@Search assets');
    expect(getByTestId('global-search-command-palette-footer')).toHaveTextContent('>Commands');
    expect(command.run).toHaveBeenCalledWith('', {
      abortSignal: expect.any(AbortSignal),
    });
  });

  it('shows results returned by registered commands for an empty query', async () => {
    const command = {
      ...createCommand('recent', [createResult('recent-result')]),
      type: 'RECENTLY_ACCESSED' as const,
    };
    const commands$ = new BehaviorSubject<GlobalSearchCommand[]>([command]);
    const { keyboardShortcut, shortcuts } = createKeyboardShortcut();
    const { getByText } = render(
      <GlobalSearchCommandPalette
        globalSearchCommands$={commands$}
        keyboardShortcut={keyboardShortcut}
      />
    );

    act(() => shortcuts[0].execute());

    await waitFor(() => {
      expect(command.run).toHaveBeenCalledWith('', {
        abortSignal: expect.any(AbortSignal),
      });
      expect(getByText('Recently accessed')).toBeVisible();
      expect(getByText('recent-result')).toBeVisible();
    });
  });

  it('renders section results in product order and trailing results last', async () => {
    const pageCommand = createCommand('pages', [createResult('page-result')]);
    const actionCommand = {
      ...createCommand('actions', [
        createResult('action-result'),
        {
          ...createResult('chat-result'),
          placement: 'trailing',
        },
      ]),
      type: 'ACTIONS' as const,
    };
    const commands$ = new BehaviorSubject<GlobalSearchCommand[]>([pageCommand, actionCommand]);
    const { keyboardShortcut, shortcuts } = createKeyboardShortcut();
    const { getAllByTestId, getByText } = render(
      <GlobalSearchCommandPalette
        globalSearchCommands$={commands$}
        keyboardShortcut={keyboardShortcut}
      />
    );

    act(() => shortcuts[0].execute());

    await waitFor(() => {
      expect(getByText('Actions')).toBeVisible();
      expect(getByText('Pages')).toBeVisible();
      expect(
        getAllByTestId('global-search-command-palette-item').map((item) => item.textContent)
      ).toEqual(['action-result', 'page-result', 'chat-result']);
    });
  });

  it('closes with Cmd+K while the palette input is focused', async () => {
    const commands$ = new BehaviorSubject([createCommand('pages')]);
    const { keyboardShortcut, shortcuts } = createKeyboardShortcut();
    const { getByTestId, queryByTestId } = render(
      <GlobalSearchCommandPalette
        globalSearchCommands$={commands$}
        keyboardShortcut={keyboardShortcut}
      />
    );

    act(() => shortcuts[0].execute());
    getByTestId('global-search-command-palette-input').focus();

    act(() => shortcuts[0].execute());

    await waitFor(() => {
      expect(queryByTestId('global-search-command-palette')).not.toBeInTheDocument();
    });
  });

  it('searches registered providers and executes only the selected result', async () => {
    const firstExecute = jest.fn();
    const secondExecute = jest.fn();
    const command = createCommand('pages', [
      createResult('first-result', firstExecute),
      createResult('second-result', secondExecute),
    ]);
    const commands$ = new BehaviorSubject([command]);
    const { keyboardShortcut, shortcuts } = createKeyboardShortcut();
    const { getByTestId, getByText, queryByTestId } = render(
      <GlobalSearchCommandPalette
        globalSearchCommands$={commands$}
        keyboardShortcut={keyboardShortcut}
      />
    );

    act(() => shortcuts[0].execute());
    fireEvent.change(getByTestId('global-search-command-palette-input'), {
      target: { value: 'result' },
    });

    await waitFor(() => {
      expect(command.run).toHaveBeenCalledWith('result', {
        abortSignal: expect.any(AbortSignal),
      });
      expect(getByText('first-result')).toBeVisible();
      expect(getByText('second-result')).toBeVisible();
    });

    fireEvent.click(getByText('second-result'));

    expect(secondExecute).toHaveBeenCalledTimes(1);
    expect(firstExecute).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(queryByTestId('global-search-command-palette')).not.toBeInTheDocument();
    });
  });

  it('moves the highlight with arrow keys before executing', async () => {
    const firstExecute = jest.fn();
    const secondExecute = jest.fn();
    const command = createCommand('pages', [
      createResult('first-result', firstExecute),
      createResult('second-result', secondExecute),
    ]);
    const commands$ = new BehaviorSubject([command]);
    const { keyboardShortcut, shortcuts } = createKeyboardShortcut();
    const { getByTestId, getByText } = render(
      <GlobalSearchCommandPalette
        globalSearchCommands$={commands$}
        keyboardShortcut={keyboardShortcut}
      />
    );

    act(() => shortcuts[0].execute());
    const input = getByTestId('global-search-command-palette-input');
    fireEvent.change(input, { target: { value: 'result' } });

    await waitFor(() => expect(getByText('second-result')).toBeVisible());
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(secondExecute).toHaveBeenCalledTimes(1);
    expect(firstExecute).not.toHaveBeenCalled();
  });

  it('does not wrap keyboard navigation at the first or last item', async () => {
    const command = createCommand('pages', [
      createResult('first-result'),
      createResult('second-result'),
    ]);
    const commands$ = new BehaviorSubject([command]);
    const { keyboardShortcut, shortcuts } = createKeyboardShortcut();
    const { getAllByRole, getByTestId, getByText } = render(
      <GlobalSearchCommandPalette
        globalSearchCommands$={commands$}
        keyboardShortcut={keyboardShortcut}
      />
    );

    act(() => shortcuts[0].execute());
    const input = getByTestId('global-search-command-palette-input');
    fireEvent.change(input, { target: { value: 'result' } });

    await waitFor(() => expect(getByText('second-result')).toBeVisible());

    const options = getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(options[0]).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(options[1]).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('scrolls the results container to the top when navigation returns to the first item', async () => {
    const command = createCommand('pages', [
      createResult('first-result'),
      createResult('second-result'),
    ]);
    const commands$ = new BehaviorSubject([command]);
    const { keyboardShortcut, shortcuts } = createKeyboardShortcut();
    const { getByRole, getByTestId, getByText } = render(
      <GlobalSearchCommandPalette
        globalSearchCommands$={commands$}
        keyboardShortcut={keyboardShortcut}
      />
    );

    act(() => shortcuts[0].execute());
    const input = getByTestId('global-search-command-palette-input');
    fireEvent.change(input, { target: { value: 'result' } });

    await waitFor(() => expect(getByText('second-result')).toBeVisible());

    const resultsContainer = getByRole('listbox');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    resultsContainer.scrollTop = 100;
    fireEvent.keyDown(input, { key: 'ArrowUp' });

    expect(resultsContainer.scrollTop).toBe(0);
  });

  it('uses commands registered after the component mounts', async () => {
    const commands$ = new BehaviorSubject<GlobalSearchCommand[]>([]);
    const dynamicCommand = createCommand('dynamic', [createResult('dynamic-result')]);
    const { keyboardShortcut, shortcuts } = createKeyboardShortcut();
    const { getByTestId, getByText } = render(
      <GlobalSearchCommandPalette
        globalSearchCommands$={commands$}
        keyboardShortcut={keyboardShortcut}
      />
    );

    act(() => {
      commands$.next([dynamicCommand]);
      shortcuts[0].execute();
    });
    fireEvent.change(getByTestId('global-search-command-palette-input'), {
      target: { value: 'dynamic' },
    });

    await waitFor(() => {
      expect(dynamicCommand.run).toHaveBeenCalled();
      expect(getByText('dynamic-result')).toBeVisible();
    });
  });

  it('clears the query when dismissed and reopened', async () => {
    const commands$ = new BehaviorSubject([createCommand('pages')]);
    const { keyboardShortcut, shortcuts } = createKeyboardShortcut();
    const { getByTestId } = render(
      <GlobalSearchCommandPalette
        globalSearchCommands$={commands$}
        keyboardShortcut={keyboardShortcut}
      />
    );

    act(() => shortcuts[0].execute());
    const input = getByTestId('global-search-command-palette-input');
    fireEvent.change(input, { target: { value: 'query' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    act(() => shortcuts[shortcuts.length - 1].execute());

    expect(getByTestId('global-search-command-palette-input')).toHaveValue('');
    await waitFor(() => {
      expect(getByTestId('global-search-command-palette-initial')).toBeVisible();
    });
  });

  it('closes when the overlay is clicked', async () => {
    const commands$ = new BehaviorSubject([createCommand('pages')]);
    const { keyboardShortcut, shortcuts } = createKeyboardShortcut();
    const { getByTestId, queryByTestId } = render(
      <GlobalSearchCommandPalette
        globalSearchCommands$={commands$}
        keyboardShortcut={keyboardShortcut}
      />
    );

    act(() => shortcuts[0].execute());
    fireEvent.click(getByTestId('global-search-command-palette-overlay'));

    await waitFor(() => {
      expect(queryByTestId('global-search-command-palette')).not.toBeInTheDocument();
    });
  });
});

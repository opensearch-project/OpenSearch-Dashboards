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

  it('registers Cmd+K and opens with an empty initial state', () => {
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
    expect(getByTestId('global-search-command-palette-initial')).toBeVisible();
    expect(getByTestId('global-search-command-palette-footer')).toHaveTextContent('@Search assets');
    expect(getByTestId('global-search-command-palette-footer')).toHaveTextContent('>Commands');
    expect(getByTestId('global-search-command-palette-assets-token')).toHaveClass(
      'osdGlobalSearchCommandPalette__footerToken'
    );
    expect(getByTestId('global-search-command-palette-commands-token')).toHaveClass(
      'osdGlobalSearchCommandPalette__footerToken'
    );
    expect(command.run).not.toHaveBeenCalled();
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

    expect(getByTestId('global-search-command-palette-overlay')).toHaveClass(
      'osdGlobalSearchCommandPaletteOverlay--closing'
    );

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

  it('executes the highlighted item with Enter', async () => {
    const execute = jest.fn();
    const command = createCommand('pages', [createResult('keyboard-result', execute)]);
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
    fireEvent.change(input, { target: { value: 'keyboard' } });

    await waitFor(() => expect(getByText('keyboard-result')).toBeVisible());
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(execute).toHaveBeenCalledTimes(1);
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

  it('does not execute the active result when Enter is pressed outside the search input', async () => {
    const execute = jest.fn();
    const command = createCommand('pages', [createResult('keyboard-result', execute)]);
    const commands$ = new BehaviorSubject([command]);
    const { keyboardShortcut, shortcuts } = createKeyboardShortcut();
    const { getByLabelText, getByTestId, getByText } = render(
      <GlobalSearchCommandPalette
        globalSearchCommands$={commands$}
        keyboardShortcut={keyboardShortcut}
      />
    );

    act(() => shortcuts[0].execute());
    fireEvent.change(getByTestId('global-search-command-palette-input'), {
      target: { value: 'keyboard' },
    });

    await waitFor(() => expect(getByText('keyboard-result')).toBeVisible());
    fireEvent.keyDown(getByLabelText('Clear input'), { key: 'Enter' });

    expect(execute).not.toHaveBeenCalled();
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

  it('clears the query when dismissed and reopened', () => {
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
    expect(getByTestId('global-search-command-palette-initial')).toBeVisible();
  });

  it('animates out before unmounting when the overlay is clicked', async () => {
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

    expect(getByTestId('global-search-command-palette-overlay')).toHaveClass(
      'osdGlobalSearchCommandPaletteOverlay--closing'
    );
    expect(getByTestId('global-search-command-palette')).toBeInTheDocument();

    await waitFor(() => {
      expect(queryByTestId('global-search-command-palette')).not.toBeInTheDocument();
    });
  });
});

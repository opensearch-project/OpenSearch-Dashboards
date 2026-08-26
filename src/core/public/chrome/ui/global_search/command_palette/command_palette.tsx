/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiFieldSearch,
  EuiFocusTrap,
  EuiLoadingSpinner,
  EuiOverlayMask,
  EuiPanel,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useObservable from 'react-use/lib/useObservable';
import { Observable } from 'rxjs';
import { KeyboardShortcutStart } from '../../../../keyboard_shortcut';
import {
  COMMANDS_SYMBOL,
  GlobalSearchCommand,
  GlobalSearchResult,
  SAVED_OBJECTS_SYMBOL,
} from '../../../global_search';
import { GlobalSearchResultGroup, runGlobalSearch } from '../../../global_search/run_global_search';
import './command_palette.scss';

interface GlobalSearchCommandPaletteProps {
  globalSearchCommands$: Observable<GlobalSearchCommand[]>;
  keyboardShortcut: KeyboardShortcutStart;
}

interface CommandPaletteResult {
  commandId: string;
  result: GlobalSearchResult;
}

type CommandPaletteState = 'closed' | 'open' | 'closing';

const resultListId = 'global-search-command-palette-results';
const closeAnimationDuration = 150;

export const GlobalSearchCommandPalette = ({
  globalSearchCommands$,
  keyboardShortcut,
}: GlobalSearchCommandPaletteProps) => {
  const globalSearchCommands = useObservable(globalSearchCommands$, []);
  const [paletteState, setPaletteState] = useState<CommandPaletteState>('closed');
  const [query, setQuery] = useState('');
  const [resultGroups, setResultGroups] = useState<GlobalSearchResultGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeResultIndex, setActiveResultIndex] = useState(-1);
  const activeAbortControllerRef = useRef<AbortController>();
  const closeAnimationTimerRef = useRef<number>();
  const paletteStateRef = useRef<CommandPaletteState>('closed');

  const updatePaletteState = useCallback((state: CommandPaletteState) => {
    paletteStateRef.current = state;
    setPaletteState(state);
  }, []);

  const results = useMemo<CommandPaletteResult[]>(
    () => resultGroups.flatMap((group) => group.results),
    [resultGroups]
  );

  const clearSearch = useCallback(() => {
    activeAbortControllerRef.current?.abort('Global command palette closed');
    activeAbortControllerRef.current = undefined;
    setQuery('');
    setResultGroups([]);
    setIsLoading(false);
    setActiveResultIndex(-1);
  }, []);

  const closeCommandPalette = useCallback(() => {
    if (closeAnimationTimerRef.current !== undefined) {
      window.clearTimeout(closeAnimationTimerRef.current);
    }

    activeAbortControllerRef.current?.abort('Global command palette closed');
    activeAbortControllerRef.current = undefined;
    updatePaletteState('closing');

    closeAnimationTimerRef.current = window.setTimeout(() => {
      clearSearch();
      updatePaletteState('closed');
      closeAnimationTimerRef.current = undefined;
    }, closeAnimationDuration);
  }, [clearSearch, updatePaletteState]);

  const openCommandPalette = useCallback(() => {
    if (closeAnimationTimerRef.current !== undefined) {
      window.clearTimeout(closeAnimationTimerRef.current);
      closeAnimationTimerRef.current = undefined;
      clearSearch();
    }

    updatePaletteState('open');
  }, [clearSearch, updatePaletteState]);

  const toggleCommandPalette = useCallback(() => {
    if (paletteStateRef.current === 'open') {
      closeCommandPalette();
    } else {
      openCommandPalette();
    }
  }, [closeCommandPalette, openCommandPalette]);

  keyboardShortcut.useKeyboardShortcut({
    id: 'toggle_global_search_command_palette',
    pluginId: 'core',
    name: i18n.translate('core.globalSearch.commandPalette.shortcutName', {
      defaultMessage: 'Toggle command palette',
    }),
    category: i18n.translate('core.globalSearch.commandPalette.shortcutCategory', {
      defaultMessage: 'Navigation',
    }),
    keys: 'cmd+k',
    allowInEditable: true,
    execute: toggleCommandPalette,
  });

  useEffect(() => {
    return () => {
      activeAbortControllerRef.current?.abort('Global command palette unmounted');
      if (closeAnimationTimerRef.current !== undefined) {
        window.clearTimeout(closeAnimationTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setActiveResultIndex(results.length ? 0 : -1);
  }, [results]);

  useEffect(() => {
    if (activeResultIndex < 0) {
      return;
    }

    document
      .getElementById(`${resultListId}-option-${activeResultIndex}`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [activeResultIndex]);

  const search = useCallback(
    async (value: string) => {
      setQuery(value);
      activeAbortControllerRef.current?.abort('Superseded by a newer global search');

      if (!value) {
        activeAbortControllerRef.current = undefined;
        setResultGroups([]);
        setIsLoading(false);
        return;
      }

      const abortController = new AbortController();
      activeAbortControllerRef.current = abortController;
      setResultGroups([]);
      setIsLoading(true);

      const groups = await runGlobalSearch({
        commands: globalSearchCommands,
        value,
        abortSignal: abortController.signal,
      });

      if (abortController.signal.aborted || activeAbortControllerRef.current !== abortController) {
        return;
      }

      activeAbortControllerRef.current = undefined;
      setResultGroups(groups);
      setIsLoading(false);
    },
    [globalSearchCommands]
  );

  const executeResult = useCallback(
    (result: GlobalSearchResult) => {
      if (paletteState === 'open') {
        closeCommandPalette();
        result.execute();
      }
    },
    [closeCommandPalette, paletteState]
  );

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeCommandPalette();
      return;
    }

    const isSearchInput =
      event.target instanceof HTMLElement && event.target.getAttribute('role') === 'combobox';

    if (!isSearchInput || !results.length) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveResultIndex((currentIndex) => (currentIndex + 1) % results.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveResultIndex((currentIndex) =>
        currentIndex <= 0 ? results.length - 1 : currentIndex - 1
      );
      return;
    }

    if (event.key === 'Enter' && activeResultIndex >= 0 && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.stopPropagation();
      executeResult(results[activeResultIndex].result);
    }
  };

  if (paletteState === 'closed') {
    return null;
  }

  const hasResults = results.length > 0;
  let currentResultIndex = -1;

  return (
    <EuiOverlayMask
      className={`osdGlobalSearchCommandPaletteOverlay${
        paletteState === 'closing' ? ' osdGlobalSearchCommandPaletteOverlay--closing' : ''
      }`}
      headerZindexLocation="above"
      onClick={closeCommandPalette}
      data-test-subj="global-search-command-palette-overlay"
    >
      <EuiFocusTrap initialFocus="[data-test-subj='global-search-command-palette-input']">
        <EuiPanel
          className="osdGlobalSearchCommandPalette"
          paddingSize="none"
          role="dialog"
          aria-modal="true"
          aria-label={i18n.translate('core.globalSearch.commandPalette.label', {
            defaultMessage: 'Global command palette',
          })}
          data-test-subj="global-search-command-palette"
          onKeyDown={onKeyDown}
        >
          <div className="osdGlobalSearchCommandPalette__search">
            <EuiFieldSearch
              autoFocus
              fullWidth
              value={query}
              onChange={(event) => {
                search(event.target.value);
              }}
              placeholder={
                globalSearchCommands.find((command) => command.inputPlaceholder)
                  ?.inputPlaceholder ??
                i18n.translate('core.globalSearch.input.placeholder', {
                  defaultMessage: 'Search menu or assets',
                })
              }
              aria-label={i18n.translate('core.globalSearch.commandPalette.inputLabel', {
                defaultMessage: 'Search commands',
              })}
              aria-controls={hasResults ? resultListId : undefined}
              aria-activedescendant={
                activeResultIndex >= 0 ? `${resultListId}-option-${activeResultIndex}` : undefined
              }
              aria-autocomplete="list"
              aria-expanded={hasResults}
              role="combobox"
              data-test-subj="global-search-command-palette-input"
            />
          </div>

          {isLoading ? (
            <div
              className="osdGlobalSearchCommandPalette__message"
              data-test-subj="global-search-command-palette-loading"
            >
              <EuiLoadingSpinner size="m" />
              <span>
                {i18n.translate('core.globalSearch.commandPalette.loadingMessage', {
                  defaultMessage: 'Loading…',
                })}
              </span>
            </div>
          ) : hasResults ? (
            <div
              id={resultListId}
              className="osdGlobalSearchCommandPalette__results"
              role="listbox"
              aria-label={i18n.translate('core.globalSearch.commandPalette.resultsLabel', {
                defaultMessage: 'Search results',
              })}
            >
              {resultGroups
                .filter((group) => group.results.length)
                .map((group) => {
                  const groupLabelId = `${resultListId}-group-${group.type}`;

                  return (
                    <div
                      key={group.type}
                      className="osdGlobalSearchCommandPalette__group"
                      role="group"
                      aria-labelledby={group.type === 'ACTIONS' ? undefined : groupLabelId}
                      aria-label={group.type === 'ACTIONS' ? group.label : undefined}
                    >
                      {group.type === 'ACTIONS' ? null : (
                        <div
                          id={groupLabelId}
                          className="osdGlobalSearchCommandPalette__groupLabel"
                        >
                          {group.label}
                        </div>
                      )}
                      {group.results.map(({ commandId, result }) => {
                        currentResultIndex += 1;
                        const resultIndex = currentResultIndex;
                        const isActive = resultIndex === activeResultIndex;

                        return (
                          <div
                            key={`${commandId}:${result.id}`}
                            id={`${resultListId}-option-${resultIndex}`}
                            className="osdGlobalSearchCommandPalette__result"
                            role="option"
                            aria-label={result.label}
                            aria-selected={isActive}
                            tabIndex={-1}
                            data-test-subj="global-search-command-palette-item"
                            onMouseEnter={() => setActiveResultIndex(resultIndex)}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => executeResult(result)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                event.stopPropagation();
                                executeResult(result);
                              }
                            }}
                          >
                            {result.content}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
            </div>
          ) : (
            <div
              className="osdGlobalSearchCommandPalette__message"
              data-test-subj={
                query
                  ? 'global-search-command-palette-empty'
                  : 'global-search-command-palette-initial'
              }
            >
              {query
                ? i18n.translate('core.globalSearch.emptyResult.description', {
                    defaultMessage: 'No results found.',
                  })
                : i18n.translate('core.globalSearch.commandPalette.initialMessage', {
                    defaultMessage: 'Start typing to search.',
                  })}
            </div>
          )}

          <footer
            className="osdGlobalSearchCommandPalette__footer"
            data-test-subj="global-search-command-palette-footer"
          >
            <span className="osdGlobalSearchCommandPalette__footerTip">
              Tips:
              <span
                className="osdGlobalSearchCommandPalette__footerToken"
                data-test-subj="global-search-command-palette-assets-token"
              >
                {SAVED_OBJECTS_SYMBOL}
              </span>
              {i18n.translate('core.globalSearch.commandPalette.searchAssetsTip', {
                defaultMessage: 'Search assets',
              })}
            </span>
            <span className="osdGlobalSearchCommandPalette__footerTip">
              <span
                className="osdGlobalSearchCommandPalette__footerToken"
                data-test-subj="global-search-command-palette-commands-token"
              >
                {COMMANDS_SYMBOL}
              </span>
              {i18n.translate('core.globalSearch.commandPalette.searchCommandsTip', {
                defaultMessage: 'Commands',
              })}
            </span>
          </footer>
        </EuiPanel>
      </EuiFocusTrap>
    </EuiOverlayMask>
  );
};

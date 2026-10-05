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
import {
  KeyboardEvent,
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import useObservable from 'react-use/lib/useObservable';
import { Observable } from 'rxjs';
import { KeyboardShortcutStart } from '../../../../keyboard_shortcut';
import {
  GlobalSearchCommand,
  GlobalSearchResult,
  SearchCommandTypes,
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
  const [hasSearchError, setHasSearchError] = useState(false);
  const [activeResultIndex, setActiveResultIndex] = useState(-1);
  const activeAbortControllerRef = useRef<AbortController>();
  const closeAnimationTimerRef = useRef<number>();
  const paletteStateRef = useRef<CommandPaletteState>('closed');
  const globalSearchCommandsRef = useRef(globalSearchCommands);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  globalSearchCommandsRef.current = globalSearchCommands;

  const updatePaletteState = useCallback((state: CommandPaletteState) => {
    paletteStateRef.current = state;
    setPaletteState(state);
  }, []);

  const orderedResultGroups = useMemo(() => {
    const actionsGroup = resultGroups.find((group) => group.type === 'ACTIONS');

    return actionsGroup
      ? [actionsGroup, ...resultGroups.filter((group) => group.type !== 'ACTIONS')]
      : resultGroups;
  }, [resultGroups]);

  const { sectionResultGroups, trailingResults } = useMemo(() => {
    const trailing: CommandPaletteResult[] = [];
    const sections = orderedResultGroups
      .map((group) => ({
        ...group,
        results: group.results.filter((result) => {
          if (result.result.placement === 'trailing') {
            trailing.push(result);
            return false;
          }

          return true;
        }),
      }))
      .filter((group) => group.results.length);

    return {
      sectionResultGroups: sections,
      trailingResults: trailing,
    };
  }, [orderedResultGroups]);

  const results = useMemo<CommandPaletteResult[]>(
    () => [...sectionResultGroups.flatMap((group) => group.results), ...trailingResults],
    [sectionResultGroups, trailingResults]
  );

  const searchTips = useMemo(() => {
    const registeredTypes = new Set(globalSearchCommands.map((command) => command.type));

    return Array.from(registeredTypes).flatMap((type) => {
      const { alias, description } = SearchCommandTypes[type];

      return alias ? [{ type, alias, description }] : [];
    });
  }, [globalSearchCommands]);

  const searchPlaceholder = searchTips.length
    ? i18n.translate('core.globalSearch.commandPalette.inputPlaceholderWithTips', {
        defaultMessage: 'Type to search, {tips}',
        values: {
          tips: searchTips
            .map(({ alias, description }) => `type ${alias} to search ${description}`)
            .join(', '),
        },
      })
    : i18n.translate('core.globalSearch.commandPalette.inputPlaceholder', {
        defaultMessage: 'Type to search',
      });

  const search = useCallback(async (value: string) => {
    setQuery(value);
    activeAbortControllerRef.current?.abort('Superseded by a newer global search');

    const abortController = new AbortController();
    activeAbortControllerRef.current = abortController;
    setResultGroups([]);
    setHasSearchError(false);
    setIsLoading(true);

    try {
      const groups = await runGlobalSearch({
        commands: globalSearchCommandsRef.current,
        value,
        abortSignal: abortController.signal,
      });

      if (abortController.signal.aborted || activeAbortControllerRef.current !== abortController) {
        return;
      }

      setResultGroups(groups);
    } catch (error) {
      if (abortController.signal.aborted || activeAbortControllerRef.current !== abortController) {
        return;
      }

      // eslint-disable-next-line no-console
      console.error('Global search failed', error);
      setHasSearchError(true);
    } finally {
      if (!abortController.signal.aborted && activeAbortControllerRef.current === abortController) {
        activeAbortControllerRef.current = undefined;
        setIsLoading(false);
      }
    }
  }, []);

  const clearSearch = useCallback(() => {
    activeAbortControllerRef.current?.abort('Global command palette closed');
    activeAbortControllerRef.current = undefined;
    setQuery('');
    setResultGroups([]);
    setIsLoading(false);
    setHasSearchError(false);
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
    search('');
  }, [clearSearch, search, updatePaletteState]);

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

    // scrollIntoView with "nearest" can leave the first result's section heading clipped.
    // Reset the container so keyboard navigation back to the first item reveals the full section.
    if (activeResultIndex === 0) {
      if (resultsContainerRef.current) {
        resultsContainerRef.current.scrollTop = 0;
      }
      return;
    }

    document
      .getElementById(`${resultListId}-option-${activeResultIndex}`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [activeResultIndex]);

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
      setActiveResultIndex((currentIndex) => Math.min(currentIndex + 1, results.length - 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveResultIndex((currentIndex) => Math.max(currentIndex - 1, 0));
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

  const renderResult = ({ commandId, result }: CommandPaletteResult) => {
    currentResultIndex += 1;
    const resultIndex = currentResultIndex;
    const isActive = resultIndex === activeResultIndex;
    const resultProps = {
      id: `${resultListId}-option-${resultIndex}`,
      className: 'osdGlobalSearchCommandPalette__result',
      role: 'option',
      'aria-label': result.label,
      'aria-selected': isActive,
      tabIndex: -1,
      'data-test-subj': 'global-search-command-palette-item',
      // Mouse enter can fire when keyboard scrolling moves a result under a stationary pointer.
      // Only actual pointer movement should take selection ownership from the keyboard.
      onMouseMove: () => setActiveResultIndex(resultIndex),
      onMouseDown: (event: MouseEvent<HTMLElement>) => {
        if (event.button === 0) {
          event.preventDefault();
        }
      },
      onClick: (event: MouseEvent<HTMLElement>) => {
        event.preventDefault();
        executeResult(result);
      },
    };

    if (result.href) {
      return (
        <a key={`${commandId}:${result.id}`} href={result.href} {...resultProps}>
          {result.content}
        </a>
      );
    }

    return (
      <div
        key={`${commandId}:${result.id}`}
        {...resultProps}
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
  };

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
              placeholder={searchPlaceholder}
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
          ) : hasSearchError ? (
            <div
              className="osdGlobalSearchCommandPalette__message"
              data-test-subj="global-search-command-palette-error"
            >
              {i18n.translate('core.globalSearch.commandPalette.errorMessage', {
                defaultMessage: 'Unable to load search results.',
              })}
            </div>
          ) : hasResults ? (
            <div
              ref={resultsContainerRef}
              id={resultListId}
              className="osdGlobalSearchCommandPalette__results"
              role="listbox"
              aria-label={i18n.translate('core.globalSearch.commandPalette.resultsLabel', {
                defaultMessage: 'Search results',
              })}
            >
              {sectionResultGroups.map((group) => {
                const groupLabelId = `${resultListId}-group-${group.type}`;

                return (
                  <div
                    key={group.type}
                    className="osdGlobalSearchCommandPalette__group"
                    role="group"
                    aria-labelledby={groupLabelId}
                  >
                    <div id={groupLabelId} className="osdGlobalSearchCommandPalette__groupLabel">
                      {group.label}
                    </div>
                    {group.results.map(renderResult)}
                  </div>
                );
              })}
              {trailingResults.map(renderResult)}
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

          {searchTips.length > 0 && (
            <footer
              className="osdGlobalSearchCommandPalette__footer"
              data-test-subj="global-search-command-palette-footer"
            >
              {searchTips.map(({ type, alias, description }, index) => (
                <span key={type} className="osdGlobalSearchCommandPalette__footerTip">
                  {index === 0 && 'Tips:'}
                  <code className="osdGlobalSearchCommandPalette__footerToken">{alias}</code>
                  {description}
                </span>
              ))}
            </footer>
          )}
        </EuiPanel>
      </EuiFocusTrap>
    </EuiOverlayMask>
  );
};

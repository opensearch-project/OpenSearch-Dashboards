/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButtonIcon,
  EuiFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiListGroup,
  EuiListGroupItem,
  EuiPanel,
  EuiPopover,
  EuiText,
  EuiTitle,
  EuiToolTip,
} from '@elastic/eui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { i18n } from '@osd/i18n';
import { GlobalSearchCommand, GlobalSearchResult } from '../../global_search';
import { GlobalSearchResultGroup, runGlobalSearch } from '../../global_search/run_global_search';
import './header_search_bar.scss';

interface Props {
  globalSearchCommands: GlobalSearchCommand[];
  commandPaletteAvailable?: boolean;
  panel?: boolean;
  onSearchResultClick?: () => void;
}

export const HeaderSearchBarIcon = ({ globalSearchCommands, commandPaletteAvailable }: Props) => {
  const [isSearchPopoverOpen, setIsSearchPopoverOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  return (
    <EuiPopover
      panelPaddingSize="s"
      anchorPosition="downCenter"
      repositionOnScroll={true}
      isOpen={isSearchPopoverOpen}
      closePopover={() => {
        setIsSearchPopoverOpen(false);
      }}
      button={
        <EuiToolTip
          content={i18n.translate('core.globalSearch.icon.toolTip', {
            defaultMessage: 'Search',
          })}
        >
          <EuiButtonIcon
            aria-label="search"
            iconType="search"
            color="text"
            buttonRef={buttonRef}
            data-test-subj="globalSearch-leftNav-icon"
            onClick={() => {
              setIsSearchPopoverOpen(!isSearchPopoverOpen);
              // remove focus from the button to dismiss the tooltip
              buttonRef.current?.blur();
            }}
          />
        </EuiToolTip>
      }
    >
      <EuiPanel
        hasBorder={false}
        hasShadow={false}
        paddingSize="none"
        style={{ minHeight: '300px', minWidth: '400px' }}
      >
        <HeaderSearchBar
          globalSearchCommands={globalSearchCommands}
          commandPaletteAvailable={commandPaletteAvailable}
          panel
          onSearchResultClick={() => {
            setIsSearchPopoverOpen(false);
            buttonRef.current?.blur();
          }}
        />
      </EuiPanel>
    </EuiPopover>
  );
};

export const HeaderSearchBar = ({
  globalSearchCommands,
  commandPaletteAvailable,
  panel,
  onSearchResultClick,
}: Props) => {
  const [resultGroups, setResultGroups] = useState<GlobalSearchResultGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const enterKeyDownRef = useRef(false);
  const searchBarInputRef = useRef<HTMLInputElement | null>(null);
  const activeAbortControllerRef = useRef<AbortController>();
  const commandPaletteShortcutLabel =
    typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('mac')
      ? '⌘+k'
      : 'Ctrl+k';

  const clearSearch = useCallback(() => {
    activeAbortControllerRef.current?.abort('Global search closed');
    activeAbortControllerRef.current = undefined;
    setIsPopoverOpen(false);
    setResultGroups([]);
    setIsLoading(false);
    setSearchValue('');
  }, []);

  useEffect(() => {
    return () => activeAbortControllerRef.current?.abort('Global search unmounted');
  }, []);

  const closeSearch = useCallback(() => {
    clearSearch();
    onSearchResultClick?.();
  }, [clearSearch, onSearchResultClick]);

  const executeResult = useCallback(
    (result: GlobalSearchResult) => {
      closeSearch();
      result.execute();
    },
    [closeSearch]
  );

  const resultSection = (group: GlobalSearchResultGroup) => {
    const sectionHeader = group.type === 'ACTIONS' ? undefined : group.label;
    return (
      <EuiFlexGroup direction="column" gutterSize="xs" key={group.type}>
        {sectionHeader && (
          <EuiFlexItem>
            <EuiTitle size="s">
              <EuiText size="xs" color="subdued">
                {sectionHeader}
              </EuiText>
            </EuiTitle>
          </EuiFlexItem>
        )}
        <EuiFlexItem>
          {group.results.length ? (
            <EuiListGroup flush={true} gutterSize="none" maxWidth={false}>
              {group.results.map(({ commandId, result }) => (
                <EuiListGroupItem
                  key={`${commandId}:${result.id}`}
                  label={result.content}
                  aria-label={result.label}
                  href={result.href}
                  onClick={(event) => {
                    event.preventDefault();
                    executeResult(result);
                  }}
                  color="text"
                  style={{ padding: 0 }}
                />
              ))}
            </EuiListGroup>
          ) : (
            <EuiText color="subdued" size="xs">
              {i18n.translate('core.globalSearch.emptyResult.description', {
                defaultMessage: 'No results found.',
              })}
            </EuiText>
          )}
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  };

  const searchResultSections = (
    <>
      {resultGroups.length ? (
        <EuiFlexGroup direction="column" gutterSize="none">
          {resultGroups.map((group) => (
            <EuiFlexItem key={group.type}>{resultSection(group)}</EuiFlexItem>
          ))}
        </EuiFlexGroup>
      ) : (
        <EuiText color="subdued" size="xs">
          {i18n.translate('core.globalSearch.emptyResult.description', {
            defaultMessage: 'No results found.',
          })}
        </EuiText>
      )}
    </>
  );

  const onSearch = useCallback(
    async (value: string) => {
      if (enterKeyDownRef.current) {
        globalSearchCommands.forEach((command) => {
          command.action?.({
            content: value,
          });
        });
        enterKeyDownRef.current = false;
        setIsPopoverOpen(false);
        setSearchValue('');
        searchBarInputRef.current?.blur();
        return;
      }

      activeAbortControllerRef.current?.abort('Superseded by a newer global search');
      if (!value) {
        activeAbortControllerRef.current = undefined;
        setResultGroups([]);
        setIsLoading(false);
        return;
      }

      const abortController = new AbortController();
      activeAbortControllerRef.current = abortController;
      setIsPopoverOpen(true);
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
      setIsLoading(false);
      setResultGroups(groups);
    },
    [globalSearchCommands]
  );

  const showShortcutHint = commandPaletteAvailable && !searchValue;
  const searchBar = (
    <div className="osdHeaderSearchBar">
      <EuiFieldSearch
        compressed
        incremental
        onSearch={onSearch}
        fullWidth
        placeholder={
          globalSearchCommands.find((item) => item.inputPlaceholder)?.inputPlaceholder ??
          i18n.translate('core.globalSearch.input.placeholder', {
            defaultMessage: 'Search menu or assets',
          })
        }
        isLoading={isLoading}
        aria-label="Search the menus"
        data-test-subj="global-search-input"
        className="searchInput"
        onFocus={() => {
          setIsPopoverOpen(true);
        }}
        inputRef={(input) => {
          searchBarInputRef.current = input;
        }}
        style={{ paddingRight: 32 }}
        value={searchValue}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            enterKeyDownRef.current = true;
          }
        }}
        onChange={(e) => {
          setSearchValue(e.currentTarget.value);
        }}
      />
      {showShortcutHint && (
        <span
          className="osdHeaderSearchBar__shortcutHint"
          data-test-subj="global-search-command-palette-shortcut"
          aria-hidden="true"
        >
          {commandPaletteShortcutLabel}
        </span>
      )}
    </div>
  );

  const searchBarPanel = (
    <EuiPanel
      hasBorder={false}
      hasShadow={false}
      paddingSize="none"
      data-test-subj="search-result-panel"
    >
      <EuiFlexGroup direction="column" gutterSize="s">
        <EuiFlexItem>{searchBar}</EuiFlexItem>
        <EuiFlexItem>{searchResultSections}</EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );

  if (panel) {
    return searchBarPanel;
  }

  return (
    <>
      {!isPopoverOpen && searchBar}
      {isPopoverOpen && (
        <EuiPopover
          panelStyle={{ minWidth: '400px', minHeight: '100px' }}
          button={<></>}
          zIndex={2000}
          panelPaddingSize="s"
          attachToAnchor={true}
          ownFocus={true}
          display="block"
          isOpen={isPopoverOpen}
          closePopover={() => {
            closeSearch();
          }}
        >
          {searchBarPanel}
        </EuiPopover>
      )}
    </>
  );
};

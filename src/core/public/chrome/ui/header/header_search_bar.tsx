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
import React, { ReactNode, useCallback, useRef, useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  GlobalSearchCommand,
  SearchCommandKeyTypes,
  SearchCommandTypes,
} from '../../global_search';

interface Props {
  globalSearchCommands: GlobalSearchCommand[];
  panel?: boolean;
  onSearchResultClick?: () => void;
}

export const HeaderSearchBarIcon = ({ globalSearchCommands }: Props) => {
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

export const HeaderSearchBar = ({ globalSearchCommands, panel, onSearchResultClick }: Props) => {
  const [results, setResults] = useState([] as React.JSX.Element[]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const closePopover = () => {
    setIsPopoverOpen(false);
    setResults([]);
  };

  const resultSection = (items: ReactNode[], sectionHeader: string) => {
    return (
      <EuiFlexGroup direction="column" gutterSize="xs">
        <EuiFlexItem>
          <EuiTitle size="s">
            <EuiText size="xs" color="subdued">
              {sectionHeader}
            </EuiText>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem>
          {items.length ? (
            <EuiListGroup flush={true} gutterSize="none" maxWidth={false}>
              {items.map((item, index) => (
                <EuiListGroupItem key={index} label={item} color="text" />
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

  const searchResultSections =
    results && results.length ? (
      <EuiFlexGroup direction="column" gutterSize="none">
        {results.map((result) => (
          <EuiFlexItem key={result.key}>{result}</EuiFlexItem>
        ))}
      </EuiFlexGroup>
    ) : (
      <EuiText color="subdued" size="xs">
        {i18n.translate('core.globalSearch.emptyResult.description', {
          defaultMessage: 'No results found.',
        })}
      </EuiText>
    );

  const onSearch = useCallback(
    async (value: string) => {
      const filteredCommands = globalSearchCommands.filter((command) => {
        const alias = SearchCommandTypes[command.type].alias;
        return alias && value.startsWith(alias);
      });

      const defaultSearchCommands = globalSearchCommands.filter((command) => {
        return !SearchCommandTypes[command.type].alias;
      });

      if (filteredCommands.length === 0) {
        filteredCommands.push(...defaultSearchCommands);
      }

      if (value && filteredCommands && filteredCommands.length) {
        setIsPopoverOpen(true);
        setIsLoading(true);

        const settleResults = await Promise.allSettled(
          filteredCommands.map((command) => {
            const callback = onSearchResultClick || closePopover;
            const alias = SearchCommandTypes[command.type].alias;
            const queryValue = alias ? value.replace(alias, '').trim() : value;
            return command.run(queryValue, callback).then((items) => {
              return { items, type: command.type };
            });
          })
        );

        const searchResults = settleResults
          .filter((result) => result.status === 'fulfilled')
          .map(
            (result) =>
              (result as PromiseFulfilledResult<{
                items: ReactNode[];
                type: SearchCommandKeyTypes;
              }>).value
          )
          .reduce((acc, { items, type }) => {
            return {
              ...acc,
              [type]: (acc[type] || []).concat(items),
            };
          }, {} as Record<SearchCommandKeyTypes, ReactNode[]>);

        const sections = Object.entries(searchResults).map(([key, items]) => {
          const sectionHeader = SearchCommandTypes[key as SearchCommandKeyTypes].description;
          return resultSection(items, sectionHeader);
        });

        setIsLoading(false);
        setResults(sections);
      } else {
        setResults([]);
      }
    },
    [globalSearchCommands, onSearchResultClick]
  );

  const searchBar = (
    <EuiFieldSearch
      compressed
      incremental
      onSearch={onSearch}
      fullWidth
      placeholder={i18n.translate('core.globalSearch.input.placeholder', {
        defaultMessage: 'Search the menu',
      })}
      isLoading={isLoading}
      aria-label="Search the menus"
      data-test-subj="global-search-input"
      className="searchInput"
      onFocus={() => {
        setIsPopoverOpen(true);
      }}
    />
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
  } else {
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
              closePopover();
            }}
          >
            {searchBarPanel}
          </EuiPopover>
        )}
      </>
    );
  }
};

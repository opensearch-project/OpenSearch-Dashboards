/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButtonIcon,
  EuiFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiPopover,
  EuiResizeObserver,
  EuiText,
  EuiToolTip,
} from '@elastic/eui';
import React, { useCallback, useState } from 'react';
import { i18n } from '@osd/i18n';
import { SearchStrategy } from '../../global_search';

interface Props {
  searchStrategies: SearchStrategy[];
  panel?: boolean;
}

export const GlobalSearchBarIcon = ({ searchStrategies }: Props) => {
  const [isSearchBarOpen, setIsSearchBarOpen] = useState(false);
  return (
    <EuiPopover
      panelPaddingSize="s"
      anchorPosition="downCenter"
      repositionOnScroll={true}
      isOpen={isSearchBarOpen}
      closePopover={() => {
        setIsSearchBarOpen(false);
      }}
      button={
        <EuiToolTip
          content={i18n.translate('core.globalSearch.title', {
            defaultMessage: 'Search',
          })}
        >
          <EuiButtonIcon
            aria-label="search"
            iconType="search"
            color="text"
            onClick={() => {
              setIsSearchBarOpen(!isSearchBarOpen);
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
        <GlobalSearchBar searchStrategies={searchStrategies} panel />
      </EuiPanel>
    </EuiPopover>
  );
};

export const GlobalSearchBar = ({ searchStrategies, panel }: Props) => {
  const [results, setResults] = useState(undefined as React.JSX.Element[] | undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [panelWidth, setPanelWidth] = useState(0);
  const inputRef = (node: HTMLElement | null) => setInputEl(node);
  const [inputEl, setInputEl] = useState<HTMLElement | null>(null);

  const noResult = [
    <EuiText>
      {i18n.translate('core.globalSearch.result.empty.description', {
        defaultMessage: 'No results found.',
      })}
    </EuiText>,
  ];

  const onSearch = async (value: string) => {
    // do page search
    if (value) {
      setIsPopoverOpen(true);
      setIsLoading(true);
      const settleResults = await Promise.allSettled(
        searchStrategies.map((strategy) => strategy.doSearch(value))
      );

      // get results from results
      const searchResults = settleResults
        .filter((result) => result.status === 'fulfilled')
        .map((result: any) => result.value)
        .filter((result) => !!result);

      setIsLoading(false);
      setResults(searchResults.length > 0 ? searchResults : noResult);
    } else {
      setResults(undefined);
    }
  };

  const searchBar = (
    <EuiFieldSearch
      compressed
      incremental
      onSearch={onSearch}
      placeholder="Search the menu"
      isLoading={isLoading}
      aria-label="Search for menus"
      style={{ borderRadius: '8px', backgroundColor: 'transparent' }}
      onFocus={() => {
        if (inputEl) {
          const width = inputEl.getBoundingClientRect().width;
          setPanelWidth(width);
        }
      }}
    />
  );

  const onResize = useCallback(() => {
    if (inputEl) {
      const width = inputEl.getBoundingClientRect().width;
      setPanelWidth(width);
    }
  }, [inputEl, setPanelWidth]);

  if (panel) {
    return (
      <EuiPanel hasBorder={false} hasShadow={false} paddingSize="s">
        <EuiFlexGroup direction="column" gutterSize="s">
          <EuiFlexItem>{searchBar}</EuiFlexItem>
          <EuiFlexItem>
            <EuiFlexGroup direction="column" gutterSize="none">
              {results?.map((result) => (
                <EuiFlexItem key={result.key}>{result}</EuiFlexItem>
              ))}
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    );
  } else {
    return (
      <EuiPopover
        button={
          <EuiResizeObserver onResize={onResize}>
            {(resizeRef) => <div ref={resizeRef}>{searchBar}</div>}
          </EuiResizeObserver>
        }
        buttonRef={inputRef}
        panelStyle={{ minWidth: panelWidth }}
        zIndex={2000}
        panelPaddingSize="s"
        attachToAnchor={true}
        hasArrow={false}
        ownFocus={false}
        display="block"
        repositionOnScroll={false}
        isOpen={isPopoverOpen}
        closePopover={() => {
          setResults(undefined);
          setIsPopoverOpen(false);
        }}
      >
        <EuiFlexGroup direction="column">
          {results?.map((result) => (
            <EuiFlexItem key={result.key}>{result}</EuiFlexItem>
          ))}
        </EuiFlexGroup>
      </EuiPopover>
    );
  }
};

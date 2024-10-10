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
  EuiResizeObserver,
  EuiText,
  EuiTitle,
  EuiToolTip,
} from '@elastic/eui';
import React, { ReactNode, useCallback, useRef, useState } from 'react';
import { i18n } from '@osd/i18n';
import { GlobalSearchStrategy, SearchObjectTypes } from '../../global_search';

interface Props {
  globalSearchStrategies: GlobalSearchStrategy[];
  panel?: boolean;
  onSearchResultClick?: () => void;
}

export const HeaderSearchBarIcon = ({ globalSearchStrategies }: Props) => {
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
            data-test-subj="search-icon"
            onClick={() => {
              setIsSearchPopoverOpen(!isSearchPopoverOpen);
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
          globalSearchStrategies={globalSearchStrategies}
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

export const HeaderSearchBar = ({ globalSearchStrategies, panel, onSearchResultClick }: Props) => {
  const [results, setResults] = useState([] as React.JSX.Element[]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [panelWidth, setPanelWidth] = useState(0);
  const inputRef = (node: HTMLElement | null) => setInputEl(node);
  const [inputEl, setInputEl] = useState<HTMLElement | null>(null);

  const closePopover = () => {
    setIsPopoverOpen(false);
  };

  const pagesSection = (items: ReactNode[]) => {
    return (
      <EuiFlexGroup direction="column" gutterSize="xs">
        <EuiFlexItem>
          <EuiTitle size="s">
            <EuiText size="xs" color="subdued">
              {i18n.translate('core.globalSearch.pageSection.title', { defaultMessage: 'Pages' })}
            </EuiText>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem>
          {items.length ? (
            <EuiListGroup flush={true} gutterSize="none" maxWidth={false}>
              {items.map((item, index) => (
                <EuiListGroupItem key={index} label={item} size="s" />
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

  const searchResultSections = results && (
    <EuiFlexGroup direction="column" gutterSize="none">
      {results.map((result) => (
        <EuiFlexItem key={result.key}>{result}</EuiFlexItem>
      ))}
    </EuiFlexGroup>
  );

  const onSearch = async (value: string) => {
    // do page search
    if (value) {
      setIsPopoverOpen(true);
      setIsLoading(true);
      const settleResults = await Promise.allSettled(
        globalSearchStrategies.map((strategy) => {
          const callback = onSearchResultClick || closePopover;
          return strategy.doSearch(value, callback).then((items) => {
            return { items, type: strategy.type };
          });
        })
      );

      const searchResults = settleResults
        .filter((result) => result.status === 'fulfilled')
        .map(
          (result) =>
            (result as PromiseFulfilledResult<{ items: ReactNode[]; type: SearchObjectTypes }>)
              .value
        )
        .reduce((acc, { items, type }) => {
          return {
            ...acc,
            [type]: (acc[type] || []).concat(items),
          };
        }, {} as Record<SearchObjectTypes, ReactNode[]>);

      const sections = Object.entries(searchResults).map(([key, items]) => {
        switch (key) {
          case SearchObjectTypes.PAGES:
            return pagesSection(items);
        }
        return <></>;
      });

      setIsLoading(false);
      setResults(sections);
    } else {
      setResults([]);
    }
  };

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
      data-test-subj="search-input"
      className="searchInput"
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
      <EuiPanel
        hasBorder={false}
        hasShadow={false}
        paddingSize="s"
        data-test-subj="search-result-panel"
      >
        <EuiFlexGroup direction="column" gutterSize="s">
          <EuiFlexItem>{searchBar}</EuiFlexItem>
          <EuiFlexItem>{searchResultSections}</EuiFlexItem>
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
        ownFocus={false}
        display="block"
        isOpen={isPopoverOpen}
        closePopover={() => {
          setIsPopoverOpen(false);
        }}
      >
        {searchResultSections}
      </EuiPopover>
    );
  }
};

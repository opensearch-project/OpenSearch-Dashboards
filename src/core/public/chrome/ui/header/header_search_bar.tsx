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
import React, { ReactNode, useCallback, useState } from 'react';
import { i18n } from '@osd/i18n';
import { GlobalSearchStrategy, SearchObjectTypes } from '../../global_search';

interface Props {
  globalSearchStrategies: GlobalSearchStrategy[];
  panel?: boolean;
  onClick?: () => void;
}

export const HeaderSearchBarIcon = ({ globalSearchStrategies }: Props) => {
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
        <HeaderSearchBar
          globalSearchStrategies={globalSearchStrategies}
          panel
          onClick={() => setIsSearchBarOpen(false)}
        />
      </EuiPanel>
    </EuiPopover>
  );
};

export const HeaderSearchBar = ({ globalSearchStrategies, panel, onClick }: Props) => {
  const [results, setResults] = useState([] as React.JSX.Element[]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [panelWidth, setPanelWidth] = useState(0);
  const inputRef = (node: HTMLElement | null) => setInputEl(node);
  const [inputEl, setInputEl] = useState<HTMLElement | null>(null);

  const noResult = [
    <EuiText color="subdued" size="xs">
      {i18n.translate('core.globalSearch.result.empty.description', {
        defaultMessage: 'No results found.',
      })}
    </EuiText>,
  ];

  const closePopover = () => {
    setIsPopoverOpen(false);
  };

  const PagesSection = (items: ReactNode[]) => {
    return (
      <EuiFlexGroup direction="column" gutterSize="xs">
        <EuiFlexItem>
          <EuiTitle size="s">
            <EuiText size="xs" color="subdued">
              {i18n.translate('core.searchBar.pages.section.title', { defaultMessage: 'Pages' })}
            </EuiText>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem>
          {items.length ? (
            <EuiListGroup flush={true} gutterSize="none" maxWidth={false}>
              {items.map((item) => (
                <EuiListGroupItem label={item} size="s" />
              ))}
            </EuiListGroup>
          ) : (
            <EuiText color="subdued" size="xs">
              No results found.
            </EuiText>
          )}
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  };

  const onSearch = async (value: string) => {
    // do page search
    if (value) {
      setIsPopoverOpen(true);
      setIsLoading(true);
      const settleResults = await Promise.allSettled(
        globalSearchStrategies.map((strategy) => {
          const callback = onClick || closePopover;
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
            return PagesSection(items);
        }
        return <></>;
      });

      setIsLoading(false);
      setResults(sections.length > 0 ? sections : noResult);
    } else {
      setResults([]);
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
          setResults([]);
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

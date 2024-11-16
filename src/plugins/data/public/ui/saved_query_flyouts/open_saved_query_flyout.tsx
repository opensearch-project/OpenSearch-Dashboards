/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButton,
  EuiButtonEmpty,
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiLoadingSpinner,
  EuiSearchBar,
  EuiSearchBarProps,
  EuiSpacer,
  EuiTabbedContent,
  EuiTablePagination,
  EuiTitle,
  Pager,
} from '@elastic/eui';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { i18n } from '@osd/i18n';
import { QueryStringManager, SavedQuery, SavedQueryService } from '../../query';
import { SavedQueryCard } from './saved_query_card';
import { Query } from '../../../common';

export interface OpenSavedQueryFlyoutProps {
  savedQueryService: SavedQueryService;
  onClose: () => void;
  onQueryOpen: (query: SavedQuery) => void;
  handleQueryDelete: (query: SavedQuery) => Promise<void>;
  queryStringManager: QueryStringManager;
}

interface SavedQuerySearchableItem {
  id: string;
  title: string;
  description: string;
  language: string;
  datasetType?: string;
  savedQuery: SavedQuery;
}

export function OpenSavedQueryFlyout({
  savedQueryService,
  onClose,
  onQueryOpen,
  handleQueryDelete,
  queryStringManager,
}: OpenSavedQueryFlyoutProps) {
  const [selectedTabId, setSelectedTabId] = useState<string>('mutable-saved-queries');
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [hasTemplateQueries, setHasTemplateQueries] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const pager = useRef(new Pager(savedQueries.length, itemsPerPage));
  const [activePage, setActivePage] = useState(pager.current.getCurrentPageIndex());
  const [queriesOnCurrentPage, setQueriesOnCurrentPage] = useState<SavedQuerySearchableItem[]>([]);
  const [datasetTypeFilterOptions, setDatasetTypeFilterOptions] = useState<string[]>([]);
  const [languageFilterOptions, setLanguageFilterOptions] = useState<string[]>([]);
  const [selectedQuery, setSelectedQuery] = useState<SavedQuery | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState(EuiSearchBar.Query.MATCH_ALL);
  const [isLoading, setIsLoading] = useState(false);
  const currentTabIdRef = useRef(selectedTabId);

  const fetchAllSavedQueriesForSelectedTab = useCallback(async () => {
    setIsLoading(true);
    const query = queryStringManager.getQuery();
    let templateQueries: any[] = [];

    // fetch sample query based on dataset type
    if (query?.dataset?.type) {
      templateQueries =
        (await queryStringManager
          .getDatasetService()
          ?.getType(query.dataset.type)
          ?.getSampleQueries?.()) || [];

      // Check if any sample query has isTemplate set to true
      const hasTemplates = templateQueries.some((q) => q?.attributes?.isTemplate);
      setHasTemplateQueries(hasTemplates);
    }

    // Set queries based on the current tab
    if (currentTabIdRef.current === 'mutable-saved-queries') {
      const allQueries = await savedQueryService.getAllSavedQueries();
      const mutableSavedQueries = allQueries.filter((q) => !q.attributes.isTemplate);
      if (currentTabIdRef.current === 'mutable-saved-queries') {
        setSavedQueries(mutableSavedQueries);
      }
    } else if (currentTabIdRef.current === 'template-saved-queries') {
      setSavedQueries(templateQueries);
    }
    setIsLoading(false);
  }, [savedQueryService, currentTabIdRef, setSavedQueries, queryStringManager]);

  const updatePageIndex = useCallback((index: number) => {
    pager.current.goToPageIndex(index);
    setActivePage(index);
  }, []);

  useEffect(() => {
    fetchAllSavedQueriesForSelectedTab();
    setSearchQuery(EuiSearchBar.Query.MATCH_ALL);
    updatePageIndex(0);
  }, [selectedTabId, fetchAllSavedQueriesForSelectedTab, updatePageIndex]);

  useEffect(() => {
    const queryLanguages = new Set<string>();
    const queryDatasetTypes = new Set<string>();

    savedQueries.forEach((q) => {
      queryLanguages.add(q.attributes.query.language);
      if (q.attributes.query.dataset?.type) {
        queryDatasetTypes.add(q.attributes.query.dataset.type);
      }
    });
    setLanguageFilterOptions(Array.from(queryLanguages));
    setDatasetTypeFilterOptions(Array.from(queryDatasetTypes));
  }, [savedQueries]);

  useEffect(() => {
    const searchableItems = savedQueries.map((q) => ({
      id: q.id,
      title: q.attributes.title,
      description: q.attributes.description,
      language: q.attributes.query.language,
      datasetType: q.attributes.query.dataset?.type,
      savedQuery: q,
    }));

    const filteredSavedQueries = EuiSearchBar.Query.execute(searchQuery, searchableItems, {
      defaultFields: ['language', 'title', 'description', 'datasetType'],
    });
    pager.current.setTotalItems(filteredSavedQueries.length);
    setQueriesOnCurrentPage(
      filteredSavedQueries.slice(
        pager.current.getFirstItemIndex(),
        pager.current.getLastItemIndex() + 1
      )
    );
  }, [savedQueries, searchQuery, activePage, itemsPerPage]);

  const onChange: EuiSearchBarProps['onChange'] = ({ query, error }) => {
    if (!error) {
      setSearchQuery(query);
      updatePageIndex(0);
    }
  };

  const schema = {
    strict: true,
    fields: {
      title: {
        type: 'string',
      },
      description: {
        type: 'string',
      },
      language: {
        type: 'string',
      },
    },
  };

  const flyoutBodyContent = (
    <>
      <EuiSpacer />
      <EuiSearchBar
        compressed
        query={searchQuery}
        box={{
          placeholder: i18n.translate('data.openSavedQueryFlyout.searchBarPlaceholder', {
            defaultMessage: 'Search',
          }),
          incremental: true,
          schema,
        }}
        filters={[
          {
            type: 'field_value_selection',
            field: 'datasetType',
            name: 'Data type',
            multiSelect: 'or',
            options: datasetTypeFilterOptions.map((datasetType) => ({
              value: datasetType,
              view: datasetType.toUpperCase(),
            })),
          },
          {
            type: 'field_value_selection',
            field: 'language',
            name: 'Query language',
            multiSelect: 'or',
            options: languageFilterOptions.map((language) => ({
              value: language,
              view: language.toUpperCase(),
            })),
          },
        ]}
        onChange={onChange}
      />
      <EuiSpacer />
      {isLoading ? (
        <EuiFlexGroup justifyContent="center" alignItems="center" style={{ height: '200px' }}>
          <EuiFlexItem grow={false}>
            <EuiLoadingSpinner size="xl" />
          </EuiFlexItem>
        </EuiFlexGroup>
      ) : queriesOnCurrentPage.length > 0 ? (
        queriesOnCurrentPage.map((query) => (
          <SavedQueryCard
            key={query.id}
            savedQuery={query.savedQuery}
            selectedQuery={selectedQuery}
            onSelect={setSelectedQuery}
            handleQueryDelete={(queryToDelete) => {
              handleQueryDelete(queryToDelete).then(() => {
                fetchAllSavedQueriesForSelectedTab();
              });
            }}
          />
        ))
      ) : (
        <EuiEmptyPrompt
          title={
            <p>
              {i18n.translate('data.openSavedQueryFlyout.queryTable.noQueryFoundText', {
                defaultMessage: 'No saved query found.',
              })}
            </p>
          }
        />
      )}
      <EuiSpacer />
      {!isLoading && queriesOnCurrentPage.length > 0 && (
        <EuiTablePagination
          itemsPerPageOptions={[5, 10, 20]}
          itemsPerPage={itemsPerPage}
          activePage={pager.current.getCurrentPageIndex()}
          pageCount={pager.current.getTotalPages()}
          onChangeItemsPerPage={(pageSize) => {
            pager.current.setItemsPerPage(pageSize);
            setItemsPerPage(pageSize);
          }}
          onChangePage={(pageIndex) => {
            updatePageIndex(pageIndex);
          }}
        />
      )}
    </>
  );

  const tabs = [
    {
      id: 'mutable-saved-queries',
      name: 'Saved queries',
      content: flyoutBodyContent,
    },
  ];

  if (hasTemplateQueries) {
    tabs.push({
      id: 'template-saved-queries',
      name: 'Templates',
      content: flyoutBodyContent,
    });
  }

  return (
    <EuiFlyout onClose={onClose}>
      <EuiFlyoutHeader hasBorder>
        <EuiTitle>
          <h3>Saved queries</h3>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <EuiTabbedContent
          tabs={tabs}
          initialSelectedTab={tabs[0]}
          onTabClick={(tab) => {
            setSelectedTabId(tab.id);
            currentTabIdRef.current = tab.id;
          }}
        />
      </EuiFlyoutBody>
      <EuiFlyoutFooter>
        <EuiFlexGroup gutterSize="s" justifyContent="spaceBetween">
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty iconType={'cross'} color="danger" iconSide="left" onClick={onClose}>
              Cancel
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              disabled={!selectedQuery}
              fill
              onClick={() => {
                if (selectedQuery) {
                  if (
                    // Template queries are not associated with data sources. Apply data source from current query
                    selectedQuery.attributes.isTemplate
                  ) {
                    const updatedQuery: Query = {
                      ...queryStringManager?.getQuery(),
                      query: selectedQuery.attributes.query.query,
                      language: selectedQuery.attributes.query.language,
                    };
                    queryStringManager.setQuery(updatedQuery);
                  } else {
                    onQueryOpen(selectedQuery);
                  }
                  onClose();
                }
              }}
            >
              Open query
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutFooter>
    </EuiFlyout>
  );
}

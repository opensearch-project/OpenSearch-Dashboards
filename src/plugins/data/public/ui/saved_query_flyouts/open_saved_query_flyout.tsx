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
  copyToClipboard,
} from '@elastic/eui';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { i18n } from '@osd/i18n';
import { NotificationsStart } from 'opensearch-dashboards/public';
import { SavedQuery, SavedQueryService } from '../../query';
import { SavedQueryCard } from './saved_query_card';
import { getQueryService } from '../../services';

export interface OpenSavedQueryFlyoutProps {
  savedQueryService: SavedQueryService;
  notifications?: NotificationsStart;
  onClose: () => void;
  onQueryOpen: (query: SavedQuery) => void;
  handleQueryDelete: (query: SavedQuery) => Promise<void>;
}

interface SavedQuerySearchableItem {
  id: string;
  title: string;
  description: string;
  language: string;
  datasetType?: string;
  savedQuery: SavedQuery;
}

enum OPEN_QUERY_TAB_ID {
  SAVED_QUERIES = 'saved-queries',
  QUERY_TEMPLATES = 'query-templates',
}

export function OpenSavedQueryFlyout({
  savedQueryService,
  notifications,
  onClose,
  onQueryOpen,
  handleQueryDelete,
}: OpenSavedQueryFlyoutProps) {
  const [selectedTabId, setSelectedTabId] = useState<OPEN_QUERY_TAB_ID>(
    OPEN_QUERY_TAB_ID.SAVED_QUERIES
  );
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
  const queryStringManager = getQueryService().queryString;

  const fetchAllSavedQueriesForSelectedTab = useCallback(async () => {
    setIsLoading(true);
    try {
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
      if (currentTabIdRef.current === OPEN_QUERY_TAB_ID.SAVED_QUERIES) {
        const allQueries = await savedQueryService.getAllSavedQueries();
        const mutableSavedQueries = allQueries.filter((q) => !q.attributes.isTemplate);
        if (currentTabIdRef.current === OPEN_QUERY_TAB_ID.SAVED_QUERIES) {
          setSavedQueries(mutableSavedQueries);
        }
      } else if (currentTabIdRef.current === OPEN_QUERY_TAB_ID.QUERY_TEMPLATES) {
        setSavedQueries(templateQueries);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Error occurred while retrieving saved queries.', e);
    } finally {
      setIsLoading(false);
    }
  }, [savedQueryService, currentTabIdRef, setSavedQueries, queryStringManager]);

  const updatePageIndex = useCallback((index: number) => {
    pager.current.goToPageIndex(index);
    setActivePage(index);
  }, []);

  useEffect(() => {
    fetchAllSavedQueriesForSelectedTab();
    setSearchQuery(EuiSearchBar.Query.MATCH_ALL);
    updatePageIndex(0);
    setSelectedQuery(undefined);
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
      id: OPEN_QUERY_TAB_ID.SAVED_QUERIES,
      name: 'Saved queries',
      content: flyoutBodyContent,
    },
  ];

  if (hasTemplateQueries) {
    tabs.push({
      id: OPEN_QUERY_TAB_ID.QUERY_TEMPLATES,
      name: 'Templates',
      content: flyoutBodyContent,
    });
  }

  const onQueryAction = useCallback(() => {
    if (!selectedQuery) {
      return;
    }

    if (selectedQuery?.attributes.isTemplate) {
      copyToClipboard(selectedQuery.attributes.query.query as string);
      notifications?.toasts.addSuccess({
        title: i18n.translate('data.openSavedQueryFlyout.queryCopied.title', {
          defaultMessage: 'Query copied',
        }),
        text: i18n.translate('data.openSavedQueryFlyout.queryCopied.text', {
          defaultMessage: 'Paste the query in the editor to modify and run.',
        }),
      });
    } else {
      onQueryOpen({
        ...selectedQuery,
        attributes: {
          ...selectedQuery.attributes,
          query: {
            ...selectedQuery.attributes.query,
            dataset: queryStringManager.getQuery().dataset,
          },
        },
      });
    }

    onClose();
  }, [onClose, onQueryOpen, notifications, selectedQuery, queryStringManager]);

  return (
    <EuiFlyout onClose={onClose}>
      <EuiFlyoutHeader hasBorder>
        <EuiTitle>
          <h3>Saved queries</h3>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody data-test-subj="savedQueriesFlyoutBody">
        <EuiTabbedContent
          tabs={tabs}
          initialSelectedTab={tabs[0]}
          onTabClick={(tab) => {
            setSelectedTabId(tab.id as OPEN_QUERY_TAB_ID);
            currentTabIdRef.current = tab.id as OPEN_QUERY_TAB_ID;
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
              onClick={onQueryAction}
              data-testid="open-query-action-button"
              data-test-subj="open-query-action-button"
            >
              {selectedTabId === OPEN_QUERY_TAB_ID.SAVED_QUERIES ? 'Open' : 'Copy'} query
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutFooter>
    </EuiFlyout>
  );
}

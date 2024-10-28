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
import { SavedQuery, SavedQueryService } from '../../query';
import { SavedQueryCard } from './saved_query_card';

export interface OpenSavedQueryFlyoutProps {
  savedQueryService: SavedQueryService;
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

export function OpenSavedQueryFlyout({
  savedQueryService,
  onClose,
  onQueryOpen,
  handleQueryDelete,
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

  const fetchAllSavedQueriesForSelectedTab = useCallback(async () => {
    const allQueries = await savedQueryService.getAllSavedQueries();
    const templateQueriesPresent = allQueries.some((q) => q.attributes.isTemplate);
    const queriesForSelectedTab = allQueries.filter(
      (q) =>
        (selectedTabId === 'mutable-saved-queries' && !q.attributes.isTemplate) ||
        (selectedTabId === 'template-saved-queries' && q.attributes.isTemplate)
    );
    setSavedQueries(queriesForSelectedTab);
    setHasTemplateQueries(templateQueriesPresent);
  }, [savedQueryService, selectedTabId, setSavedQueries]);

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
      {queriesOnCurrentPage.length > 0 ? (
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
      {queriesOnCurrentPage.length > 0 && (
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
                  onQueryOpen(selectedQuery);
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

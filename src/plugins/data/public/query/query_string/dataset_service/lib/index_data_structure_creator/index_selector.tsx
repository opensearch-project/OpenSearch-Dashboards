/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  EuiFieldText,
  EuiInMemoryTable,
  EuiBadge,
  EuiSpacer,
  EuiText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLoadingSpinner,
  EuiEmptyPrompt,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { debounce } from 'lodash';
import {
  DataStructure,
  DATA_STRUCTURE_META_TYPES,
  DataStructureCustomMeta,
} from '../../../../../../common';
import { fetchIndicesByPattern } from '../index_type';
import './index_selector.scss';

interface IndexSelectorProps {
  children: DataStructure[] | undefined;
  selectedIndexId: string | null;
  isFinal: boolean;
  onSelectionChange: (selectedId: string | null) => void;
  onSearchQueryChange?: (query: string) => void;
  httpService?: any; // HTTP service for dynamic search
}

export const IndexSelector: React.FC<IndexSelectorProps> = ({
  children,
  selectedIndexId,
  isFinal,
  onSelectionChange,
  onSearchQueryChange,
  httpService,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [dynamicIndices, setDynamicIndices] = useState<DataStructure[]>([]);
  const [appendedWildcard, setAppendedWildcard] = useState(false);

  // Dynamic search function
  const performSearch = useCallback(
    async (query: string) => {
      if (!query || query.length < 1) {
        setDynamicIndices([]);
        setIsSearching(false);
        return;
      }

      try {
        // Find data source from current children
        const firstChild = children?.[0];

        if (!firstChild) {
          setDynamicIndices([]);
          return;
        }

        // Extract data source ID from the child ID (format: dataSourceId::indexName)
        const dataSourceId = firstChild.id.includes('::') ? firstChild.id.split('::')[0] : 'local';

        // Create mock data source structure for search
        const dataSource = {
          id: dataSourceId,
          type: 'DATA_SOURCE',
          title: dataSourceId,
        };

        // Create pattern for search - add wildcard if not present
        const searchPattern = query.includes('*') ? query : `${query}*`;

        if (httpService) {
          const matchedIndices = await fetchIndicesByPattern(
            dataSource,
            httpService,
            searchPattern
          );

          // Convert to DataStructure format
          const indexStructures: DataStructure[] = matchedIndices.map((matchedIndex) => ({
            id: `${dataSourceId}::${matchedIndex.name}`,
            title: matchedIndex.name,
            type: 'INDEX',
            meta: {
              type: DATA_STRUCTURE_META_TYPES.CUSTOM,
              isRemoteIndex: matchedIndex.isRemoteIndex,
              indexType: matchedIndex.indexType,
            },
          }));

          setDynamicIndices(indexStructures);
        } else {
          setDynamicIndices([]);
        }
      } catch (error) {
        setDynamicIndices([]);
      } finally {
        setIsSearching(false);
      }
    },
    [children, httpService]
  );

  // Debounced search (500ms to match explore plugin standards)
  const debouncedSearch = useMemo(() => debounce((query: string) => performSearch(query), 500), [
    performSearch,
  ]);

  const canAppendWildcard = (query: string) => {
    return /^[a-zA-Z0-9]$/.test(query);
  };

  const allIndices = useMemo(() => {
    if (searchQuery && searchQuery.length >= 1) {
      if (dynamicIndices.length > 0) {
        return dynamicIndices;
      }

      if (selectedIndexId) {
        const selectedIndex = (children || []).find((child) => child.id === selectedIndexId);
        return selectedIndex ? [selectedIndex] : [];
      }

      return dynamicIndices;
    }
    return children || [];
  }, [searchQuery, dynamicIndices, children, selectedIndexId]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { target } = e;
      let query = target.value;

      // Auto-append wildcard when user types a single alphanumeric character
      if (query.length === 1 && canAppendWildcard(query)) {
        query += '*';
        setAppendedWildcard(true);
        // Position cursor before the wildcard for continued typing
        setTimeout(() => target.setSelectionRange(1, 1));
      } else {
        // Remove wildcard if user backspaced to just '*'
        if (query === '*' && appendedWildcard) {
          query = '';
          setAppendedWildcard(false);
        }
      }

      setSearchQuery(query);

      // Always clear selection when search query changes or is cleared
      if (selectedIndexId && (query !== searchQuery || !query)) {
        onSelectionChange(null);
      }

      // Notify parent of search query change
      if (onSearchQueryChange) {
        onSearchQueryChange(query);
      }

      // Set loading state immediately for any non-empty query
      if (query && query.length > 0) {
        setIsSearching(true);
      }

      debouncedSearch(query);
    },
    [
      appendedWildcard,
      debouncedSearch,
      searchQuery,
      selectedIndexId,
      onSelectionChange,
      onSearchQueryChange,
    ]
  );

  const pagination = {
    initialPageSize: 10,
    pageSizeOptions: [5, 10, 20, 50],
  };

  const columns = [
    {
      field: 'title',
      name: 'Index',
      render: (title: string, index: DataStructure) => (
        <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
          <EuiFlexItem grow={true}>{highlightIndexName(title, searchQuery)}</EuiFlexItem>
          <EuiFlexItem grow={false}>{getIndexBadge(index)}</EuiFlexItem>
        </EuiFlexGroup>
      ),
    },
  ];

  // Helper function to highlight search terms in index names
  const highlightIndexName = (indexName: string, query: string) => {
    const queryWithoutWildcard = query.endsWith('*') ? query.substr(0, query.length - 1) : query;
    const queryIdx = indexName.indexOf(queryWithoutWildcard);

    if (!queryWithoutWildcard || queryIdx === -1) {
      return indexName;
    }

    const preStr = indexName.substr(0, queryIdx);
    const postStr = indexName.substr(queryIdx + queryWithoutWildcard.length);

    return (
      <span>
        {preStr}
        <strong>{queryWithoutWildcard}</strong>
        {postStr}
      </span>
    );
  };

  const getIndexBadge = (index: DataStructure) => {
    const customMeta = index.meta as DataStructureCustomMeta;

    // Check if it's a remote index first
    if (customMeta?.isRemoteIndex) {
      const indexType = customMeta?.indexType;
      switch (indexType) {
        case 'alias':
          return <EuiBadge color="warning">Remote Alias</EuiBadge>;
        case 'data_stream':
          return <EuiBadge color="warning">Remote Data Stream</EuiBadge>;
        default:
          return <EuiBadge color="warning">Remote Index</EuiBadge>;
      }
    }

    // Show local index types
    const indexType = customMeta?.indexType;
    switch (indexType) {
      case 'alias':
        return <EuiBadge color="primary">Alias</EuiBadge>;
      case 'data_stream':
        return <EuiBadge color="accent">Data Stream</EuiBadge>;
      default:
        return <EuiBadge color="default">Index</EuiBadge>;
    }
  };

  // Handle row click - replace search text with selected index name
  const handleRowClick = (indexId: string) => {
    const clickedIndex = allIndices.find((index) => index.id === indexId);
    if (clickedIndex) {
      // Replace search text with the index name (no wildcard)
      setSearchQuery(clickedIndex.title);
      setAppendedWildcard(false);

      // Notify parent of search query change to update UI
      if (onSearchQueryChange) {
        onSearchQueryChange(clickedIndex.title);
      }

      onSelectionChange(indexId);
    }
  };

  return (
    <div data-test-subj="dataset-index-selector">
      <EuiFieldText
        placeholder={i18n.translate('data.datasetService.indexSelector.searchPlaceholder', {
          defaultMessage: 'Search for indices (e.g., logstash-*)',
        })}
        value={searchQuery}
        onChange={handleInputChange}
        fullWidth
      />

      <EuiSpacer size="m" />

      {searchQuery && allIndices.length > 1 && !selectedIndexId && searchQuery.includes('*') && (
        <>
          <EuiText size="s" color="subdued">
            {i18n.translate('data.datasetService.indexSelector.matchingIndices', {
              defaultMessage:
                'Your index pattern matches {count} {count, plural, one {source} other {sources}}.',
              values: { count: allIndices.length },
            })}
          </EuiText>
          <EuiSpacer size="s" />
          <EuiText size="s" color="subdued">
            {i18n.translate('data.datasetService.indexSelector.selectionOptions', {
              defaultMessage:
                'Use this pattern to include all matching indices, or select a specific index below:',
            })}
          </EuiText>
          <EuiSpacer size="m" />
        </>
      )}

      {searchQuery && isSearching && (
        <>
          <EuiFlexGroup alignItems="center" gutterSize="s" justifyContent="center">
            <EuiFlexItem grow={false}>
              <EuiLoadingSpinner size="m" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiText size="s" color="subdued">
                {i18n.translate('data.datasetService.indexSelector.searching', {
                  defaultMessage: 'Searching indices...',
                })}
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size="m" />
        </>
      )}

      {searchQuery && allIndices.length === 0 && !isSearching && (
        <>
          <EuiText size="s" color="subdued">
            {i18n.translate('data.datasetService.indexSelector.noMatches', {
              defaultMessage: 'No matching indices found.',
            })}
          </EuiText>
          <EuiSpacer size="m" />
        </>
      )}

      {allIndices.length > 0 ? (
        <EuiInMemoryTable
          itemId="id"
          items={allIndices}
          columns={columns}
          pagination={pagination}
          allowNeutralSort={false}
          hasActions={false}
          compressed={true}
          rowProps={(item: DataStructure) => ({
            onClick: () => handleRowClick(item.id),
            style: {
              cursor: 'pointer',
              backgroundColor: item.id === selectedIndexId ? '#F0F8FF' : 'transparent',
            },
            'data-test-subj': `index-row-${item.id}`,
          })}
        />
      ) : searchQuery && !isSearching ? (
        <EuiEmptyPrompt
          iconType="search"
          title={
            <h3>
              {i18n.translate('data.datasetService.indexSelector.noResults.title', {
                defaultMessage: 'No matching indices',
              })}
            </h3>
          }
          body={
            <p>
              {i18n.translate('data.datasetService.indexSelector.noResults.body', {
                defaultMessage: 'Try a different search term or check your index pattern.',
              })}
            </p>
          }
        />
      ) : null}
    </div>
  );
};

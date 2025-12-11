/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  EuiSelectable,
  EuiSelectableOption,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFieldText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { DataStructure } from '../../../../../../common';
import { IDataPluginServices } from '../../../../../types';
import './index_selector.scss';

interface ResolveIndexResponse {
  indices?: Array<{ name: string; attributes?: string[] }>;
  aliases?: Array<{ name: string }>;
  data_streams?: Array<{ name: string }>;
}

interface IndexSelectorProps {
  selectedIndexIds: string[];
  onMultiSelectionChange: (selectedIds: string[]) => void;
  services?: IDataPluginServices;
  path?: DataStructure[];
}

export const IndexSelector: React.FC<IndexSelectorProps> = ({
  selectedIndexIds,
  onMultiSelectionChange,
  services,
  path,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedInitial = useRef(false);

  const MAX_INITIAL_RESULTS = 100;

  // Fetch indices matching search using API
  const fetchIndices = useCallback(
    async (search: string, limit?: number) => {
      if (!services?.http || !search || search.trim() === '') {
        setSearchResults([]);
        setTotalCount(0);
        return;
      }

      try {
        setIsLoading(true);

        const dataSourceId = path?.find((item) => item.type === 'DATA_SOURCE')?.id;
        const query: any = {
          expand_wildcards: 'all',
        };

        if (dataSourceId && dataSourceId !== '') {
          query.data_source = dataSourceId;
        }

        // Use wildcard pattern for search
        const searchPattern = search.includes('*') ? search : `*${search}*`;

        const response = await services.http.get<ResolveIndexResponse>(
          `/internal/index-pattern-management/resolve_index/${encodeURIComponent(searchPattern)}`,
          { query }
        );

        if (!response) {
          setSearchResults([]);
          setTotalCount(0);
          return;
        }

        const indices: string[] = [];

        // Add regular indices
        if (response.indices) {
          response.indices.forEach((idx) => {
            indices.push(idx.name);
          });
        }

        // Add aliases
        if (response.aliases) {
          response.aliases.forEach((alias) => {
            indices.push(alias.name);
          });
        }

        // Add data streams
        if (response.data_streams) {
          response.data_streams.forEach((dataStream) => {
            indices.push(dataStream.name);
          });
        }

        const sortedIndices = indices.sort();
        setTotalCount(sortedIndices.length);

        // Apply limit if specified
        if (limit && sortedIndices.length > limit) {
          setSearchResults(sortedIndices.slice(0, limit));
        } else {
          setSearchResults(sortedIndices);
        }
      } catch (error) {
        setSearchResults([]);
        setTotalCount(0);
      } finally {
        setIsLoading(false);
      }
    },
    [services, path]
  );

  // Load initial results on mount
  useEffect(() => {
    if (!hasLoadedInitial.current && services?.http) {
      hasLoadedInitial.current = true;
      fetchIndices('*', MAX_INITIAL_RESULTS);
    }
  }, [services, fetchIndices]);

  // Debounced search
  useEffect(() => {
    if (!searchValue || searchValue.trim() === '') {
      // Reset to initial results when search is cleared
      if (hasLoadedInitial.current) {
        fetchIndices('*', MAX_INITIAL_RESULTS);
      }
      return;
    }

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer - no limit for user searches
    debounceTimerRef.current = setTimeout(() => {
      fetchIndices(searchValue);
    }, 300);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchValue, fetchIndices]);

  // Create options from search results
  const displayOptions: EuiSelectableOption[] = searchResults.map((indexName) => {
    const dataSourceId = path?.find((item) => item.type === 'DATA_SOURCE')?.id || 'local';
    const indexId = `${dataSourceId}::${indexName}`;

    return {
      label: indexName,
      key: indexId,
      checked: selectedIndexIds.includes(indexId) ? 'on' : undefined,
    };
  });

  const onChange = (newOptions: EuiSelectableOption[]) => {
    // Only update selections from the visible options, but preserve existing selections
    const visibleSelectedIds = newOptions
      .filter((option) => option.checked === 'on')
      .map((option) => option.key!)
      .filter(Boolean);

    // Keep existing selections that aren't in the current search results
    const existingHiddenSelections = selectedIndexIds.filter(
      (id) => !displayOptions.some((option) => option.key === id)
    );

    const finalSelectedIds = [...existingHiddenSelections, ...visibleSelectedIds];
    onMultiSelectionChange(finalSelectedIds);
  };

  const renderOption = (option: EuiSelectableOption) => {
    return (
      <EuiFlexGroup
        className="indexSelectorOption"
        gutterSize="s"
        alignItems="center"
        responsive={false}
      >
        <EuiFlexItem grow={true}>
          <span>{option.label}</span>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  };

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsPopoverOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={containerRef} className="indexSelector">
      {/* Always visible search field */}
      <EuiFieldText
        placeholder={i18n.translate('data.datasetService.indexSelector.searchPlaceholder', {
          defaultMessage: 'Search indices',
        })}
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onFocus={() => setIsPopoverOpen(true)}
        fullWidth
      />

      {/* Popover that appears over content */}
      {isPopoverOpen && (
        <div className="indexSelector__popover">
          {/* Show count message when results are limited */}
          {!searchValue && totalCount > MAX_INITIAL_RESULTS && (
            <div style={{ padding: '8px 12px', fontSize: '12px', color: '#69707D' }}>
              {i18n.translate('data.datasetService.indexSelector.limitedResultsMessage', {
                defaultMessage:
                  'Showing first {displayed} of {total} indices. Type to search for more.',
                values: { displayed: searchResults.length, total: totalCount },
              })}
            </div>
          )}
          <EuiSelectable
            data-test-subj="dataset-index-selector"
            options={displayOptions}
            onChange={onChange}
            renderOption={renderOption}
            searchable={false} // We handle search ourselves
            isLoading={isLoading}
            loadingMessage={i18n.translate('data.datasetService.indexSelector.loadingMessage', {
              defaultMessage: 'Loading indices...',
            })}
            emptyMessage={
              searchValue
                ? i18n.translate('data.datasetService.indexSelector.noResultsMessage', {
                    defaultMessage: 'No indices found matching "{search}"',
                    values: { search: searchValue },
                  })
                : i18n.translate('data.datasetService.indexSelector.loadingInitialMessage', {
                    defaultMessage: 'Loading indices...',
                  })
            }
            height={Math.min(300, displayOptions.length * 32 + 16)}
            listProps={{
              bordered: false,
              style: { maxHeight: '300px' },
            }}
          >
            {(list) => list}
          </EuiSelectable>
        </div>
      )}
    </div>
  );
};

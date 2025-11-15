/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo } from 'react';
import { EuiComboBox, EuiIcon, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { debounce } from 'lodash';
import { DataStructure, DATA_STRUCTURE_META_TYPES } from '../../../../../../common';
import { appendIcon } from './index_data_structure_creator_utils';
import { fetchIndicesByPattern } from '../index_type';
import './index_selector.scss';

interface IndexSelectorProps {
  children: DataStructure[] | undefined;
  selectedIndexId: string | null;
  isFinal: boolean;
  onSelectionChange: (selectedId: string | null) => void;
  httpService?: any; // HTTP service for dynamic search
}

export const IndexSelector: React.FC<IndexSelectorProps> = ({
  children,
  selectedIndexId,
  isFinal,
  onSelectionChange,
  httpService,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [dynamicIndices, setDynamicIndices] = useState<DataStructure[]>([]);

  // Dynamic search function
  const performSearch = useCallback(
    async (query: string) => {
      if (!query || query.length < 1) {
        setDynamicIndices([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);

      try {
        // Find data source from current children
        const firstChild = children?.[0];

        if (!firstChild) {
          setDynamicIndices([]);
          setIsSearching(false);
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
            },
          }));

          setDynamicIndices(indexStructures);
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

  // Handle search change
  const handleSearchChange = useCallback(
    (searchValue: string) => {
      setSearchQuery(searchValue);
      debouncedSearch(searchValue);
    },
    [debouncedSearch]
  );

  // Get combined options - use dynamic search results if searching, otherwise use static children
  const allIndices = useMemo(() => {
    if (searchQuery && searchQuery.length >= 1) {
      return dynamicIndices;
    }
    return children || [];
  }, [searchQuery, dynamicIndices, children]);

  const options = allIndices.map((child) => ({
    label: child.parent ? `${child.parent.title}::${child.title}` : child.title,
    value: child.id,
  }));

  const selectedOptions = allIndices
    .filter((child) => child.id === selectedIndexId)
    .map((child) => ({
      label: child.parent ? `${child.parent.title}::${child.title}` : child.title,
      value: child.id,
    }));

  return (
    <EuiComboBox
      data-test-subj="dataset-index-selector"
      placeholder={i18n.translate('data.datasetService.indexSelector.searchAndSelectPlaceholder', {
        defaultMessage: 'Search and select an index',
      })}
      options={options}
      selectedOptions={selectedOptions}
      onChange={(newSelectedOptions) => {
        if (newSelectedOptions.length > 0) {
          const selectedValue = newSelectedOptions[0].value;
          onSelectionChange(selectedValue || null);
        } else {
          onSelectionChange(null);
        }
      }}
      onSearchChange={handleSearchChange}
      isLoading={isSearching}
      async
      renderOption={(option) => {
        const child = allIndices.find((c) => c.id === option.value);
        if (!child) return <span>{option.label}</span>;

        const prependIcon = child.meta?.type === DATA_STRUCTURE_META_TYPES.TYPE &&
          child.meta?.icon && <EuiIcon {...child.meta.icon} />;
        const appendIconElement = appendIcon(child);

        return (
          <EuiFlexGroup
            className="indexSelectorOption"
            gutterSize="s"
            alignItems="center"
            responsive={false}
          >
            {prependIcon && <EuiFlexItem grow={false}>{prependIcon}</EuiFlexItem>}
            <EuiFlexItem grow={true}>
              <span>{option.label}</span>
            </EuiFlexItem>
            {appendIconElement && <EuiFlexItem grow={false}>{appendIconElement}</EuiFlexItem>}
          </EuiFlexGroup>
        );
      }}
      singleSelection
      fullWidth
      {...(isFinal && {
        isLoading: false,
      })}
    />
  );
};

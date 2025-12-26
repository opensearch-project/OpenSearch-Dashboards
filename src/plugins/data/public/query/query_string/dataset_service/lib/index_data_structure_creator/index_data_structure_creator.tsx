/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  EuiSpacer,
  EuiText,
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiHealth,
  EuiLoadingSpinner,
  EuiButtonEmpty,
  EuiSelectable,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import {
  DataStructureCreatorProps,
  DataStructure,
  DATA_STRUCTURE_META_TYPES,
} from '../../../../../../common';
import { IDataPluginServices } from '../../../../../types';
import { UnifiedIndexSelector } from './unified_index_selector';
import { useIndexFetcher } from './use_index_fetcher';
import './index_data_structure_creator.scss';

interface IndexDataStructureCreatorProps extends DataStructureCreatorProps {
  services?: IDataPluginServices;
}

interface SelectedItem {
  id: string;
  title: string;
  isWildcard: boolean;
}

interface IndexHealth {
  health: string;
  status: string;
  index: string;
  'docs.count': string;
  'store.size': string;
}

export const IndexDataStructureCreator: React.FC<IndexDataStructureCreatorProps> = ({
  path,
  index,
  selectDataStructure,
  services,
}) => {
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [selectedBadgeIndex, setSelectedBadgeIndex] = useState<number>(0);
  const [indexHealthData, setIndexHealthData] = useState<IndexHealth | null>(null);
  const [matchingIndicesForWildcard, setMatchingIndicesForWildcard] = useState<string[]>([]);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);
  const [clickedMatchingIndex, setClickedMatchingIndex] = useState<string | null>(null);
  const [matchingIndexHealth, setMatchingIndexHealth] = useState<IndexHealth | null>(null);

  // Use shared hook for fetching indices
  const { fetchIndices } = useIndexFetcher({ services, path });

  // Fetch index health information
  const fetchIndexHealth = useCallback(
    async (indexName: string) => {
      if (!services?.http) return;

      setIsLoadingHealth(true);
      try {
        const dataSourceId = path?.find((item) => item.type === 'DATA_SOURCE')?.id;

        const queryParams: Record<string, any> = {
          path: `_cat/indices/${encodeURIComponent(
            indexName
          )}?format=json&h=health,status,index,docs.count,store.size`,
          method: 'GET',
        };

        if (dataSourceId) {
          queryParams.dataSourceId = dataSourceId;
        }

        const response = await services.http.post<any>(`/api/console/proxy`, {
          query: queryParams,
          body: '',
        });

        if (response && Array.isArray(response) && response.length > 0) {
          setIndexHealthData(response[0]);
        } else {
          setIndexHealthData(null);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching index health:', error);
        setIndexHealthData(null);
      } finally {
        setIsLoadingHealth(false);
      }
    },
    [services, path]
  );

  // Fetch health for matching index
  const fetchMatchingIndexHealth = useCallback(
    async (indexName: string) => {
      if (!services?.http) return;

      try {
        const dataSourceId = path?.find((item) => item.type === 'DATA_SOURCE')?.id;

        const queryParams: Record<string, any> = {
          path: `_cat/indices/${encodeURIComponent(
            indexName
          )}?format=json&h=health,status,index,docs.count,store.size`,
          method: 'GET',
        };

        if (dataSourceId) {
          queryParams.dataSourceId = dataSourceId;
        }

        const response = await services.http.post<any>(`/api/console/proxy`, {
          query: queryParams,
          body: '',
        });

        if (response && Array.isArray(response) && response.length > 0) {
          setMatchingIndexHealth(response[0]);
        } else {
          setMatchingIndexHealth(null);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching matching index health:', error);
        setMatchingIndexHealth(null);
      }
    },
    [services, path]
  );

  // Fetch matching indices for wildcard pattern
  const fetchMatchingIndicesForPattern = useCallback(
    async (pattern: string) => {
      if (!pattern || !pattern.includes('*')) {
        setMatchingIndicesForWildcard([]);
        return;
      }

      try {
        const allIndices = await fetchIndices({
          patterns: [pattern],
          limit: undefined,
        });
        setMatchingIndicesForWildcard(allIndices);
      } catch (error) {
        setMatchingIndicesForWildcard([]);
      }
    },
    [fetchIndices]
  );

  // Update health data when selected badge changes
  useEffect(() => {
    if (selectedItems.length === 0) {
      setIndexHealthData(null);
      setMatchingIndicesForWildcard([]);
      setClickedMatchingIndex(null);
      setMatchingIndexHealth(null);
      return;
    }

    const selectedItem = selectedItems[selectedBadgeIndex];
    if (!selectedItem) return;

    if (selectedItem.isWildcard) {
      // Fetch matching indices for wildcard
      fetchMatchingIndicesForPattern(selectedItem.title);
      setIndexHealthData(null);
    } else {
      // Fetch health for exact index
      fetchIndexHealth(selectedItem.title);
      setMatchingIndicesForWildcard([]);
      setClickedMatchingIndex(null);
      setMatchingIndexHealth(null);
    }
  }, [selectedBadgeIndex, selectedItems, fetchIndexHealth, fetchMatchingIndicesForPattern]);

  // Auto-select first matching index when list is populated
  useEffect(() => {
    if (matchingIndicesForWildcard.length > 0) {
      const firstIndex = matchingIndicesForWildcard[0];
      setClickedMatchingIndex(firstIndex);
      fetchMatchingIndexHealth(firstIndex);
    }
  }, [matchingIndicesForWildcard, fetchMatchingIndexHealth]);

  // Handle selection changes from unified selector
  const handleSelectionChange = useCallback(
    (items: SelectedItem[]) => {
      setSelectedItems(items);

      if (items.length === 0) {
        // Clear selection when no items selected
        selectDataStructure(undefined, path.slice(0, index + 1));
        return;
      }

      // Create a combined data structure
      const dataSourceId = path.find((item) => item.type === 'DATA_SOURCE')?.id || 'local';
      const titles = items.map((item) => item.title);
      const hasWildcard = items.some((item) => item.isWildcard);
      const exactIndices = items.filter((item) => !item.isWildcard);
      const wildcardItems = items.filter((item) => item.isWildcard);

      const combinedDataStructure: DataStructure = {
        id: `${dataSourceId}::${titles.join(',')}`,
        title: titles.join(','),
        type: 'INDEX',
        meta: {
          type: DATA_STRUCTURE_META_TYPES.CUSTOM,
          ...(hasWildcard
            ? {
                isMultiWildcard: true,
                wildcardPatterns: wildcardItems.map((item) => item.title),
                // Include exact indices if there are any
                ...(exactIndices.length > 0 && {
                  selectedIndices: exactIndices.map((item) => item.id),
                  selectedTitles: exactIndices.map((item) => item.title),
                }),
              }
            : {
                isMultiIndex: true,
                selectedIndices: items.map((item) => item.id),
                selectedTitles: titles,
              }),
        },
      };

      selectDataStructure(combinedDataStructure, path.slice(0, index + 1));
    },
    [path, index, selectDataStructure]
  );

  const handleRemoveItem = (indexToRemove: number) => {
    const newItems = selectedItems.filter((_, itemIndex) => itemIndex !== indexToRemove);
    handleSelectionChange(newItems);

    // Adjust selected badge index if needed
    if (selectedBadgeIndex >= newItems.length && newItems.length > 0) {
      setSelectedBadgeIndex(newItems.length - 1);
    } else if (newItems.length === 0) {
      setSelectedBadgeIndex(0);
    }
  };

  return (
    <div className="indexDataStructureCreator">
      {/* Search bar - full width */}
      <UnifiedIndexSelector
        selectedItems={selectedItems}
        onSelectionChange={handleSelectionChange}
        services={services}
        path={path}
      />

      <EuiSpacer size="m" />

      {/* Selected items and health panel */}
      {selectedItems.length > 0 && (
        <EuiFlexGroup gutterSize="m" alignItems="flexStart" responsive={false}>
          {/* Left: Selected items using EuiSelectable */}
          <EuiFlexItem grow={true} style={{ minWidth: 0, flexBasis: '55%' }}>
            <EuiText size="s">
              <strong>
                {i18n.translate('data.datasetService.unifiedSelector.selectedItemsLabel', {
                  defaultMessage: 'Selected:',
                })}
              </strong>
            </EuiText>
            <EuiSpacer size="xs" />
            <div className="indexDataStructureCreator__selectedList">
              <EuiSelectable
                options={selectedItems.map((item, itemIndex) => ({
                  label: item.title,
                  key: item.id,
                  checked: selectedBadgeIndex === itemIndex ? 'on' : undefined,
                  append: (
                    <EuiButtonEmpty
                      size="xs"
                      iconType="cross"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveItem(itemIndex);
                      }}
                      aria-label={i18n.translate('data.datasetService.unifiedSelector.removeItem', {
                        defaultMessage: 'Remove {item}',
                        values: { item: item.title },
                      })}
                    />
                  ),
                }))}
                onChange={(newOptions) => {
                  const clickedIndex = newOptions.findIndex((opt) => opt.checked === 'on');
                  if (clickedIndex >= 0 && clickedIndex !== selectedBadgeIndex) {
                    setSelectedBadgeIndex(clickedIndex);
                  }
                }}
                singleSelection="always"
                searchable={false}
                height="full"
                listProps={{
                  bordered: true,
                }}
              >
                {(list) => list}
              </EuiSelectable>
            </div>
          </EuiFlexItem>

          {/* Right: Health/Matches panel */}
          {selectedItems[selectedBadgeIndex] && (
            <EuiFlexItem grow={false} style={{ minWidth: 0, flexBasis: '35%', maxWidth: '300px' }}>
              <EuiText size="s">
                <strong>&nbsp;</strong>
              </EuiText>
              <EuiSpacer size="xs" />
              <EuiPanel hasBorder>
                {isLoadingHealth ? (
                  <EuiFlexGroup justifyContent="center">
                    <EuiFlexItem grow={false}>
                      <EuiLoadingSpinner size="m" />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                ) : selectedItems[selectedBadgeIndex].isWildcard ? (
                  // Show matching indices for wildcard
                  <>
                    <EuiText size="s" color="subdued">
                      {matchingIndicesForWildcard.length > 0 ? (
                        <FormattedMessage
                          id="data.datasetService.unifiedSelector.matchingCount"
                          defaultMessage="{count} {count, plural, one {index} other {indices}} match this pattern"
                          values={{ count: matchingIndicesForWildcard.length }}
                        />
                      ) : (
                        <FormattedMessage
                          id="data.datasetService.unifiedSelector.noMatchingIndices"
                          defaultMessage="No indices match this pattern"
                        />
                      )}
                    </EuiText>
                    {matchingIndicesForWildcard.length > 0 && (
                      <>
                        <EuiSpacer size="s" />
                        <div style={{ height: '20vh' }}>
                          <EuiSelectable
                            options={matchingIndicesForWildcard.map((indexName) => ({
                              label: indexName,
                              key: indexName,
                              checked: clickedMatchingIndex === indexName ? 'on' : undefined,
                            }))}
                            onChange={(newOptions) => {
                              const selected = newOptions.find((opt) => opt.checked === 'on');
                              if (
                                selected &&
                                selected.label &&
                                clickedMatchingIndex !== selected.label
                              ) {
                                // Clicking a new item - fetch its health
                                setClickedMatchingIndex(selected.label);
                                fetchMatchingIndexHealth(selected.label);
                              }
                            }}
                            singleSelection="always"
                            searchable={false}
                            height="full"
                            listProps={{
                              bordered: true,
                            }}
                          >
                            {(list) => list}
                          </EuiSelectable>
                        </div>
                        {clickedMatchingIndex && matchingIndexHealth && (
                          <>
                            <EuiSpacer size="s" />
                            <EuiPanel color="subdued" style={{ padding: '12px' }}>
                              <EuiTitle size="xxs">
                                <h5>{clickedMatchingIndex}</h5>
                              </EuiTitle>
                              <EuiSpacer size="xs" />
                              <EuiFlexGroup gutterSize="s" alignItems="center">
                                <EuiFlexItem grow={false}>
                                  <EuiText size="xs">
                                    <strong>Health:</strong>
                                  </EuiText>
                                </EuiFlexItem>
                                <EuiFlexItem grow={false}>
                                  <EuiHealth
                                    color={
                                      matchingIndexHealth.health === 'green'
                                        ? 'success'
                                        : matchingIndexHealth.health === 'yellow'
                                        ? 'warning'
                                        : 'danger'
                                    }
                                  >
                                    {matchingIndexHealth.health}
                                  </EuiHealth>
                                </EuiFlexItem>
                              </EuiFlexGroup>
                              <EuiText size="xs">
                                <strong>Status:</strong> {matchingIndexHealth.status}
                              </EuiText>
                              <EuiText size="xs">
                                <strong>Documents:</strong>{' '}
                                {matchingIndexHealth['docs.count'] || '0'}
                              </EuiText>
                              <EuiText size="xs">
                                <strong>Size:</strong> {matchingIndexHealth['store.size'] || 'N/A'}
                              </EuiText>
                            </EuiPanel>
                          </>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  // Show health info for exact index
                  <>
                    {indexHealthData ? (
                      <EuiPanel color="subdued" style={{ padding: '12px' }}>
                        <EuiTitle size="xxs">
                          <h5>{selectedItems[selectedBadgeIndex].title}</h5>
                        </EuiTitle>
                        <EuiSpacer size="xs" />
                        <EuiFlexGroup gutterSize="s" alignItems="center">
                          <EuiFlexItem grow={false}>
                            <EuiText size="xs">
                              <strong>Health:</strong>
                            </EuiText>
                          </EuiFlexItem>
                          <EuiFlexItem grow={false}>
                            <EuiHealth
                              color={
                                indexHealthData.health === 'green'
                                  ? 'success'
                                  : indexHealthData.health === 'yellow'
                                  ? 'warning'
                                  : 'danger'
                              }
                            >
                              {indexHealthData.health}
                            </EuiHealth>
                          </EuiFlexItem>
                        </EuiFlexGroup>
                        <EuiText size="xs">
                          <strong>Status:</strong> {indexHealthData.status}
                        </EuiText>
                        <EuiText size="xs">
                          <strong>Documents:</strong> {indexHealthData['docs.count'] || '0'}
                        </EuiText>
                        <EuiText size="xs">
                          <strong>Size:</strong> {indexHealthData['store.size'] || 'N/A'}
                        </EuiText>
                      </EuiPanel>
                    ) : (
                      <EuiText size="s" color="subdued">
                        <FormattedMessage
                          id="data.datasetService.unifiedSelector.noHealthData"
                          defaultMessage="Unable to fetch health data"
                        />
                      </EuiText>
                    )}
                  </>
                )}
              </EuiPanel>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      )}
    </div>
  );
};

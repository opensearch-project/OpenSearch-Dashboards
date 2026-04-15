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
  EuiHealth,
  EuiLoadingSpinner,
  EuiButtonEmpty,
  EuiPopover,
  EuiToolTip,
  EuiTablePagination,
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

interface IndexInfo {
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
  const [openPopoverIndex, setOpenPopoverIndex] = useState<number | null>(null);
  const [indexInfoCache, setIndexInfoCache] = useState<Record<string, IndexInfo | null>>({});
  const [loadingInfoForIndexSet, setLoadingInfoForIndexSet] = useState<Set<string>>(new Set());
  const [matchingIndicesCache, setMatchingIndicesCache] = useState<Record<string, string[]>>({});
  const [loadingMatchingIndicesSet, setLoadingMatchingIndicesSet] = useState<Set<string>>(
    new Set()
  );

  // Pagination state for wildcard popover
  const [wildcardPopoverPage, setWildcardPopoverPage] = useState<
    Record<string, { pageIndex: number; pageSize: number }>
  >({});

  // Use shared hook for fetching indices
  const { fetchIndices } = useIndexFetcher({ services, path });

  // Batch fetch index info for one or more indices
  const fetchBatchIndexInfo = useCallback(
    async (indexNames: string[]) => {
      if (!services?.http || indexNames.length === 0) return;

      // Mark all indices as loading
      setLoadingInfoForIndexSet((prev) => {
        const next = new Set(prev);
        indexNames.forEach((name) => next.add(name));
        return next;
      });

      try {
        const dataSourceId = path?.find((item) => item.type === 'DATA_SOURCE')?.id;

        const response = await services.http.get<any>(
          `/api/directquery/dsl/cat.indices/dataSourceMDSId=${dataSourceId || ''}`,
          {
            query: {
              format: 'json',
              index: indexNames.join(','),
            },
          }
        );

        if (response && Array.isArray(response)) {
          // Cache all results
          const newCache: Record<string, IndexInfo | null> = {};
          response.forEach((infoData: IndexInfo) => {
            newCache[infoData.index] = infoData;
          });

          // Mark any missing indices as null (not found)
          indexNames.forEach((indexName) => {
            if (!newCache[indexName]) {
              newCache[indexName] = null;
            }
          });

          setIndexInfoCache((prev) => ({ ...prev, ...newCache }));
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching batch index info:', error);
        // Mark all as null on error
        const errorCache: Record<string, IndexInfo | null> = {};
        indexNames.forEach((indexName) => {
          errorCache[indexName] = null;
        });
        setIndexInfoCache((prev) => ({ ...prev, ...errorCache }));
      } finally {
        // Clear loading state for all indices
        setLoadingInfoForIndexSet((prev) => {
          const next = new Set(prev);
          indexNames.forEach((name) => next.delete(name));
          return next;
        });
      }
    },
    [services, path]
  );

  // Fetch matching indices for wildcard pattern
  const fetchMatchingIndices = useCallback(
    async (pattern: string) => {
      if (!pattern || !pattern.includes('*')) {
        return [];
      }

      setLoadingMatchingIndicesSet((prev) => new Set(prev).add(pattern));
      try {
        const allIndices = await fetchIndices({
          patterns: [pattern],
          limit: undefined,
        });

        // Cache the result
        setMatchingIndicesCache((prev) => ({ ...prev, [pattern]: allIndices }));

        return allIndices;
      } catch (error) {
        setMatchingIndicesCache((prev) => ({ ...prev, [pattern]: [] }));
        return [];
      } finally {
        setLoadingMatchingIndicesSet((prev) => {
          const next = new Set(prev);
          next.delete(pattern);
          return next;
        });
      }
    },
    [fetchIndices]
  );

  // Auto-fetch health/matching data for selected items
  useEffect(() => {
    selectedItems.forEach((item) => {
      if (item.isWildcard) {
        // Fetch matching indices for wildcards
        if (!matchingIndicesCache[item.title] && !loadingMatchingIndicesSet.has(item.title)) {
          fetchMatchingIndices(item.title);
        }
      } else {
        // Fetch info for exact indices
        if (indexInfoCache[item.title] === undefined && !loadingInfoForIndexSet.has(item.title)) {
          fetchBatchIndexInfo([item.title]);
        }
      }
    });
  }, [
    selectedItems,
    matchingIndicesCache,
    indexInfoCache,
    loadingMatchingIndicesSet,
    loadingInfoForIndexSet,
    fetchMatchingIndices,
    fetchBatchIndexInfo,
  ]);

  // Auto-fetch health data for visible indices in wildcard popover
  useEffect(() => {
    if (openPopoverIndex !== null) {
      const item = selectedItems[openPopoverIndex];
      if (item?.isWildcard) {
        const matchingIndices = matchingIndicesCache[item.title] || [];
        const pagination = wildcardPopoverPage[item.title] || { pageIndex: 0, pageSize: 10 };
        const startIndex = pagination.pageIndex * pagination.pageSize;
        const endIndex = Math.min(startIndex + pagination.pageSize, matchingIndices.length);
        const visibleIndices = matchingIndices.slice(startIndex, endIndex);

        // Filter out already cached indices before batch fetching
        const uncachedIndices = visibleIndices.filter((name) => indexInfoCache[name] === undefined);
        if (uncachedIndices.length > 0) {
          fetchBatchIndexInfo(uncachedIndices);
        }
      }
    }
  }, [
    openPopoverIndex,
    selectedItems,
    matchingIndicesCache,
    wildcardPopoverPage,
    indexInfoCache,
    fetchBatchIndexInfo,
  ]);

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

    // Close popover if the removed item had it open
    if (openPopoverIndex === indexToRemove) {
      setOpenPopoverIndex(null);
    } else if (openPopoverIndex !== null && openPopoverIndex > indexToRemove) {
      setOpenPopoverIndex(openPopoverIndex - 1);
    }
  };

  // Handle info icon click
  const handleInfoIconClick = async (itemIndex: number, item: SelectedItem) => {
    if (openPopoverIndex === itemIndex) {
      setOpenPopoverIndex(null);
    } else {
      setOpenPopoverIndex(itemIndex);
      if (item.isWildcard) {
        // Fetch matching indices for wildcard if not cached
        if (!matchingIndicesCache[item.title]) {
          await fetchMatchingIndices(item.title);
        }
      } else {
        // Fetch info data for exact index if not cached
        if (indexInfoCache[item.title] === undefined) {
          await fetchBatchIndexInfo([item.title]);
        }
      }
    }
  };

  // Render health popover content
  const renderHealthPopover = (item: SelectedItem, itemIndex: number) => {
    if (item.isWildcard) {
      const matchingIndices = matchingIndicesCache[item.title] || [];
      const isLoading = loadingMatchingIndicesSet.has(item.title);

      if (isLoading) {
        return (
          <div className="indexDataStructureCreator__healthPopoverLoading">
            <EuiLoadingSpinner size="m" />
          </div>
        );
      }

      if (matchingIndices.length === 0) {
        return (
          <div className="indexDataStructureCreator__healthPopover">
            <EuiText size="xs" color="subdued">
              <FormattedMessage
                id="data.datasetService.unifiedSelector.noMatchingIndices"
                defaultMessage="No indices match this pattern"
              />
            </EuiText>
          </div>
        );
      }

      // Get or initialize pagination for this wildcard
      const pagination = wildcardPopoverPage[item.title] || { pageIndex: 0, pageSize: 10 };
      const { pageIndex, pageSize } = pagination;

      // Calculate pagination
      const pageCount = Math.ceil(matchingIndices.length / pageSize);
      const startIndex = pageIndex * pageSize;
      const endIndex = Math.min(startIndex + pageSize, matchingIndices.length);
      const visibleIndices = matchingIndices.slice(startIndex, endIndex);

      return (
        <div className="indexDataStructureCreator__wildcardPopover">
          <div className="indexDataStructureCreator__wildcardPopoverHeader">
            <EuiText size="xs">
              <strong>
                <FormattedMessage
                  id="data.datasetService.unifiedSelector.matchingCount"
                  defaultMessage="{count} {count, plural, one {index} other {indices}} match this pattern"
                  values={{ count: matchingIndices.length }}
                />
              </strong>
            </EuiText>
          </div>

          <div className="indexDataStructureCreator__wildcardPopoverContent">
            {/* Table header */}
            <div className="indexDataStructureCreator__wildcardPopoverTableHeader">
              <EuiFlexGroup gutterSize="s" alignItems="center" justifyContent="spaceBetween">
                <EuiFlexItem grow={true}>
                  <EuiText size="xs">
                    <strong>Name</strong>
                  </EuiText>
                </EuiFlexItem>
                <EuiFlexItem
                  grow={false}
                  className="indexDataStructureCreator__wildcardPopoverColumn"
                >
                  <EuiText size="xs">
                    <strong>Documents</strong>
                  </EuiText>
                </EuiFlexItem>
                <EuiFlexItem
                  grow={false}
                  className="indexDataStructureCreator__wildcardPopoverColumn"
                >
                  <EuiText size="xs">
                    <strong>Size</strong>
                  </EuiText>
                </EuiFlexItem>
              </EuiFlexGroup>
            </div>

            {/* Table rows */}
            <div className="indexDataStructureCreator__wildcardPopoverTableBody">
              {visibleIndices.map((indexName) => {
                const indexInfo = indexInfoCache[indexName];
                const isLoadingIndexInfo = loadingInfoForIndexSet.has(indexName);

                return (
                  <div key={indexName} className="indexDataStructureCreator__wildcardPopoverRow">
                    <EuiFlexGroup gutterSize="s" alignItems="center" justifyContent="spaceBetween">
                      <EuiFlexItem grow={true}>
                        <EuiText size="xs">{indexName}</EuiText>
                      </EuiFlexItem>
                      <EuiFlexItem
                        grow={false}
                        className="indexDataStructureCreator__wildcardPopoverColumn"
                      >
                        {isLoadingIndexInfo ? (
                          <EuiLoadingSpinner size="s" />
                        ) : indexInfo?.['docs.count'] ? (
                          <EuiText size="xs">{indexInfo['docs.count']}</EuiText>
                        ) : (
                          <EuiText size="xs" color="subdued">
                            —
                          </EuiText>
                        )}
                      </EuiFlexItem>
                      <EuiFlexItem
                        grow={false}
                        className="indexDataStructureCreator__wildcardPopoverColumn"
                      >
                        {isLoadingIndexInfo ? (
                          <EuiLoadingSpinner size="s" />
                        ) : indexInfo?.['store.size'] ? (
                          <EuiText size="xs">{indexInfo['store.size']}</EuiText>
                        ) : (
                          <EuiText size="xs" color="subdued">
                            —
                          </EuiText>
                        )}
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </div>
                );
              })}
            </div>
          </div>

          {/* EUI-styled pagination */}
          <div className="indexDataStructureCreator__wildcardPopoverFooter">
            <EuiTablePagination
              aria-label="Wildcard indices pagination"
              pageCount={pageCount}
              activePage={pageIndex}
              onChangePage={(newPageIndex) => {
                setWildcardPopoverPage((prev) => ({
                  ...prev,
                  [item.title]: { ...pagination, pageIndex: newPageIndex },
                }));
              }}
              itemsPerPage={pageSize}
              onChangeItemsPerPage={(newPageSize) => {
                setWildcardPopoverPage((prev) => ({
                  ...prev,
                  [item.title]: { pageIndex: 0, pageSize: newPageSize },
                }));
              }}
              itemsPerPageOptions={[5, 10, 20]}
            />
          </div>
        </div>
      );
    }

    const infoData = indexInfoCache[item.title];
    const isLoading = loadingInfoForIndexSet.has(item.title);

    if (isLoading) {
      return (
        <div className="indexDataStructureCreator__healthPopoverLoading">
          <EuiLoadingSpinner size="m" />
        </div>
      );
    }

    if (!infoData) {
      return (
        <div className="indexDataStructureCreator__healthPopover">
          <EuiText size="xs" color="subdued">
            <FormattedMessage
              id="data.datasetService.unifiedSelector.noHealthData"
              defaultMessage="Unable to fetch health data"
            />
          </EuiText>
        </div>
      );
    }

    return (
      <div className="indexDataStructureCreator__healthPopover">
        <EuiFlexGroup gutterSize="s" alignItems="center">
          <EuiFlexItem grow={false}>
            <EuiText size="xs">
              <strong>Health:</strong>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiHealth
              color={
                infoData.health === 'green'
                  ? 'success'
                  : infoData.health === 'yellow'
                  ? 'warning'
                  : 'danger'
              }
            >
              {infoData.health}
            </EuiHealth>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiText size="xs">
          <strong>Status:</strong> {infoData.status}
        </EuiText>
        <EuiText size="xs">
          <strong>Documents:</strong> {infoData['docs.count'] || '0'}
        </EuiText>
        <EuiText size="xs">
          <strong>Size:</strong> {infoData['store.size'] || 'N/A'}
        </EuiText>
      </div>
    );
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

      <EuiSpacer size="s" />

      {/* Selected items - full width */}
      <EuiText size="s">
        <strong>
          {i18n.translate('data.datasetService.unifiedSelector.selectedItemsLabel', {
            defaultMessage: 'Selected:',
          })}
        </strong>
      </EuiText>
      <EuiSpacer size="xs" />
      <div className="indexDataStructureCreator__selectedList">
        {selectedItems.length === 0 ? (
          <EuiPanel hasBorder paddingSize="m" className="indexDataStructureCreator__emptyState">
            <EuiText size="s" color="subdued" textAlign="center">
              <FormattedMessage
                id="data.datasetService.unifiedSelector.emptySelection"
                defaultMessage="No indices or patterns selected yet. Use the search above to add indices or wildcard patterns."
              />
            </EuiText>
          </EuiPanel>
        ) : (
          <EuiPanel
            hasBorder
            paddingSize="none"
            className="indexDataStructureCreator__selectedTable"
          >
            {/* Table header */}
            <div className="indexDataStructureCreator__tableHeader">
              <EuiFlexGroup gutterSize="s" alignItems="center" justifyContent="spaceBetween">
                <EuiFlexItem grow={true}>
                  <EuiText size="xs">
                    <strong>
                      {i18n.translate('data.datasetService.unifiedSelector.nameHeader', {
                        defaultMessage: 'Name',
                      })}
                    </strong>
                  </EuiText>
                </EuiFlexItem>
                <EuiFlexItem grow={false} className="indexDataStructureCreator__columnStatus">
                  <EuiText size="xs">
                    <strong>
                      {i18n.translate('data.datasetService.unifiedSelector.statusHeader', {
                        defaultMessage: 'Status',
                      })}
                    </strong>
                  </EuiText>
                </EuiFlexItem>
                <EuiFlexItem grow={false} className="indexDataStructureCreator__columnDocuments">
                  <EuiText size="xs">
                    <strong>
                      {i18n.translate('data.datasetService.unifiedSelector.documentsHeader', {
                        defaultMessage: 'Documents',
                      })}
                    </strong>
                  </EuiText>
                </EuiFlexItem>
                <EuiFlexItem grow={false} className="indexDataStructureCreator__columnSize">
                  <EuiText size="xs">
                    <strong>
                      {i18n.translate('data.datasetService.unifiedSelector.sizeHeader', {
                        defaultMessage: 'Size',
                      })}
                    </strong>
                  </EuiText>
                </EuiFlexItem>
                <EuiFlexItem grow={false} className="indexDataStructureCreator__columnActions">
                  <EuiText size="xs">
                    <strong>
                      {i18n.translate('data.datasetService.unifiedSelector.actionsHeader', {
                        defaultMessage: 'Actions',
                      })}
                    </strong>
                  </EuiText>
                </EuiFlexItem>
              </EuiFlexGroup>
            </div>
            {/* Table rows */}
            {selectedItems.map((item, itemIndex) => {
              const infoData = indexInfoCache[item.title];
              const matchingIndices = matchingIndicesCache[item.title];
              const isLoadingInfo = loadingInfoForIndexSet.has(item.title);
              const isLoadingMatches = loadingMatchingIndicesSet.has(item.title);

              return (
                <div key={item.id} className="indexDataStructureCreator__tableRow">
                  <EuiFlexGroup gutterSize="s" alignItems="center" justifyContent="spaceBetween">
                    {/* Name Column */}
                    <EuiFlexItem grow={true}>
                      <EuiText size="s">{item.title}</EuiText>
                    </EuiFlexItem>

                    {/* Status Column */}
                    <EuiFlexItem grow={false} className="indexDataStructureCreator__columnStatus">
                      {isLoadingInfo || isLoadingMatches ? (
                        <EuiLoadingSpinner size="s" />
                      ) : item.isWildcard ? (
                        matchingIndices && matchingIndices.length > 0 ? (
                          <EuiPopover
                            button={
                              <EuiToolTip
                                content={i18n.translate(
                                  'data.datasetService.unifiedSelector.clickToShowMatchingIndices',
                                  {
                                    defaultMessage: 'Show matching indices',
                                  }
                                )}
                              >
                                <EuiButtonEmpty
                                  size="xs"
                                  color="primary"
                                  onClick={() => handleInfoIconClick(itemIndex, item)}
                                  className="indexDataStructureCreator__wildcardButton"
                                >
                                  {/* @ts-expect-error TS2322 TODO(ts-error): fixme */}
                                  <EuiText size="xs" color="primary">
                                    {matchingIndices.length}{' '}
                                    {matchingIndices.length === 1 ? 'index' : 'indices'}
                                  </EuiText>
                                </EuiButtonEmpty>
                              </EuiToolTip>
                            }
                            isOpen={openPopoverIndex === itemIndex}
                            closePopover={() => setOpenPopoverIndex(null)}
                            anchorPosition="rightCenter"
                          >
                            {renderHealthPopover(item, itemIndex)}
                          </EuiPopover>
                        ) : (
                          <EuiText size="xs" color="subdued">
                            —
                          </EuiText>
                        )
                      ) : infoData ? (
                        <EuiHealth
                          color={
                            infoData.health === 'green'
                              ? 'success'
                              : infoData.health === 'yellow'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          <EuiText size="xs">{infoData.health}</EuiText>
                        </EuiHealth>
                      ) : (
                        <EuiText size="xs" color="subdued">
                          —
                        </EuiText>
                      )}
                    </EuiFlexItem>

                    {/* Documents Column */}
                    <EuiFlexItem
                      grow={false}
                      className="indexDataStructureCreator__columnDocuments"
                    >
                      {item.isWildcard ? (
                        <EuiText size="xs" color="subdued">
                          —
                        </EuiText>
                      ) : infoData?.['docs.count'] ? (
                        <EuiText size="xs">{infoData['docs.count']}</EuiText>
                      ) : (
                        <EuiText size="xs" color="subdued">
                          —
                        </EuiText>
                      )}
                    </EuiFlexItem>

                    {/* Size Column */}
                    <EuiFlexItem grow={false} className="indexDataStructureCreator__columnSize">
                      {item.isWildcard ? (
                        <EuiText size="xs" color="subdued">
                          —
                        </EuiText>
                      ) : infoData?.['store.size'] ? (
                        <EuiText size="xs">{infoData['store.size']}</EuiText>
                      ) : (
                        <EuiText size="xs" color="subdued">
                          —
                        </EuiText>
                      )}
                    </EuiFlexItem>

                    {/* Actions Column */}
                    <EuiFlexItem grow={false} className="indexDataStructureCreator__columnActions">
                      <EuiButtonEmpty
                        size="xs"
                        iconType="cross"
                        color="danger"
                        onClick={() => handleRemoveItem(itemIndex)}
                        aria-label={i18n.translate(
                          'data.datasetService.unifiedSelector.removeItem',
                          {
                            defaultMessage: 'Remove {item}',
                            values: { item: item.title },
                          }
                        )}
                      />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </div>
              );
            })}
          </EuiPanel>
        )}
      </div>
    </div>
  );
};

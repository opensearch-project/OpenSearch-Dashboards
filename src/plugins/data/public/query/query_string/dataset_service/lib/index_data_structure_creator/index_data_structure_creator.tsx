/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { EuiSpacer, EuiText, EuiBadge, EuiBadgeGroup } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import {
  DataStructureCreatorProps,
  DataStructure,
  DATA_STRUCTURE_META_TYPES,
} from '../../../../../../common';
import { IDataPluginServices } from '../../../../../types';
import { ModeSelectionRow } from './mode_selection_row';
import { MatchingIndicesList } from './matching_indices_list';
import { useIndexFetcher } from './use_index_fetcher';
import './index_data_structure_creator.scss';

type SelectionMode = 'single' | 'prefix';

interface IndexDataStructureCreatorProps extends DataStructureCreatorProps {
  services?: IDataPluginServices;
}

export const IndexDataStructureCreator: React.FC<IndexDataStructureCreatorProps> = ({
  path,
  index,
  selectDataStructure,
  services,
}) => {
  const current = path[index];

  const [selectionMode, setSelectionMode] = useState<SelectionMode>('single');
  const [selectedIndexIds, setSelectedIndexIds] = useState<string[]>([]);
  const [wildcardPatterns, setWildcardPatterns] = useState<string[]>([]);
  const [currentWildcardPattern, setCurrentWildcardPattern] = useState('');
  const [matchingIndices, setMatchingIndices] = useState<string[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Use shared hook for fetching indices
  const { fetchIndices } = useIndexFetcher({ services, path });

  // Fetch indices matching a wildcard pattern using shared hook
  const fetchMatchingIndices = useCallback(
    async (pattern: string) => {
      if (!pattern || pattern.trim() === '') {
        setMatchingIndices([]);
        return;
      }

      setIsLoadingMatches(true);

      try {
        // Check if pattern contains commas (multiple patterns)
        const patterns = pattern
          .split(',')
          .map((p) => p.trim())
          .filter((p) => p);

        // Fetch indices using shared hook
        const results = await fetchIndices({ patterns });
        setMatchingIndices(results);
      } finally {
        setIsLoadingMatches(false);
      }
    },
    [fetchIndices]
  );

  // Debounced handler for wildcard pattern changes
  useEffect(() => {
    if (selectionMode !== 'prefix') {
      setMatchingIndices([]);
      return;
    }

    // Combine added patterns with current pattern
    const allPatterns = [...wildcardPatterns];
    if (currentWildcardPattern && currentWildcardPattern.trim()) {
      allPatterns.push(currentWildcardPattern);
    }

    // If no patterns, show all indices (*) to help user see what's available
    const patternToFetch = allPatterns.length === 0 ? '*' : allPatterns.join(', ');

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      fetchMatchingIndices(patternToFetch);
    }, 300);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [currentWildcardPattern, wildcardPatterns, selectionMode, fetchMatchingIndices]);

  const handleCurrentWildcardPatternChange = useCallback((pattern: string) => {
    setCurrentWildcardPattern(pattern);
  }, []);

  // matchingIndices now comes from API calls via state

  const handleModeChange = (selectedOptions: Array<{ label: string; value?: string }>) => {
    if (selectedOptions.length > 0 && selectedOptions[0].value) {
      const newMode = selectedOptions[0].value as SelectionMode;
      setSelectionMode(newMode);

      if (newMode === 'prefix') {
        // Show all indices initially by querying for *
        setCurrentWildcardPattern('*');
      } else {
        setCurrentWildcardPattern('');
      }

      setWildcardPatterns([]);
      setMatchingIndices([]);
    }
  };

  const handleMultiIndexSelectionChange = (selectedIds: string[]) => {
    setSelectedIndexIds(selectedIds);

    if (selectedIds.length > 0) {
      // Create a combined data structure for multiple indices
      const dataSourceId = path.find((item) => item.type === 'DATA_SOURCE')?.id || 'local';
      const selectedTitles = selectedIds
        .map((id) => current.children?.find((child) => child.id === id)?.title)
        .filter(Boolean);

      const combinedDataStructure: DataStructure = {
        id: `${dataSourceId}::${selectedTitles.join(',')}`,
        title: selectedTitles.join(','),
        type: 'INDEX',
        meta: {
          type: DATA_STRUCTURE_META_TYPES.CUSTOM,
          isMultiIndex: true,
          selectedIndices: selectedIds,
          selectedTitles,
        },
      };

      selectDataStructure(combinedDataStructure, path.slice(0, index + 1));
    } else {
      // Clear selection when no indices selected
      selectDataStructure(undefined, path.slice(0, index + 1));
    }
  };

  const handleWildcardPatternsChange = (patterns: string[]) => {
    setWildcardPatterns(patterns);

    if (patterns.length > 0) {
      // Create a combined wildcard data structure
      const dataSourceId = path.find((item) => item.type === 'DATA_SOURCE')?.id || 'local';
      const combinedPattern = patterns.join(',');

      // Use API-fetched matchingIndices instead of deriving from current.children
      // matchingIndices is populated by fetchMatchingIndices via debounced API calls
      const wildcardDataStructure: DataStructure = {
        id: `${dataSourceId}::${combinedPattern}`,
        title: combinedPattern,
        type: 'INDEX',
        meta: {
          type: DATA_STRUCTURE_META_TYPES.CUSTOM,
          isMultiWildcard: true,
          wildcardPatterns: patterns,
          matchingIndices, // Use API results, not client-side filtering
        },
      };

      selectDataStructure(wildcardDataStructure, path.slice(0, index + 1));
    } else {
      // Clear selection when no patterns
      selectDataStructure(undefined, path.slice(0, index + 1));
    }
  };

  return (
    <div className="indexDataStructureCreator">
      <EuiText size="s" color="subdued">
        <FormattedMessage
          id="data.datasetService.indexDataStructureCreator.specifyDataScopeDescription"
          defaultMessage="Specify a data scope by making a selection to narrow down your data."
        />
      </EuiText>

      <EuiSpacer size="s" />

      <ModeSelectionRow
        selectionMode={selectionMode}
        onModeChange={handleModeChange}
        wildcardPatterns={wildcardPatterns}
        onWildcardPatternsChange={handleWildcardPatternsChange}
        onCurrentWildcardPatternChange={handleCurrentWildcardPatternChange}
        selectedIndexIds={selectedIndexIds}
        onMultiIndexSelectionChange={handleMultiIndexSelectionChange}
        services={services}
        path={path}
      />

      <EuiSpacer size="s" />

      {selectionMode === 'single' && selectedIndexIds.length > 0 && (
        <>
          <EuiText size="s">
            <strong>
              {i18n.translate('data.datasetService.indexSelector.selectedIndicesLabel', {
                defaultMessage: 'Selected Indices:',
              })}
            </strong>
          </EuiText>
          <EuiSpacer size="xs" />
          <div className="indexDataStructureCreator__selectedIndices">
            {selectedIndexIds.map((indexId) => {
              const indexTitle =
                current.children?.find((child) => child.id === indexId)?.title || indexId;
              return (
                <div key={indexId} className="indexDataStructureCreator__badgeContainer">
                  <EuiBadge
                    color="primary"
                    iconType="cross"
                    iconSide="right"
                    iconOnClick={() => {
                      const newSelectedIds = selectedIndexIds.filter((id) => id !== indexId);
                      handleMultiIndexSelectionChange(newSelectedIds);
                    }}
                    iconOnClickAriaLabel={i18n.translate(
                      'data.datasetService.indexSelector.removeIndex',
                      {
                        defaultMessage: 'Remove index {indexTitle}',
                        values: { indexTitle },
                      }
                    )}
                  >
                    {indexTitle}
                  </EuiBadge>
                </div>
              );
            })}
          </div>
          <EuiSpacer size="s" />
        </>
      )}

      {selectionMode === 'prefix' && wildcardPatterns.length > 0 && (
        <>
          <EuiText size="s">
            <strong>
              {i18n.translate('data.datasetService.multiWildcard.patternsLabel', {
                defaultMessage: 'Wildcard Patterns:',
              })}
            </strong>
          </EuiText>
          <EuiSpacer size="xs" />
          <EuiBadgeGroup gutterSize="s">
            {wildcardPatterns.map((pattern) => (
              <EuiBadge
                key={pattern}
                color="primary"
                iconType="cross"
                iconSide="right"
                iconOnClick={() => {
                  const newPatterns = wildcardPatterns.filter((p) => p !== pattern);
                  // handleWildcardPatternsChange already calls setWildcardPatterns
                  handleWildcardPatternsChange(newPatterns);
                }}
                iconOnClickAriaLabel={i18n.translate(
                  'data.datasetService.multiWildcard.removePattern',
                  {
                    defaultMessage: 'Remove pattern {pattern}',
                    values: { pattern },
                  }
                )}
              >
                {pattern}
              </EuiBadge>
            ))}
          </EuiBadgeGroup>
          <EuiSpacer size="s" />
        </>
      )}

      {selectionMode === 'prefix' && (
        <MatchingIndicesList
          matchingIndices={matchingIndices}
          customPrefix={currentWildcardPattern}
          isLoading={isLoadingMatches}
        />
      )}
    </div>
  );
};

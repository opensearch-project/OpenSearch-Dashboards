/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { EuiSpacer, EuiText, EuiBadge, EuiBadgeGroup } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import {
  DataStructureCreatorProps,
  DataStructure,
  DATA_STRUCTURE_META_TYPES,
} from '../../../../../../common';
import { ModeSelectionRow } from './mode_selection_row';
import { MatchingIndicesList } from './matching_indices_list';
import './index_data_structure_creator.scss';

type SelectionMode = 'single' | 'prefix';

export const IndexDataStructureCreator: React.FC<DataStructureCreatorProps> = ({
  path,
  index,
  selectDataStructure,
}) => {
  const current = path[index];

  const [selectionMode, setSelectionMode] = useState<SelectionMode>('single');
  const [customPrefix, setCustomPrefix] = useState('');
  const [selectedIndexIds, setSelectedIndexIds] = useState<string[]>([]);
  const [wildcardPatterns, setWildcardPatterns] = useState<string[]>([]);

  const matchingIndices = useMemo(() => {
    if (selectionMode !== 'prefix') {
      return [];
    }

    if (wildcardPatterns.length > 0) {
      const children = current.children || [];
      const allMatches = new Set<string>();

      wildcardPatterns.forEach((pattern) => {
        const regexPattern = pattern.replace(/\*/g, '.*');
        const regex = new RegExp(`^${regexPattern}$`, 'i');

        children
          .filter((child) => regex.test(child.title))
          .forEach((child) => allMatches.add(child.title));
      });

      return Array.from(allMatches).sort();
    }

    if (!customPrefix) {
      return [];
    }

    const children = current.children || [];
    const pattern = customPrefix.replace(/\*/g, '.*');
    const regex = new RegExp(`^${pattern}$`, 'i');

    return children.filter((child) => regex.test(child.title)).map((child) => child.title);
  }, [selectionMode, wildcardPatterns, customPrefix, current.children]);

  const handleModeChange = (selectedOptions: Array<{ label: string; value?: string }>) => {
    if (selectedOptions.length > 0 && selectedOptions[0].value) {
      const newMode = selectedOptions[0].value as SelectionMode;
      setSelectionMode(newMode);

      if (newMode === 'prefix') {
        // Show all indices initially to help users see what's available
        setCustomPrefix('*');
      } else {
        setCustomPrefix('');
      }

      setWildcardPatterns([]);
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

      // Calculate all matching indices
      const childrenList = current.children || [];
      const allMatches = new Set<string>();

      patterns.forEach((pattern) => {
        const regexPattern = pattern.replace(/\*/g, '.*');
        const regex = new RegExp(`^${regexPattern}$`, 'i');

        childrenList
          .filter((child) => regex.test(child.title))
          .forEach((child) => allMatches.add(child.title));
      });

      const matchingTitles = Array.from(allMatches).sort();

      const wildcardDataStructure: DataStructure = {
        id: `${dataSourceId}::${combinedPattern}`,
        title: combinedPattern,
        type: 'INDEX',
        meta: {
          type: DATA_STRUCTURE_META_TYPES.CUSTOM,
          isMultiWildcard: true,
          wildcardPatterns: patterns,
          matchingIndices: matchingTitles,
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
        children={current.children}
        selectedIndexIds={selectedIndexIds}
        onMultiIndexSelectionChange={handleMultiIndexSelectionChange}
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
                  setWildcardPatterns(newPatterns);
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
          customPrefix={wildcardPatterns.length > 0 ? wildcardPatterns.join(',') : customPrefix}
        />
      )}
    </div>
  );
};

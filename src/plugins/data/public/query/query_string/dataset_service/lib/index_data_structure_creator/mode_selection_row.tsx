/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiFormRow, EuiComboBox } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { DataStructure } from '../../../../../../common';
import './mode_selection_row.scss';
import { IndexSelector } from './index_selector';
import { MultiWildcardSelector } from './multi_wildcard_selector';

type SelectionMode = 'single' | 'prefix';

interface ModeSelectionRowProps {
  selectionMode: SelectionMode;
  onModeChange: (selectedOptions: Array<{ label: string; value?: string }>) => void;
  // Props for multi-wildcard mode
  wildcardPatterns: string[];
  onWildcardPatternsChange: (patterns: string[]) => void;
  // Props for index mode
  children: DataStructure[] | undefined;
  selectedIndexIds: string[];
  onMultiIndexSelectionChange: (selectedIds: string[]) => void;
}

export const ModeSelectionRow: React.FC<ModeSelectionRowProps> = ({
  selectionMode,
  onModeChange,
  wildcardPatterns,
  onWildcardPatternsChange,
  children,
  selectedIndexIds,
  onMultiIndexSelectionChange,
}) => {
  const modeOptions = [
    {
      label: i18n.translate('data.datasetService.modeSelectionRow.indexNameOption', {
        defaultMessage: 'Index name',
      }),
      value: 'single',
    },
    {
      label: i18n.translate('data.datasetService.modeSelectionRow.indexWildcardOption', {
        defaultMessage: 'Index wildcard',
      }),
      value: 'prefix',
    },
  ];

  const selectedModeOption = modeOptions.find((option) => option.value === selectionMode);

  return (
    <EuiFlexGroup gutterSize="s">
      <EuiFlexItem grow={false} className="modeSelectionRow__selectorColumn">
        <EuiFormRow
          label={i18n.translate('data.datasetService.modeSelectionRow.selectScopeByLabel', {
            defaultMessage: 'Select scope by',
          })}
        >
          <EuiComboBox
            data-test-subj="index-scope-selector"
            options={modeOptions}
            selectedOptions={selectedModeOption ? [selectedModeOption] : []}
            onChange={onModeChange}
            singleSelection={{ asPlainText: true }}
            isClearable={false}
          />
        </EuiFormRow>
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiFormRow
          label={i18n.translate('data.datasetService.modeSelectionRow.selectionCriteriaLabel', {
            defaultMessage: 'Selection criteria',
          })}
          fullWidth
          helpText={
            selectionMode === 'prefix'
              ? i18n.translate('data.datasetService.modeSelectionRow.wildcardHelpText', {
                  defaultMessage: 'Use an asterisk (*) to match multiple sources.',
                })
              : undefined
          }
        >
          {selectionMode === 'prefix' ? (
            <MultiWildcardSelector
              patterns={wildcardPatterns}
              onPatternsChange={onWildcardPatternsChange}
            />
          ) : (
            <IndexSelector
              children={children}
              selectedIndexIds={selectedIndexIds}
              onMultiSelectionChange={onMultiIndexSelectionChange}
            />
          )}
        </EuiFormRow>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

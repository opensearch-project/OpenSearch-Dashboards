/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiFormRow, EuiComboBox } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { DataStructure } from '../../../../../../common';
import { IndexSelector } from './index_selector';
import { PrefixSelector } from './prefix_selector';

type SelectionMode = 'single' | 'prefix';

interface ModeSelectionRowProps {
  selectionMode: SelectionMode;
  onModeChange: (selectedOptions: Array<{ label: string; value?: string }>) => void;
  // Props for prefix mode
  customPrefix: string;
  validationError: string;
  onPrefixChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  // Props for index mode
  children: DataStructure[] | undefined;
  selectedIndexId: string | null;
  isFinal: boolean;
  onIndexSelectionChange: (selectedId: string | null) => void;
}

export const ModeSelectionRow: React.FC<ModeSelectionRowProps> = ({
  selectionMode,
  onModeChange,
  customPrefix,
  validationError,
  onPrefixChange,
  children,
  selectedIndexId,
  isFinal,
  onIndexSelectionChange,
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
      <EuiFlexItem grow={false} style={{ flexBasis: '20%', minWidth: '170px' }}>
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
                  defaultMessage:
                    'Use an asterisk (*) to match multiple sources. Spaces and the characters /, ?, ", <, >, | are not allowed.',
                })
              : undefined
          }
          isInvalid={selectionMode === 'prefix' && !!validationError}
          error={selectionMode === 'prefix' ? validationError : undefined}
        >
          {selectionMode === 'prefix' ? (
            <PrefixSelector
              customPrefix={customPrefix}
              validationError={validationError}
              onPrefixChange={onPrefixChange}
            />
          ) : (
            <IndexSelector
              children={children}
              selectedIndexId={selectedIndexId}
              isFinal={isFinal}
              onSelectionChange={onIndexSelectionChange}
            />
          )}
        </EuiFormRow>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

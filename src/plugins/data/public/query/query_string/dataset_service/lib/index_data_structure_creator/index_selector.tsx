/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiComboBox, EuiIcon, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { DataStructure, DATA_STRUCTURE_META_TYPES } from '../../../../../../common';
import { appendIcon } from './index_data_structure_creator_utils';
import './index_selector.scss';

interface IndexSelectorProps {
  children: DataStructure[] | undefined;
  selectedIndexId: string | null;
  isFinal: boolean;
  onSelectionChange: (selectedId: string | null) => void;
}

export const IndexSelector: React.FC<IndexSelectorProps> = ({
  children,
  selectedIndexId,
  isFinal,
  onSelectionChange,
}) => {
  const options = (children || []).map((child) => ({
    label: child.parent ? `${child.parent.title}::${child.title}` : child.title,
    value: child.id,
  }));

  const selectedOptions = (children || [])
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
      renderOption={(option) => {
        const child = (children || []).find((c) => c.id === option.value);
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

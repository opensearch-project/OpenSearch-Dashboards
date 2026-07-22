/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiFormRow, EuiSelect } from '@elastic/eui';
import { VisColumn } from './types';

interface SplitFieldSelectorProps {
  categoricalColumns: VisColumn[];
  numericalColumns: VisColumn[];
  splitField?: string;
  onSplitFieldChange: (field: string | undefined) => void;
}

export const SplitFieldSelector: React.FC<SplitFieldSelectorProps> = ({
  categoricalColumns,
  numericalColumns,
  splitField,
  onSplitFieldChange,
}) => {
  const options = [...categoricalColumns, ...numericalColumns].map((col) => ({
    value: col.name,
    text: col.name,
  }));

  const hasOptions = options.length > 0;

  return (
    <EuiFormRow
      label={i18n.translate('explore.stylePanel.split.by', {
        defaultMessage: 'Split by',
      })}
      data-test-subj="splitFieldSelector"
    >
      <EuiSelect
        compressed
        hasNoInitialSelection={!splitField}
        options={[{ value: '', text: '— No split —' }, ...options]}
        value={splitField || ''}
        onChange={(e) => onSplitFieldChange(e.target.value || undefined)}
        disabled={!hasOptions}
        data-test-subj="splitFieldSelect"
      />
    </EuiFormRow>
  );
};

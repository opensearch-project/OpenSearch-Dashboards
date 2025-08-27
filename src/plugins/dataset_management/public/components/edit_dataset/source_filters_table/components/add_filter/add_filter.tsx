/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useCallback } from 'react';

import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { EuiFlexGroup, EuiFlexItem, EuiCompressedFieldText, EuiSmallButton } from '@elastic/eui';

interface AddFilterProps {
  onAddFilter: (filter: string) => void;
  useUpdatedUX: boolean;
}

const sourcePlaceholder = i18n.translate('datasetManagement.editDataset.sourcePlaceholder', {
  defaultMessage:
    "source filter, accepts wildcards (e.g., `user*` to filter fields starting with 'user')",
});

export const AddFilter = ({ onAddFilter, useUpdatedUX }: AddFilterProps) => {
  const [filter, setFilter] = useState<string>('');

  const onAddButtonClick = useCallback(() => {
    onAddFilter(filter);
    setFilter('');
  }, [filter, onAddFilter]);

  return (
    <EuiFlexGroup {...(useUpdatedUX ? { gutterSize: 's' } : {})}>
      <EuiFlexItem grow={10}>
        <EuiCompressedFieldText
          fullWidth
          value={filter}
          onChange={(e) => setFilter(e.target.value.trim())}
          placeholder={sourcePlaceholder}
        />
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiSmallButton isDisabled={filter.length === 0} onClick={onAddButtonClick}>
          <FormattedMessage
            id="datasetManagement.editDataset.source.addButtonLabel"
            defaultMessage="Add"
          />
        </EuiSmallButton>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiComboBox } from '@elastic/eui';
import { i18n } from '@osd/i18n';

interface PrefixSelectorProps {
  customPrefix: string;
  validationError: string;
  onPrefixChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const PrefixSelector: React.FC<PrefixSelectorProps> = ({
  customPrefix,
  validationError,
  onPrefixChange,
}) => {
  return (
    <EuiComboBox
      data-test-subj="dataset-prefix-selector"
      placeholder={i18n.translate(
        'data.datasetService.prefixSelector.specifyByWildcardPlaceholder',
        {
          defaultMessage: 'Specify by wildcard',
        }
      )}
      selectedOptions={customPrefix ? [{ label: customPrefix }] : []}
      onChange={(selectedOptions) => {
        // Only handle clear case (when options are removed)
        if (selectedOptions.length === 0) {
          onPrefixChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
        }
      }}
      onCreateOption={(searchValue) => {
        onPrefixChange({ target: { value: searchValue } } as React.ChangeEvent<HTMLInputElement>);
      }}
      noSuggestions
      singleSelection={{ asPlainText: true }}
      isInvalid={!!validationError}
      fullWidth
    />
  );
};

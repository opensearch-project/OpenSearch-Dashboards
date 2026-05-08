/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiCheckbox, EuiSpacer, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import React from 'react';

export interface SaveAsDatasetOptionProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled: boolean;
}

export const SaveAsDatasetOption: React.FC<SaveAsDatasetOptionProps> = ({
  checked,
  onChange,
  disabled,
}) => {
  return (
    <>
      <EuiCheckbox
        id="saveAsDatasetCheckbox"
        label={i18n.translate(
          'data.explorer.datasetSelector.advancedSelector.configurator.saveAsDatasetLabel',
          {
            defaultMessage: 'Save as dataset',
          }
        )}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        data-test-subj="saveAsDatasetCheckbox"
      />
      {disabled && (
        <>
          <EuiSpacer size="xs" />
          <EuiText size="xs" color="warning">
            <p>
              <FormattedMessage
                id="data.explorer.datasetSelector.advancedSelector.configurator.asyncTypeWarning"
                defaultMessage="This data type does not support saving as a dataset."
              />
            </p>
          </EuiText>
        </>
      )}
    </>
  );
};

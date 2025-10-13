/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFieldText, EuiFormRow, EuiSpacer, EuiText, EuiTextArea } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import React from 'react';

export interface DatasetMetadataFieldsProps {
  displayName?: string;
  description?: string;
  onDisplayNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  showAsyncWarning?: boolean;
}

export const DatasetMetadataFields: React.FC<DatasetMetadataFieldsProps> = ({
  displayName = '',
  description = '',
  onDisplayNameChange,
  onDescriptionChange,
  showAsyncWarning = false,
}) => {
  return (
    <>
      <EuiFormRow
        label={i18n.translate(
          'data.explorer.datasetSelector.advancedSelector.configurator.datasetNameLabel',
          {
            defaultMessage: 'Dataset name',
          }
        )}
      >
        <EuiFieldText
          value={displayName}
          onChange={(e) => onDisplayNameChange(e.target.value)}
          data-test-subj="datasetNameInput"
        />
      </EuiFormRow>
      <EuiFormRow
        label={i18n.translate(
          'data.explorer.datasetSelector.advancedSelector.configurator.datasetDescriptionLabel',
          {
            defaultMessage: 'Dataset description',
          }
        )}
      >
        <EuiTextArea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          data-test-subj="datasetDescriptionInput"
        />
      </EuiFormRow>
      {showAsyncWarning && (
        <>
          <EuiSpacer size="s" />
          <EuiText size="xs" color="warning">
            <p>
              <FormattedMessage
                id="data.explorer.datasetSelector.advancedSelector.configurator.asyncTypeSaveWarning"
                defaultMessage="This data type does not support saving as a dataset."
              />
            </p>
          </EuiText>
        </>
      )}
    </>
  );
};

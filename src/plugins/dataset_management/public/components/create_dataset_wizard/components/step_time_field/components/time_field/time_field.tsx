/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import {
  EuiForm,
  EuiCompressedFormRow,
  EuiSpacer,
  EuiLink,
  EuiCompressedSelect,
  EuiText,
  EuiLoadingSpinner,
} from '@elastic/eui';

import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';

interface TimeFieldProps {
  isVisible: boolean;
  fetchTimeFields: () => void;
  timeFieldOptions: Array<{ text: string; value?: string }>;
  isLoading: boolean;
  selectedTimeField?: string;
  onTimeFieldChanged: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const TimeField: React.FC<TimeFieldProps> = ({
  isVisible,
  fetchTimeFields,
  timeFieldOptions,
  isLoading,
  selectedTimeField,
  onTimeFieldChanged,
}) => (
  <EuiForm>
    {isVisible ? (
      <>
        <EuiText>
          <p>
            <FormattedMessage
              id="datasetManagement.createDataset.stepTime.timeDescription"
              defaultMessage="Select a primary time field for use with the global time filter."
            />
          </p>
        </EuiText>
        <EuiSpacer />
        <EuiCompressedFormRow
          label={
            <FormattedMessage
              id="datasetManagement.createDataset.stepTime.fieldLabel"
              defaultMessage="Time field"
            />
          }
          labelAppend={
            isLoading ? (
              <EuiLoadingSpinner size="s" />
            ) : (
              <EuiText size="xs">
                <EuiLink onClick={fetchTimeFields}>
                  <FormattedMessage
                    id="datasetManagement.createDataset.stepTime.refreshButton"
                    defaultMessage="Refresh"
                  />
                </EuiLink>
              </EuiText>
            )
          }
        >
          {isLoading ? (
            <EuiCompressedSelect
              name="timeField"
              data-test-subj="createDatasetTimeFieldSelect"
              options={[
                {
                  text: i18n.translate(
                    'datasetManagement.createDataset.stepTime.field.loadingDropDown',
                    {
                      defaultMessage: 'Loading…',
                    }
                  ),
                  value: '',
                },
              ]}
              disabled={true}
            />
          ) : (
            <EuiCompressedSelect
              name="timeField"
              data-test-subj="createDatasetTimeFieldSelect"
              options={timeFieldOptions}
              isLoading={isLoading}
              disabled={isLoading}
              value={selectedTimeField}
              onChange={onTimeFieldChanged}
            />
          )}
        </EuiCompressedFormRow>
      </>
    ) : (
      <EuiText>
        <p>
          <FormattedMessage
            id="datasetManagement.createDataset.stepTime.field.noTimeFieldsLabel"
            defaultMessage="The indices which match this index pattern don't contain any time fields."
          />
        </p>
      </EuiText>
    )}
  </EuiForm>
);

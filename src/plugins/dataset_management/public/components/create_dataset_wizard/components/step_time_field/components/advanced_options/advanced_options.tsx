/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import {
  EuiForm,
  EuiCompressedFormRow,
  EuiCompressedFieldText,
  EuiCompressedSelect,
  EuiSmallButtonEmpty,
  EuiSpacer,
} from '@elastic/eui';

import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';

interface AdvancedOptionsProps {
  isVisible: boolean;
  datasetId: string;
  signalType?: string;
  toggleAdvancedOptions: (e: React.FormEvent<HTMLButtonElement>) => void;
  onChangeDatasetId: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeSignalType?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const AdvancedOptions: React.FC<AdvancedOptionsProps> = ({
  isVisible,
  datasetId,
  signalType,
  toggleAdvancedOptions,
  onChangeDatasetId,
  onChangeSignalType,
}) => {
  const signalTypeOptions = [
    {
      value: undefined,
      text: i18n.translate('datasetManagement.signalType.none', {
        defaultMessage: 'I do not want to set a type',
      }),
    },
    {
      value: 'logs',
      text: i18n.translate('datasetManagement.signalType.logs', {
        defaultMessage: 'logs',
      }),
    },
    {
      value: 'traces',
      text: i18n.translate('datasetManagement.signalType.traces', {
        defaultMessage: 'traces',
      }),
    },
    {
      value: 'metrics',
      text: i18n.translate('datasetManagement.signalType.metrics', {
        defaultMessage: 'metrics',
      }),
    },
  ];
  return (
    <div>
      <EuiSmallButtonEmpty
        iconType={isVisible ? 'arrowDown' : 'arrowRight'}
        onClick={toggleAdvancedOptions}
      >
        {isVisible ? (
          <FormattedMessage
            id="datasetManagement.createDataset.stepTime.options.hideButton"
            defaultMessage="Hide advanced settings"
          />
        ) : (
          <FormattedMessage
            id="datasetManagement.createDataset.stepTime.options.showButton"
            defaultMessage="Show advanced settings"
          />
        )}
      </EuiSmallButtonEmpty>
      <EuiSpacer size="xs" />
      {isVisible ? (
        <EuiForm>
          <EuiCompressedFormRow
            label={
              <FormattedMessage
                id="datasetManagement.createDataset.stepTime.options.patternHeader"
                defaultMessage="Custom index pattern ID"
              />
            }
            helpText={
              <FormattedMessage
                id="datasetManagement.createDataset.stepTime.options.patternLabel"
                defaultMessage="OpenSearch Dashboards will provide a unique identifier for each index pattern. If you do not want to use this unique ID,
            enter a custom one."
              />
            }
          >
            <EuiCompressedFieldText
              name="datasetId"
              data-test-subj="createDatasetIdInput"
              value={datasetId}
              onChange={onChangeDatasetId}
              placeholder={i18n.translate(
                'datasetManagement.createDataset.stepTime.options.patternPlaceholder',
                {
                  defaultMessage: 'custom-index-pattern-id',
                }
              )}
            />
          </EuiCompressedFormRow>
          {onChangeSignalType && (
            <>
              <EuiSpacer size="m" />
              <EuiCompressedFormRow
                label={
                  <FormattedMessage
                    id="datasetManagement.createDataset.stepTime.options.signalTypeHeader"
                    defaultMessage="Type"
                  />
                }
                helpText={
                  <FormattedMessage
                    id="datasetManagement.createDataset.stepTime.options.signalTypeLabel"
                    defaultMessage="Optionally specify a signal type for this dataset."
                  />
                }
              >
                <EuiCompressedSelect
                  name="signalType"
                  data-test-subj="createDatasetSignalTypeSelect"
                  value={signalType}
                  onChange={onChangeSignalType}
                  options={signalTypeOptions}
                />
              </EuiCompressedFormRow>
            </>
          )}
        </EuiForm>
      ) : null}
    </div>
  );
};

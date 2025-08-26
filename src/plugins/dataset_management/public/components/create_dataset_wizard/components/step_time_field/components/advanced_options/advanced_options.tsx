/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
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
  datasetType: string;
  toggleAdvancedOptions: (e: React.FormEvent<HTMLButtonElement>) => void;
  onChangeDatasetId: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeDatasetType?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const AdvancedOptions: React.FC<AdvancedOptionsProps> = ({
  isVisible,
  datasetId,
  datasetType,
  toggleAdvancedOptions,
  onChangeDatasetId,
  onChangeDatasetType,
}) => {
  const datasetTypeOptions = [
    {
      value: 'LOGS',
      text: i18n.translate('datasetManagement.indexPatternType.logs', {
        defaultMessage: 'Logs',
      }),
    },
    {
      value: 'TRACES',
      text: i18n.translate('datasetManagement.indexPatternType.traces', {
        defaultMessage: 'Traces',
      }),
    },
    {
      value: 'METRICS',
      text: i18n.translate('datasetManagement.indexPatternType.metrics', {
        defaultMessage: 'Metrics',
      }),
    },
    {
      value: '',
      text: i18n.translate('datasetManagement.indexPatternType.none', {
        defaultMessage: 'NONE',
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
          {onChangeDatasetType && (
            <>
              <EuiSpacer size="m" />
              <EuiCompressedFormRow
                label={
                  <FormattedMessage
                    id="datasetManagement.createDataset.stepTime.options.datasetTypeHeader"
                    defaultMessage="Dataset Type"
                  />
                }
                helpText={
                  <FormattedMessage
                    id="datasetManagement.createDataset.stepTime.options.datasetTypeLabel"
                    defaultMessage="Optionally specify a signal type for this dataset."
                  />
                }
              >
                <EuiCompressedSelect
                  name="indexPatternType"
                  data-test-subj="createIndexPatternTypeSelect"
                  value={datasetType || ''}
                  onChange={onChangeDatasetType}
                  options={datasetTypeOptions}
                />
              </EuiCompressedFormRow>
            </>
          )}
        </EuiForm>
      ) : null}
    </div>
  );
};

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
import './header.scss';

import {
  EuiTitle,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiSmallButton,
  EuiForm,
  EuiCompressedFormRow,
  EuiCompressedFieldText,
  EuiSwitchEvent,
  EuiCompressedSwitch,
} from '@elastic/eui';

import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import {
  DataSourceRef,
  DatasetManagmentContext,
} from 'src/plugins/dataset_management/public/types';
import { StepInfo } from '../../../../types';
import { useOpenSearchDashboards } from '../../../../../../../../../plugins/opensearch_dashboards_react/public';

interface HeaderProps {
  isInputInvalid: boolean;
  errors: any;
  characterList: string;
  query: string;
  onQueryChanged: (e: React.ChangeEvent<HTMLInputElement>) => void;
  goToNextStep: (query: string) => void;
  isNextStepDisabled: boolean;
  showSystemIndices?: boolean;
  onChangeIncludingSystemIndices: (event: EuiSwitchEvent) => void;
  isIncludingSystemIndices: boolean;
  stepInfo: StepInfo;
  dataSourceRef?: DataSourceRef;
}

export const Header: React.FC<HeaderProps> = ({
  isInputInvalid,
  errors,
  characterList,
  query,
  onQueryChanged,
  goToNextStep,
  isNextStepDisabled,
  showSystemIndices = false,
  onChangeIncludingSystemIndices,
  isIncludingSystemIndices,
  stepInfo,
  dataSourceRef,
  ...rest
}) => {
  const { dataSourceEnabled } = useOpenSearchDashboards<DatasetManagmentContext>().services;

  return (
    <div {...rest}>
      <EuiTitle size="s">
        <h2>
          <FormattedMessage
            id="datasetManagement.createDataset.stepHeader"
            defaultMessage="Step {currentStepNumber} of {totalStepNumber}: Define an index pattern"
            values={{
              currentStepNumber: stepInfo.currentStepNumber,
              totalStepNumber: stepInfo.totalStepNumber,
            }}
          />
        </h2>
      </EuiTitle>
      <EuiSpacer size="m" />
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiForm isInvalid={isInputInvalid}>
            {dataSourceEnabled && dataSourceRef?.title
              ? renderDataSourceAndDatasetInput(
                  isInputInvalid,
                  errors,
                  characterList,
                  query,
                  onQueryChanged,
                  dataSourceRef.title
                )
              : renderDatasetInput(isInputInvalid, errors, characterList, query, onQueryChanged)}
            {showSystemIndices ? (
              <EuiCompressedFormRow>
                <EuiCompressedSwitch
                  label={
                    <FormattedMessage
                      id="datasetManagement.createDataset.includeSystemIndicesToggleSwitchLabel"
                      defaultMessage="Include system and hidden indices"
                    />
                  }
                  id="checkboxShowSystemIndices"
                  checked={isIncludingSystemIndices}
                  onChange={onChangeIncludingSystemIndices}
                  data-test-subj="showSystemAndHiddenIndices"
                />
              </EuiCompressedFormRow>
            ) : null}
          </EuiForm>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiCompressedFormRow hasEmptyLabelSpace>
            <EuiSmallButton
              fill
              iconSide="right"
              iconType="arrowRight"
              onClick={() => goToNextStep(query)}
              isDisabled={isNextStepDisabled}
              data-test-subj="createDatasetGoToStep2Button"
            >
              <FormattedMessage
                id="datasetManagement.createDataset.step.nextStepButton"
                defaultMessage="Next step"
              />
            </EuiSmallButton>
          </EuiCompressedFormRow>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};

const renderDatasetInput = (
  isInputInvalid: boolean,
  errors: any,
  characterList: string,
  query: string,
  onQueryChanged: (e: React.ChangeEvent<HTMLInputElement>) => void
) => {
  return (
    <EuiCompressedFormRow
      fullWidth
      label={
        <FormattedMessage
          id="datasetManagement.createDataset.step.datasetLabel"
          defaultMessage="Index pattern name"
        />
      }
      isInvalid={isInputInvalid}
      error={errors}
      helpText={
        <>
          <FormattedMessage
            id="datasetManagement.createDataset.step.dataset.allowLabel"
            defaultMessage="Use an asterisk ({asterisk}) to match multiple indices."
            values={{ asterisk: <strong>*</strong> }}
          />{' '}
          <FormattedMessage
            id="datasetManagement.createDataset.step.dataset.disallowLabel"
            defaultMessage="Spaces and the characters {characterList} are not allowed."
            values={{ characterList: <strong>{characterList}</strong> }}
          />
        </>
      }
    >
      <EuiCompressedFieldText
        name="dataset"
        placeholder={i18n.translate('datasetManagement.createDataset.step.datasetPlaceholder', {
          defaultMessage: 'index-name-*',
        })}
        value={query}
        isInvalid={isInputInvalid}
        onChange={onQueryChanged}
        data-test-subj="createDatasetNameInput"
        fullWidth
      />
    </EuiCompressedFormRow>
  );
};

const renderDataSourceAndDatasetInput = (
  isInputInvalid: boolean,
  errors: any,
  characterList: string,
  query: string,
  onQueryChanged: (e: React.ChangeEvent<HTMLInputElement>) => void,
  dataSourceTitle: string
) => {
  return (
    <EuiFlexGroup gutterSize="none">
      <EuiFlexItem grow={2}>
        <EuiCompressedFormRow
          label={
            <FormattedMessage
              id="datasetManagement.createDataset.step.dataSourceLabel"
              defaultMessage="Data Source"
            />
          }
          isInvalid={isInputInvalid}
          error={errors}
        >
          <EuiCompressedFieldText
            name="dataSource"
            placeholder={i18n.translate(
              'datasetManagement.createDataset.step.dataSourcePlaceholder',
              {
                defaultMessage: 'Data source name',
              }
            )}
            value={dataSourceTitle}
            isInvalid={isInputInvalid}
            disabled={true}
            data-test-subj="createDatasetDataSourceName"
          />
        </EuiCompressedFormRow>
      </EuiFlexItem>
      <div className="dataSourceDatasetDot"> {`.`} </div>
      <EuiFlexItem grow={7}>
        {renderDatasetInput(isInputInvalid, errors, characterList, query, onQueryChanged)}
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

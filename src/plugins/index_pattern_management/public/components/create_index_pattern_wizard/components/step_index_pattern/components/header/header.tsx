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
  EuiButton,
  EuiForm,
  EuiFormRow,
  EuiFieldText,
  EuiSwitchEvent,
  EuiSwitch,
} from '@elastic/eui';

import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import {
  DataSourceRef,
  IndexPatternManagmentContext,
} from 'src/plugins/index_pattern_management/public/types';
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
  const { dataSourceEnabled } = useOpenSearchDashboards<IndexPatternManagmentContext>().services;

  return (
    <div {...rest}>
      <EuiTitle size="s">
        <h2>
          <FormattedMessage
            id="indexPatternManagement.createIndexPattern.stepHeader"
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
              ? renderDataSourceAndIndexPatternInput(
                  isInputInvalid,
                  errors,
                  characterList,
                  query,
                  onQueryChanged,
                  dataSourceRef.title
                )
              : renderIndexPatternInput(
                  isInputInvalid,
                  errors,
                  characterList,
                  query,
                  onQueryChanged
                )}
            {showSystemIndices ? (
              <EuiFormRow>
                <EuiSwitch
                  label={
                    <FormattedMessage
                      id="indexPatternManagement.createIndexPattern.includeSystemIndicesToggleSwitchLabel"
                      defaultMessage="Include system and hidden indices"
                    />
                  }
                  id="checkboxShowSystemIndices"
                  checked={isIncludingSystemIndices}
                  onChange={onChangeIncludingSystemIndices}
                  data-test-subj="showSystemAndHiddenIndices"
                />
              </EuiFormRow>
            ) : null}
          </EuiForm>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiFormRow hasEmptyLabelSpace>
            <EuiButton
              fill
              iconSide="right"
              iconType="arrowRight"
              onClick={() => goToNextStep(query)}
              isDisabled={isNextStepDisabled}
              data-test-subj="createIndexPatternGoToStep2Button"
            >
              <FormattedMessage
                id="indexPatternManagement.createIndexPattern.step.nextStepButton"
                defaultMessage="Next step"
              />
            </EuiButton>
          </EuiFormRow>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};

const renderIndexPatternInput = (
  isInputInvalid: boolean,
  errors: any,
  characterList: string,
  query: string,
  onQueryChanged: (e: React.ChangeEvent<HTMLInputElement>) => void
) => {
  return (
    <EuiFormRow
      fullWidth
      label={
        <FormattedMessage
          id="indexPatternManagement.createIndexPattern.step.indexPatternLabel"
          defaultMessage="Index pattern name"
        />
      }
      isInvalid={isInputInvalid}
      error={errors}
      helpText={
        <>
          <FormattedMessage
            id="indexPatternManagement.createIndexPattern.step.indexPattern.allowLabel"
            defaultMessage="Use an asterisk ({asterisk}) to match multiple indices."
            values={{ asterisk: <strong>*</strong> }}
          />{' '}
          <FormattedMessage
            id="indexPatternManagement.createIndexPattern.step.indexPattern.disallowLabel"
            defaultMessage="Spaces and the characters {characterList} are not allowed."
            values={{ characterList: <strong>{characterList}</strong> }}
          />
        </>
      }
    >
      <EuiFieldText
        name="indexPattern"
        placeholder={i18n.translate(
          'indexPatternManagement.createIndexPattern.step.indexPatternPlaceholder',
          {
            defaultMessage: 'index-name-*',
          }
        )}
        value={query}
        isInvalid={isInputInvalid}
        onChange={onQueryChanged}
        data-test-subj="createIndexPatternNameInput"
        fullWidth
      />
    </EuiFormRow>
  );
};

const renderDataSourceAndIndexPatternInput = (
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
        <EuiFormRow
          label={
            <FormattedMessage
              id="indexPatternManagement.createIndexPattern.step.dataSourceLabel"
              defaultMessage="Data Source"
            />
          }
          isInvalid={isInputInvalid}
          error={errors}
        >
          <EuiFieldText
            name="dataSource"
            placeholder={i18n.translate(
              'indexPatternManagement.createIndexPattern.step.dataSourcePlaceholder',
              {
                defaultMessage: 'Data source name',
              }
            )}
            value={dataSourceTitle}
            isInvalid={isInputInvalid}
            disabled={true}
            data-test-subj="createIndexPatternDataSourceName"
          />
        </EuiFormRow>
      </EuiFlexItem>
      <div className="dataSourceIndexPatternDot"> {`.`} </div>
      <EuiFlexItem grow={7}>
        {renderIndexPatternInput(isInputInvalid, errors, characterList, query, onQueryChanged)}
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

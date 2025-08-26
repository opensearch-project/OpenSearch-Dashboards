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

import React, { Component } from 'react';
import {
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiSpacer,
  EuiLoadingSpinner,
  EuiHorizontalRule,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { ensureMinimumTime, extractTimeFields } from '../../lib';

import { Header } from './components/header';
import { TimeField } from './components/time_field';
import { AdvancedOptions } from './components/advanced_options';
import { ActionButtons } from './components/action_buttons';
import { context } from '../../../../../../opensearch_dashboards_react/public';
import { DataSourceRef, DatasetManagmentContextValue } from '../../../../types';
import { DatasetCreationConfig } from '../../../..';
import { StepInfo } from '../../types';

interface StepTimeFieldProps {
  dataset: string;
  goToPreviousStep: () => void;
  createDataset: (selectedTimeField: string | undefined, datasetId: string) => void;
  datasetCreationType: DatasetCreationConfig;
  selectedTimeField?: string;
  dataSourceRef?: DataSourceRef;
  stepInfo: StepInfo;
}

interface StepTimeFieldState {
  error: string;
  timeFields: TimeFieldConfig[];
  selectedTimeField?: string;
  timeFieldSet: boolean;
  isAdvancedOptionsVisible: boolean;
  isFetchingTimeFields: boolean;
  isCreating: boolean;
  datasetId: string;
  datasetType: string;
  datasetName: string;
}

interface TimeFieldConfig {
  display: string;
  fieldName?: string;
  isDisabled?: boolean;
}

export class StepTimeField extends Component<StepTimeFieldProps, StepTimeFieldState> {
  static contextType = context;

  // @ts-expect-error TS2612 TODO(ts-error): fixme
  public readonly context!: DatasetManagmentContextValue;

  state: StepTimeFieldState = {
    error: '',
    timeFields: [],
    selectedTimeField: undefined,
    timeFieldSet: false,
    isAdvancedOptionsVisible: false,
    isFetchingTimeFields: false,
    isCreating: false,
    datasetId: '',
    datasetType: '',
    datasetName: '',
  };

  constructor(props: StepTimeFieldProps) {
    super(props);
    this.state.datasetType = props.datasetCreationType.getDatasetType() || '';
    this.state.datasetName = props.datasetCreationType.getDatasetName();
    this.state.selectedTimeField = props.selectedTimeField;
    if (props.selectedTimeField) {
      this.state.timeFieldSet = true;
    }
  }

  mounted = false;

  componentDidMount() {
    this.mounted = true;
    this.fetchTimeFields();
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  fetchTimeFields = async () => {
    const { dataset: pattern, dataSourceRef } = this.props;
    const { getFetchForWildcardOptions } = this.props.datasetCreationType;

    this.setState({ isFetchingTimeFields: true });
    const fields = await ensureMinimumTime(
      this.context.services.data.dataViews.getFieldsForWildcard({
        pattern,
        ...getFetchForWildcardOptions(),
        dataSourceId: dataSourceRef?.id,
      })
    );
    const timeFields = extractTimeFields(fields);

    this.setState({ timeFields, isFetchingTimeFields: false });
  };

  onTimeFieldChanged = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;

    // Find the time field based on the selected value
    const timeField = this.state.timeFields.find(
      (timeFld: TimeFieldConfig) => timeFld.fieldName === value
    );

    // If the value is an empty string, it's not a valid selection
    const validSelection = value !== '';

    this.setState({
      selectedTimeField: timeField ? (timeField as TimeFieldConfig).fieldName : undefined,
      timeFieldSet: validSelection,
    });
  };

  onChangeDatasetId = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ datasetId: e.target.value });
  };

  toggleAdvancedOptions = () => {
    this.setState((state) => ({
      isAdvancedOptionsVisible: !state.isAdvancedOptionsVisible,
    }));
  };

  createDataset = async () => {
    const { createDataset } = this.props;
    const { selectedTimeField, datasetId } = this.state;
    this.setState({ isCreating: true });
    try {
      await createDataset(selectedTimeField, datasetId);
    } catch (error) {
      if (!this.mounted) return;
      this.setState({
        error: error instanceof Error ? error.message : String(error),
        isCreating: false,
      });
    }
  };

  formatErrorMessage(message: string) {
    // `createDataset` throws "Conflict" when index pattern ID already exists.
    return message === 'Conflict' ? (
      <FormattedMessage
        id="datasetManagement.createDataset.stepTime.patterAlreadyExists"
        defaultMessage="Custom index pattern ID already exists."
      />
    ) : (
      message
    );
  }

  render() {
    const {
      timeFields,
      selectedTimeField,
      timeFieldSet,
      isAdvancedOptionsVisible,
      datasetId,
      isCreating,
      isFetchingTimeFields,
      datasetName,
    } = this.state;

    if (isCreating) {
      return (
        <EuiFlexGroup justifyContent="center" alignItems="center" direction="column" gutterSize="s">
          <EuiFlexItem grow={false}>
            <EuiTitle size="s">
              <h3 className="eui-textCenter">
                <FormattedMessage
                  id="datasetManagement.createDataset.stepTime.creatingLabel"
                  defaultMessage="Creating index pattern…"
                />
              </h3>
            </EuiTitle>
          </EuiFlexItem>

          <EuiFlexItem grow={false}>
            <EuiLoadingSpinner size="l" />
          </EuiFlexItem>
        </EuiFlexGroup>
      );
    }

    const { dataset, goToPreviousStep, stepInfo } = this.props;

    const timeFieldOptions =
      timeFields.length > 0
        ? [
            { text: '', value: '' },
            ...timeFields.map((timeField: TimeFieldConfig) => ({
              text: timeField.display,
              value: timeField.fieldName,
              disabled: ((timeFields as unknown) as TimeFieldConfig).isDisabled,
            })),
          ]
        : [];

    const showTimeField = !timeFields || timeFields.length > 1;
    const submittable = !showTimeField || timeFieldSet;
    const error = this.state.error ? (
      <>
        <EuiCallOut
          title={
            <FormattedMessage
              id="datasetManagement.createDataset.stepTime.error"
              defaultMessage="Error"
            />
          }
          color="danger"
          iconType="cross"
        >
          <p>{this.formatErrorMessage(this.state.error)}</p>
        </EuiCallOut>
        <EuiSpacer size="m" />
      </>
    ) : null;

    return (
      <>
        <Header dataset={dataset} datasetName={datasetName} stepInfo={stepInfo} />
        <EuiSpacer size="m" />
        <TimeField
          isVisible={showTimeField}
          fetchTimeFields={this.fetchTimeFields}
          timeFieldOptions={timeFieldOptions}
          isLoading={isFetchingTimeFields}
          selectedTimeField={selectedTimeField}
          onTimeFieldChanged={this.onTimeFieldChanged}
        />
        <EuiHorizontalRule />
        <AdvancedOptions
          isVisible={isAdvancedOptionsVisible}
          datasetId={datasetId}
          toggleAdvancedOptions={this.toggleAdvancedOptions}
          onChangeDatasetId={this.onChangeDatasetId}
        />
        <EuiSpacer size="m" />
        {error}
        <ActionButtons
          goToPreviousStep={goToPreviousStep}
          submittable={submittable}
          createDataset={this.createDataset}
        />
      </>
    );
  }
}

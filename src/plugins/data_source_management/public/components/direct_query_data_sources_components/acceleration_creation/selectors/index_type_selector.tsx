/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFormRow, EuiLink, EuiSpacer, EuiSuperSelect, EuiText } from '@elastic/eui';
import React, { Fragment, useEffect, useState } from 'react';
import {
  ACCELERATION_DEFUALT_SKIPPING_INDEX_NAME,
  ACC_INDEX_TYPE_DOCUMENTATION_URL,
} from '../../../../../framework/constants';
import { AccelerationIndexType, CreateAccelerationForm } from '../../../../../framework/types';

interface IndexTypeSelectorProps {
  accelerationFormData: CreateAccelerationForm;
  setAccelerationFormData: React.Dispatch<React.SetStateAction<CreateAccelerationForm>>;
  initiateColumnLoad: (dataSource: string, database: string, dataTable: string) => void;
}

export const IndexTypeSelector = ({
  accelerationFormData,
  setAccelerationFormData,
  initiateColumnLoad,
}: IndexTypeSelectorProps) => {
  const [value, setValue] = useState('skipping');

  useEffect(() => {
    initiateColumnLoad(
      accelerationFormData.dataSource,
      accelerationFormData.database,
      accelerationFormData.dataTable
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accelerationFormData.dataTable]);

  const onChangeSupeSelect = (indexType: string) => {
    setAccelerationFormData({
      ...accelerationFormData,
      accelerationIndexType: indexType as AccelerationIndexType,
      accelerationIndexName:
        indexType === 'skipping' ? ACCELERATION_DEFUALT_SKIPPING_INDEX_NAME : '',
    });
    setValue(indexType);
  };

  const superSelectOptions = [
    {
      value: 'skipping',
      inputDisplay: 'Skipping index',
      dropdownDisplay: (
        <Fragment>
          <strong>Skipping index</strong>
          <EuiText size="s" color="subdued">
            <p className="EuiTextColor--subdued">
              Accelerate direct queries by storing table meta-data in OpenSearch.
            </p>
          </EuiText>
        </Fragment>
      ),
    },
    {
      value: 'covering',
      inputDisplay: 'Covering index',
      dropdownDisplay: (
        <Fragment>
          <strong>Covering index</strong>
          <EuiText size="s" color="subdued">
            <p className="EuiTextColor--subdued">
              Accelerate queries from subset of table data stored in OpenSearch.
            </p>
          </EuiText>
        </Fragment>
      ),
    },
    {
      value: 'materialized',
      inputDisplay: 'Materialized view',
      dropdownDisplay: (
        <Fragment>
          <strong>Materialized view</strong>
          <EuiText size="s" color="subdued">
            <p className="EuiTextColor--subdued">
              Accelerate queries and visualizations from aggregated table results stored in
              OpenSearch.
            </p>
          </EuiText>
        </Fragment>
      ),
    },
  ];

  return (
    <>
      <EuiText data-test-subj="acceleration-setting-header">
        <h3>Acceleration setting</h3>
      </EuiText>
      <EuiSpacer size="s" />
      <EuiFormRow
        label="Acceleration type"
        helpText="Select the type of acceleration according to your use case."
        labelAppend={
          <EuiText size="xs">
            <EuiLink href={ACC_INDEX_TYPE_DOCUMENTATION_URL} target="_blank">
              Help
            </EuiLink>
          </EuiText>
        }
      >
        <EuiSuperSelect
          options={superSelectOptions}
          valueOfSelected={value}
          onChange={onChangeSupeSelect}
          itemLayoutAlign="top"
          hasDividers
        />
      </EuiFormRow>
    </>
  );
};

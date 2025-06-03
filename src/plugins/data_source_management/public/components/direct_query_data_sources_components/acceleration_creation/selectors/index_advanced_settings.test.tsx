/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { mount } from 'enzyme';
import React from 'react';
import { EuiAccordion, EuiFieldNumber } from '@elastic/eui';
import { IndexAdvancedSettings } from './index_advanced_settings';
import { CreateAccelerationForm } from '../../../../../framework/types';
import { act } from 'react-dom/test-utils';

jest.mock('../create/utils', () => ({
  hasError: jest.fn(),
  validatePrimaryShardCount: jest.fn().mockReturnValue([]),
  validateReplicaCount: jest.fn().mockReturnValue([]),
}));

const defaultAccelerationFormData: CreateAccelerationForm = {
  dataSource: 'test_source',
  database: 'test_database',
  dataTable: 'test_table',
  dataTableFields: [],
  accelerationIndexType: 'covering',
  skippingIndexQueryData: [],
  coveringIndexQueryData: [],
  materializedViewQueryData: {
    columnsValues: [],
    groupByTumbleValue: {
      timeField: '',
      tumbleWindow: 0,
      tumbleInterval: 'm',
    },
  },
  accelerationIndexName: 'index_name',
  primaryShardsCount: 1,
  replicaShardsCount: 1,
  refreshType: 'autoInterval',
  checkpointLocation: undefined,
  watermarkDelay: {
    delayWindow: 1,
    delayInterval: 'm',
  },
  refreshIntervalOptions: {
    refreshWindow: 15,
    refreshInterval: 'm',
  },
  formErrors: {
    dataSourceError: [],
    databaseError: [],
    dataTableError: [],
    skippingIndexError: [],
    coveringIndexError: [],
    materializedViewError: [],
    indexNameError: [],
    primaryShardsError: [],
    replicaShardsError: [],
    refreshIntervalError: [],
    checkpointLocationError: [],
    watermarkDelayError: [],
  },
};

describe('IndexAdvancedSettings', () => {
  const setAccelerationFormData = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    const wrapper = mount(
      <IndexAdvancedSettings
        accelerationFormData={defaultAccelerationFormData}
        setAccelerationFormData={setAccelerationFormData}
      />
    );
    expect(wrapper.find(EuiAccordion).exists()).toBe(true);
    expect(wrapper.find(EuiFieldNumber).length).toBe(2);
  });

  it('updates primary shards on change', async () => {
    const wrapper = mount(
      <IndexAdvancedSettings
        accelerationFormData={defaultAccelerationFormData}
        setAccelerationFormData={setAccelerationFormData}
      />
    );

    await act(async () => {
      wrapper.find(EuiFieldNumber).at(0).prop('onChange')!({ target: { value: '5' } });
    });

    wrapper.update();
    expect(setAccelerationFormData).toHaveBeenCalledWith({
      ...defaultAccelerationFormData,
      primaryShardsCount: 5,
    });
  });

  it('updates replica count on change', async () => {
    const wrapper = mount(
      <IndexAdvancedSettings
        accelerationFormData={defaultAccelerationFormData}
        setAccelerationFormData={setAccelerationFormData}
      />
    );

    await act(async () => {
      wrapper.find(EuiFieldNumber).at(1).prop('onChange')!({ target: { value: '3' } });
    });

    wrapper.update();
    expect(setAccelerationFormData).toHaveBeenCalledWith({
      ...defaultAccelerationFormData,
      replicaShardsCount: 3,
    });
  });
});

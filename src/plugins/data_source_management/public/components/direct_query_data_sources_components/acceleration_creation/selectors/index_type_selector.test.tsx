/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { IndexTypeSelector } from './index_type_selector';
import { EuiSuperSelect, EuiFormRow, EuiLink, EuiText } from '@elastic/eui';
import {
  ACCELERATION_DEFUALT_SKIPPING_INDEX_NAME,
  ACC_INDEX_TYPE_DOCUMENTATION_URL,
} from '../../../../../framework/constants';
import { CreateAccelerationForm } from '../../../../../framework/types';

const defaultAccelerationFormData: CreateAccelerationForm = {
  dataSource: 'test_source',
  database: 'test_database',
  dataTable: 'test_table',
  dataTableFields: [],
  accelerationIndexType: 'skipping',
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
  accelerationIndexName: ACCELERATION_DEFUALT_SKIPPING_INDEX_NAME,
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

describe('IndexTypeSelector', () => {
  const setAccelerationFormData = jest.fn();
  const initiateColumnLoad = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const wrapper = mount(
      <IndexTypeSelector
        accelerationFormData={defaultAccelerationFormData}
        setAccelerationFormData={setAccelerationFormData}
        initiateColumnLoad={initiateColumnLoad}
      />
    );

    expect(wrapper.find(EuiText).at(0).text()).toBe('Acceleration setting');
    expect(wrapper.find(EuiFormRow).exists()).toBe(true);
    expect(wrapper.find(EuiSuperSelect).exists()).toBe(true);
    expect(wrapper.find(EuiLink).prop('href')).toBe(ACC_INDEX_TYPE_DOCUMENTATION_URL);
  });

  it('calls initiateColumnLoad on mount', () => {
    mount(
      <IndexTypeSelector
        accelerationFormData={defaultAccelerationFormData}
        setAccelerationFormData={setAccelerationFormData}
        initiateColumnLoad={initiateColumnLoad}
      />
    );

    expect(initiateColumnLoad).toHaveBeenCalledWith('test_source', 'test_database', 'test_table');
  });

  it('updates acceleration type on change', () => {
    const wrapper = mount(
      <IndexTypeSelector
        accelerationFormData={defaultAccelerationFormData}
        setAccelerationFormData={setAccelerationFormData}
        initiateColumnLoad={initiateColumnLoad}
      />
    );

    act(() => {
      wrapper.find(EuiSuperSelect).prop('onChange')('covering');
    });

    expect(setAccelerationFormData).toHaveBeenCalledWith(
      expect.objectContaining({
        accelerationIndexType: 'covering',
        accelerationIndexName: '',
      })
    );
  });

  it('sets default skipping index name when selecting skipping index', () => {
    const wrapper = mount(
      <IndexTypeSelector
        accelerationFormData={{ ...defaultAccelerationFormData, accelerationIndexType: 'covering' }}
        setAccelerationFormData={setAccelerationFormData}
        initiateColumnLoad={initiateColumnLoad}
      />
    );

    act(() => {
      wrapper.find(EuiSuperSelect).prop('onChange')('skipping');
    });

    expect(setAccelerationFormData).toHaveBeenCalledWith(
      expect.objectContaining({
        accelerationIndexType: 'skipping',
        accelerationIndexName: ACCELERATION_DEFUALT_SKIPPING_INDEX_NAME,
      })
    );
  });

  it('calls initiateColumnLoad when dataTable changes', () => {
    const wrapper = mount(
      <IndexTypeSelector
        accelerationFormData={defaultAccelerationFormData}
        setAccelerationFormData={setAccelerationFormData}
        initiateColumnLoad={initiateColumnLoad}
      />
    );

    const newFormData = { ...defaultAccelerationFormData, dataTable: 'new_table' };

    wrapper.setProps({ accelerationFormData: newFormData });

    expect(initiateColumnLoad).toHaveBeenCalledWith('test_source', 'test_database', 'new_table');
  });

  it('renders all acceleration type options', () => {
    const wrapper = mount(
      <IndexTypeSelector
        accelerationFormData={defaultAccelerationFormData}
        setAccelerationFormData={setAccelerationFormData}
        initiateColumnLoad={initiateColumnLoad}
      />
    );

    const options = wrapper.find(EuiSuperSelect).prop('options');
    expect(options).toHaveLength(3);
    expect(options.map((option) => option.value)).toEqual(['skipping', 'covering', 'materialized']);
  });
});

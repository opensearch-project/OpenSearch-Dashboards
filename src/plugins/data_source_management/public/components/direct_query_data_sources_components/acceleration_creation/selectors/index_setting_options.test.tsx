/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { mount } from 'enzyme';
import React from 'react';
import { EuiFieldNumber, EuiFieldText, EuiSuperSelect, EuiSelect } from '@elastic/eui';
import { IndexSettingOptions } from './index_setting_options';
import { CreateAccelerationForm } from '../../../../../framework/types';
import { act } from 'react-dom/test-utils';
import {
  ACCELERATION_REFRESH_TIME_INTERVAL,
  ACCELERATION_TIME_INTERVAL,
} from '../../../../../framework/constants';

jest.mock('../create/utils', () => ({
  hasError: jest.fn(),
  validateCheckpointLocation: jest.fn().mockReturnValue([]),
  validateRefreshInterval: jest.fn().mockReturnValue([]),
  validateWatermarkDelay: jest.fn().mockReturnValue([]),
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
  checkpointLocation: '',
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

describe('IndexSettingOptions', () => {
  const setAccelerationFormData = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    const wrapper = mount(
      <IndexSettingOptions
        accelerationFormData={defaultAccelerationFormData}
        setAccelerationFormData={setAccelerationFormData}
      />
    );
    expect(wrapper.find(EuiSuperSelect).exists()).toBe(true);
    expect(wrapper.find('EuiFormRow').length).toBeGreaterThan(0);
  });

  it('updates refresh type on change', () => {
    const wrapper = mount(
      <IndexSettingOptions
        accelerationFormData={defaultAccelerationFormData}
        setAccelerationFormData={setAccelerationFormData}
      />
    );

    act(() => {
      wrapper.find(EuiSuperSelect).prop('onChange')('manual');
    });

    wrapper.update();
    expect(setAccelerationFormData).toHaveBeenCalled();
  });

  it('updates refresh window on change', () => {
    const wrapper = mount(
      <IndexSettingOptions
        accelerationFormData={defaultAccelerationFormData}
        setAccelerationFormData={setAccelerationFormData}
      />
    );

    act(() => {
      wrapper.find(EuiFieldNumber).at(0).prop('onChange')({
        target: { value: '20' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    wrapper.update();
    expect(setAccelerationFormData).toHaveBeenCalled();
  });

  it('updates checkpoint location on change', () => {
    const wrapper = mount(
      <IndexSettingOptions
        accelerationFormData={defaultAccelerationFormData}
        setAccelerationFormData={setAccelerationFormData}
      />
    );

    act(() => {
      wrapper.find(EuiFieldText).first().prop('onChange')!({
        target: { value: 's3://new/checkpoint/location' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    wrapper.update();
    expect(setAccelerationFormData).toHaveBeenCalled();
  });

  it('updates delay window on change for materialized view', () => {
    const materializedViewFormData = {
      ...defaultAccelerationFormData,
      accelerationIndexType: 'materialized',
    };

    const wrapper = mount(
      <IndexSettingOptions
        accelerationFormData={materializedViewFormData}
        setAccelerationFormData={setAccelerationFormData}
      />
    );

    act(() => {
      wrapper.find(EuiFieldNumber).at(1).prop('onChange')!({
        target: { value: '10' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    wrapper.update();
    expect(setAccelerationFormData).toHaveBeenCalled();
  });

  it('updates refresh interval on change', () => {
    const wrapper = mount(
      <IndexSettingOptions
        accelerationFormData={defaultAccelerationFormData}
        setAccelerationFormData={setAccelerationFormData}
      />
    );

    act(() => {
      wrapper.find(EuiSelect).at(0).prop('onChange')!({
        target: { value: ACCELERATION_REFRESH_TIME_INTERVAL[1].value },
      } as React.ChangeEvent<HTMLSelectElement>);
    });

    wrapper.update();
    expect(setAccelerationFormData).toHaveBeenCalled();
  });

  it('updates delay interval on change for materialized view', () => {
    const materializedViewFormData = {
      ...defaultAccelerationFormData,
      accelerationIndexType: 'materialized',
    };

    const wrapper = mount(
      <IndexSettingOptions
        accelerationFormData={materializedViewFormData}
        setAccelerationFormData={setAccelerationFormData}
      />
    );

    act(() => {
      wrapper.find(EuiSelect).at(1).prop('onChange')!({
        target: { value: ACCELERATION_TIME_INTERVAL[1].value },
      } as React.ChangeEvent<HTMLSelectElement>);
    });

    wrapper.update();
    expect(setAccelerationFormData).toHaveBeenCalled();
  });
});

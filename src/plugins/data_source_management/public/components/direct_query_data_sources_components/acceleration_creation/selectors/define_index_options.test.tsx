/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { mount } from 'enzyme';
import React from 'react';
import { EuiFieldText, EuiLink, EuiMarkdownFormat, EuiModal } from '@elastic/eui';
import { DefineIndexOptions } from './define_index_options';
import { CreateAccelerationForm } from '../../../../../framework/types';
import { act } from 'react-dom/test-utils';

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

describe('DefineIndexOptions', () => {
  const setAccelerationFormData = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    const wrapper = mount(
      <DefineIndexOptions
        accelerationFormData={defaultAccelerationFormData}
        setAccelerationFormData={setAccelerationFormData}
      />
    );
    expect(wrapper.find(EuiFieldText).exists()).toBe(true);
  });

  it('updates index name on change', () => {
    const wrapper = mount(
      <DefineIndexOptions
        accelerationFormData={defaultAccelerationFormData}
        setAccelerationFormData={setAccelerationFormData}
      />
    );
    act(() => {
      wrapper.find(EuiFieldText).prop('onChange')({ target: { value: 'new_index_name' } });
    });
    wrapper.update();
    expect(setAccelerationFormData).toHaveBeenCalledWith({
      ...defaultAccelerationFormData,
      accelerationIndexName: 'new_index_name',
    });
  });

  it('opens help modal on help link click', () => {
    const wrapper = mount(
      <DefineIndexOptions
        accelerationFormData={defaultAccelerationFormData}
        setAccelerationFormData={setAccelerationFormData}
      />
    );
    act(() => {
      wrapper.find(EuiLink).prop('onClick')();
    });
    wrapper.update();
    expect(wrapper.find(EuiModal).exists()).toBe(true);
    const markdownText = wrapper.find(EuiMarkdownFormat).text();
    expect(markdownText).toContain('All OpenSearch acceleration indices have a naming format');
    expect(markdownText).toContain('Skipping Index');
    expect(markdownText).toContain('Covering Index');
    expect(markdownText).toContain('Materialized View Index');
    expect(markdownText).toContain('lowercase letters, numbers and underscore');
  });

  it('sets prepend and append values correctly', () => {
    const wrapper = mount(
      <DefineIndexOptions
        accelerationFormData={defaultAccelerationFormData}
        setAccelerationFormData={setAccelerationFormData}
      />
    );
    const prepend = wrapper.find(EuiFieldText).prop('prepend');
    const append = wrapper.find(EuiFieldText).prop('append');

    expect(prepend[0]).toBe('flint_test_source_test_database_test_table_');
    expect(append).toBe('_index');
  });
});

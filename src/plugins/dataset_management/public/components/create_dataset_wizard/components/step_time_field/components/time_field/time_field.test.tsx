/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TimeField } from '../time_field';
import { shallowWithI18nProvider } from 'test_utils/enzyme_helpers';

describe('TimeField', () => {
  it('should render normally', () => {
    const component = shallowWithI18nProvider(
      <TimeField
        isVisible={true}
        fetchTimeFields={() => {}}
        timeFieldOptions={[{ text: '@timestamp', value: '@timestamp' }]}
        isLoading={false}
        selectedTimeField={''}
        onTimeFieldChanged={() => {}}
      />
    );

    expect(component).toMatchSnapshot();
  });

  it('should render something if hiding time field', () => {
    const component = shallowWithI18nProvider(
      <TimeField
        isVisible={false}
        fetchTimeFields={() => {}}
        timeFieldOptions={[{ text: '@timestamp', value: '@timestamp' }]}
        isLoading={false}
        selectedTimeField={''}
        onTimeFieldChanged={() => {}}
      />
    );

    expect(component).toMatchSnapshot();
  });

  it('should render a selected time field', () => {
    const component = shallowWithI18nProvider(
      <TimeField
        isVisible={true}
        fetchTimeFields={() => {}}
        timeFieldOptions={[{ text: '@timestamp', value: '@timestamp' }]}
        isLoading={false}
        selectedTimeField={'@timestamp'}
        onTimeFieldChanged={() => {}}
      />
    );

    expect(component).toMatchSnapshot();
  });

  it('should render a loading state', () => {
    const component = shallowWithI18nProvider(
      <TimeField
        isVisible={true}
        fetchTimeFields={() => {}}
        timeFieldOptions={[{ text: '@timestamp', value: '@timestamp' }]}
        isLoading={true}
        selectedTimeField={'@timestamp'}
        onTimeFieldChanged={() => {}}
      />
    );

    expect(component).toMatchSnapshot();
  });
});

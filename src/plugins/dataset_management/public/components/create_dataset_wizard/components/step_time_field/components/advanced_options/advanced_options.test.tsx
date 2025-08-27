/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AdvancedOptions } from '../advanced_options';
import { shallowWithI18nProvider } from 'test_utils/enzyme_helpers';

describe('AdvancedOptions', () => {
  it('should render normally', () => {
    const component = shallowWithI18nProvider(
      <AdvancedOptions
        isVisible={true}
        datasetId={'foobar'}
        toggleAdvancedOptions={() => {}}
        onChangeDatasetId={() => {}}
      />
    );

    expect(component).toMatchSnapshot();
  });

  it('should hide if not showing', () => {
    const component = shallowWithI18nProvider(
      <AdvancedOptions
        isVisible={false}
        datasetId={'foobar'}
        toggleAdvancedOptions={() => {}}
        onChangeDatasetId={() => {}}
      />
    );

    expect(component).toMatchSnapshot();
  });
});

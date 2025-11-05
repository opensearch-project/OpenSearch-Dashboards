/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { shallowWithI18nProvider } from 'test_utils/enzyme_helpers';

import { FormatEditorSamples } from './samples';

describe('FormatEditorSamples', () => {
  it('should render normally', async () => {
    const component = shallowWithI18nProvider(
      <FormatEditorSamples
        samples={[
          { input: 'test', output: 'TEST' },
          { input: 123, output: '456' },
          { input: ['foo', 'bar'], output: '<span>foo</span>, <span>bar</span>' },
        ]}
      />
    );

    expect(component).toMatchSnapshot();
  });

  it('should render nothing if there are no samples', async () => {
    const component = shallowWithI18nProvider(<FormatEditorSamples samples={[]} />);

    expect(component).toMatchSnapshot();
  });
});

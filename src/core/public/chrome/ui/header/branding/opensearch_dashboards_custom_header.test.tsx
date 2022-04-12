/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { CustomHeader } from './opensearch_dashboards_custom_header';

describe('Styled header', () => {
  it('rendered using default colors', () => {
    const props = {
      branding: { colors: {} },
    };
    const component = mountWithIntl(<CustomHeader {...props} />);
    expect(component).toMatchSnapshot();
  });

  it('rendered using custom colors', () => {
    const props = {
      branding: {
        colors: {
          headerBackgroundColor: '#000000',
          headerLinkColor: '#ffffff',
        },
      },
    };
    const component = mountWithIntl(<CustomHeader {...props} />);
    expect(component).toMatchSnapshot();
  });
});

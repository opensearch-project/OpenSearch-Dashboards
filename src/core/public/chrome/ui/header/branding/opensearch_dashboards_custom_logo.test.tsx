/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import React from 'react';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { CustomLogo } from './opensearch_dashboards_custom_logo';

describe('Custom Logo', () => {
  it('Take in a normal URL string', () => {
    const branding = { logoUrl: '/', className: '' };
    const component = mountWithIntl(<CustomLogo {...branding} />);
    expect(component).toMatchSnapshot();
  });
});

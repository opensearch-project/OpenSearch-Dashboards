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
  it('Take in a normal full logo URL string', () => {
    const branding = { fullLogoUrl: '/custom', title: 'title' };
    const component = mountWithIntl(<CustomLogo {...branding} />);
    expect(component).toMatchSnapshot();
  });

  it('Take in an invalid full logo URL string and a valid logo URL string', () => {
    const branding = { logoUrl: '/custom', title: 'title' };
    const component = mountWithIntl(<CustomLogo {...branding} />);
    expect(component).toMatchSnapshot();
  });

  it('Take in invalid full logo URL and logo URL', () => {
    const branding = { title: 'title' };
    const component = mountWithIntl(<CustomLogo {...branding} />);
    expect(component).toMatchSnapshot();
  });
});

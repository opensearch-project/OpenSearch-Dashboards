/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { shallowWithI18nProvider } from 'test_utils/enzyme_helpers';

import { UrlTemplateFlyout } from './url_template_flyout';

describe('UrlTemplateFlyout', () => {
  it('should render normally', async () => {
    const component = shallowWithI18nProvider(<UrlTemplateFlyout isVisible={true} />);
    expect(component).toMatchSnapshot();
  });

  it('should not render if not visible', async () => {
    const component = shallowWithI18nProvider(<UrlTemplateFlyout />);
    expect(component).toMatchSnapshot();
  });
});

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { shallowWithI18nProvider } from 'test_utils/enzyme_helpers';

import { LabelTemplateFlyout } from './label_template_flyout';

describe('LabelTemplateFlyout', () => {
  it('should render normally', async () => {
    const component = shallowWithI18nProvider(<LabelTemplateFlyout isVisible={true} />);
    expect(component).toMatchSnapshot();
  });

  it('should not render if not visible', async () => {
    const component = shallowWithI18nProvider(<LabelTemplateFlyout />);
    expect(component).toMatchSnapshot();
  });
});

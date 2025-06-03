/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import { DataSourceOptionalLabelSuffix } from '.';

describe('Datasource Management: Optional Label Suffix', () => {
  test('should render normally', () => {
    const component = shallow(<DataSourceOptionalLabelSuffix />);
    expect(component).toMatchSnapshot();
  });
});

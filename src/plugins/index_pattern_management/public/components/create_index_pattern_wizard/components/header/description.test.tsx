/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Description } from './description';
import { mount } from 'enzyme';
import React from 'react';
import { mockManagementPlugin } from '../../../../mocks';

const mockContext = mockManagementPlugin.createIndexPatternManagmentContext();

describe('Description', () => {
  it('render normally', () => {
    // @ts-expect-error TS2739 TODO(ts-error): fixme
    const component = mount(<Description docLinks={mockContext.docLinks} />);
    expect(component).toMatchSnapshot();
  });
});

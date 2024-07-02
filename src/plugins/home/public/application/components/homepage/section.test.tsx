/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiButtonIcon, EuiLink } from '@elastic/eui';
import { mount } from 'enzyme';
import { Section } from './section';

let title: string;
let headerComponent: React.ReactNode;
let render: any;
let component: any;

describe('Home page sections', () => {
  beforeAll(() => {
    title = 'Section title';
    headerComponent = (
      <EuiLink href="https" target="_blank" className="section-links">
        See all documentation
      </EuiLink>
    );
    render = jest.fn();
    component = mount(<Section title={title} render={render} headerComponent={headerComponent} />);
  });

  it('is rendered with title and header component', () => {
    expect(component).toMatchSnapshot();
    expect(component.find(EuiButtonIcon).prop('iconType')).toBe('arrowDown');
  });

  it('can be collapse on and off', () => {
    component.find(EuiButtonIcon).simulate('click');
    expect(component.find(EuiButtonIcon).prop('iconType')).toBe('arrowRight');
  });
});

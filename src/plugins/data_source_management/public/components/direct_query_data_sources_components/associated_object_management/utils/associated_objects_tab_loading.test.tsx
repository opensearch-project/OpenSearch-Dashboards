/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import { AssociatedObjectsTabLoading } from './associated_objects_tab_loading';
import { EuiEmptyPrompt, EuiLoadingSpinner } from '@elastic/eui';

describe('AssociatedObjectsTabLoading', () => {
  const defaultProps = {
    objectType: 'databases',
    warningMessage: false,
  };

  const shallowComponent = (props = defaultProps) =>
    shallow(<AssociatedObjectsTabLoading {...props} />);

  test('renders correctly', () => {
    const wrapper = shallowComponent();
    expect(wrapper).toMatchSnapshot();
  });

  test('displays the loading spinner', () => {
    const wrapper = shallowComponent();
    expect(wrapper.find(EuiEmptyPrompt).prop('icon')).toEqual(<EuiLoadingSpinner size="xl" />);
  });

  test('displays the correct loading message', () => {
    const wrapper = shallowComponent();
    const bodyText = wrapper.find(EuiEmptyPrompt).prop('body') as React.ReactElement;
    const wrapperBody = shallow(<div>{bodyText}</div>);
    expect(wrapperBody.text()).toContain('Loading databases');
  });

  test('displays the warning message when warningMessage is true', () => {
    const wrapper = shallowComponent({ objectType: 'tables', warningMessage: true });
    const bodyText = wrapper.find(EuiEmptyPrompt).prop('body') as React.ReactElement;
    const wrapperBody = shallow(<div>{bodyText}</div>);
    expect(wrapperBody.text()).toContain('This may take a moment.');
  });

  test('does not display the warning message when warningMessage is false', () => {
    const wrapper = shallowComponent({ objectType: 'tables', warningMessage: false });
    const bodyText = wrapper.find(EuiEmptyPrompt).prop('body') as React.ReactElement;
    const wrapperBody = shallow(<div>{bodyText}</div>);
    expect(wrapperBody.text()).not.toContain('This may take a moment.');
    expect(wrapperBody.text()).toContain('Loading tables');
  });
});

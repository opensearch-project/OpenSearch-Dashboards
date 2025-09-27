/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { shallow } from 'enzyme';

import { AddFilter } from './add_filter';

describe('AddFilter', () => {
  test('should render normally', () => {
    const component = shallow(<AddFilter useUpdatedUX onAddFilter={() => {}} />);

    expect(component).toMatchSnapshot();
  });

  test('should match snapshot when useUpdatedUX equal false', () => {
    const component = shallow(<AddFilter useUpdatedUX={false} onAddFilter={() => {}} />);

    expect(component).toMatchSnapshot();
  });

  test('should allow adding a filter', async () => {
    const onAddFilter = jest.fn();
    const component = shallow(<AddFilter useUpdatedUX onAddFilter={onAddFilter} />);

    component.find('EuiCompressedFieldText').simulate('change', { target: { value: 'tim*' } });
    component.find('EuiSmallButton').simulate('click');
    component.update();

    expect(onAddFilter).toBeCalledWith('tim*');
  });

  test('should ignore strings with just spaces', () => {
    const component = shallow(<AddFilter useUpdatedUX onAddFilter={() => {}} />);

    // Set a value in the input field
    component.find('EuiCompressedFieldText').simulate('keypress', ' ');
    component.update();

    expect(component).toMatchSnapshot();
  });
});

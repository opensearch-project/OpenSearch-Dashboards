/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { TableFeedbacksPanel } from './table_feedbacks_panel';

describe('TableFeedbacksPanel', () => {
  let onCloseMock: jest.Mock;
  let onTurnOffMock: jest.Mock;
  let wrapper: ShallowWrapper;

  beforeEach(() => {
    onCloseMock = jest.fn();
    onTurnOffMock = jest.fn();
    wrapper = shallow(<TableFeedbacksPanel onClose={onCloseMock} onTurnOff={onTurnOffMock} />);
  });

  it('renders correctly', () => {
    expect(wrapper).toMatchSnapshot();
  });

  it('calls onClose when the Cancel button is clicked', () => {
    wrapper.find('EuiButtonEmpty').simulate('click');
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('calls onTurnOff when the Turn off new features button is clicked', () => {
    wrapper.find('EuiButton').simulate('click');
    expect(onTurnOffMock).toHaveBeenCalled();
  });
});

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BehaviorSubject } from 'rxjs';
import { render } from '@testing-library/react';
import { LeftBottomActionButton } from './left_bottom_action_button';

const defaultProps = {
  isNavDrawerLocked$: new BehaviorSubject<boolean>(true),
  isChromeVisible$: new BehaviorSubject<boolean>(true),
  iconType: 'logoOpenSearch',
  title: 'Test Button',
  onClick: jest.fn(),
};

describe('<LeftBottomActionButton />', () => {
  it('should render icons and title when nav drawer is open', () => {
    render(<LeftBottomActionButton {...defaultProps} />);

    expect(document.querySelector('.leftBottomActionButton')).toBeInTheDocument();
  });

  it('should only render icon when nav drawer is closed', () => {
    render(
      <LeftBottomActionButton {...defaultProps} isNavDrawerLocked$={new BehaviorSubject(false)} />
    );

    expect(document.querySelector('.leftBottomActionButton')).not.toBeInTheDocument();
  });

  it('should only render icon when chrome is not visible', () => {
    render(
      <LeftBottomActionButton
        {...defaultProps}
        isChromeVisible$={new BehaviorSubject(false)}
        iconType="app"
      />
    );

    expect(document.querySelector('.leftBottomActionButton')).not.toBeInTheDocument();
  });
});

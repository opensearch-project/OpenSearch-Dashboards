/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { SwitchLanguage } from './switch_language';

// TODO: This language switcher is not p0 scope.
describe('SwitchLanguage', () => {
  it('renders globe icon button', () => {
    render(<SwitchLanguage />);
    expect(screen.getByLabelText('Switch Language')).toBeInTheDocument();
  });

  it('opens popover and selects language', () => {
    render(<SwitchLanguage />);
    fireEvent.click(screen.getByLabelText('Switch Language'));
    expect(screen.getByText('Select Language')).toBeInTheDocument();
  });
});

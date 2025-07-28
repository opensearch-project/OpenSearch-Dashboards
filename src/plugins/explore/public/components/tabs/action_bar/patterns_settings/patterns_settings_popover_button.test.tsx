/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { PatternsSettingsPopoverButton } from './patterns_settings_popover_button';

jest.mock('./patterns_settings_popover_content', () => ({
  PatternsSettingsPopoverContent: jest.fn(({ fieldChange }) => (
    <div data-test-subj="mockPatternsSettingsPopoverContent">
      <button data-test-subj="mockFieldChangeButton" onClick={fieldChange}>
        Close Popover
      </button>
    </div>
  )),
}));

describe('PatternsSettingsPopoverButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the button with correct attributes', () => {
    render(<PatternsSettingsPopoverButton />);

    const button = screen.getByTestId('patternsSettingButton');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('data-test-subj', 'patternsSettingButton');
  });

  it('popover is not opened by default', () => {
    render(<PatternsSettingsPopoverButton />);

    expect(screen.queryByTestId('mockPatternsSettingsPopoverContent')).not.toBeInTheDocument();
  });

  it('opens popover when button is clicked', () => {
    render(<PatternsSettingsPopoverButton />);

    const button = screen.getByTestId('patternsSettingButton');
    fireEvent.click(button);

    expect(screen.getByTestId('mockPatternsSettingsPopoverContent')).toBeInTheDocument();
  });
});

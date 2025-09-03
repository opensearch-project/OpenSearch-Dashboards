/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { useSelector } from 'react-redux';
import { PatternsSettingsPopoverButton } from './patterns_settings_popover_button';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
  connect: jest.fn(() => (Component: React.ComponentType<any>) => Component),
}));

jest.mock('../../../../application/utils/state_management/selectors', () => ({
  selectPatternsField: jest.fn(),
}));

jest.mock('./patterns_settings_popover_content', () => ({
  PatternsSettingsPopoverContent: jest.fn(({ fieldChange }) => (
    <div data-test-subj="mockPatternsSettingsPopoverContent">
      <button data-test-subj="mockFieldChangeButton" onClick={fieldChange}>
        Close Popover
      </button>
    </div>
  )),
}));

const PatternsSettingsPopoverButtonHarness = () => {
  return (
    <IntlProvider locale="en">
      <PatternsSettingsPopoverButton />
    </IntlProvider>
  );
};

describe('PatternsSettingsPopoverButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useSelector as jest.Mock).mockReturnValue(null);
  });

  it('renders the button with correct attributes', () => {
    render(<PatternsSettingsPopoverButtonHarness />);

    const button = screen.getByTestId('patternsSettingButton');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('data-test-subj', 'patternsSettingButton');
  });

  it('popover is not opened by default', () => {
    render(<PatternsSettingsPopoverButtonHarness />);

    expect(screen.queryByTestId('mockPatternsSettingsPopoverContent')).not.toBeInTheDocument();
  });

  it('opens popover when button is clicked', () => {
    render(<PatternsSettingsPopoverButtonHarness />);

    const button = screen.getByTestId('patternsSettingButton');
    fireEvent.click(button);

    expect(screen.getByTestId('mockPatternsSettingsPopoverContent')).toBeInTheDocument();
  });

  it('displays the correct text when patternsField is set', () => {
    (useSelector as jest.Mock).mockReturnValue('message');

    render(<PatternsSettingsPopoverButtonHarness />);

    expect(screen.getByText('Patterns field: message')).toBeInTheDocument();
  });

  it('displays the default text when patternsField is not set', () => {
    (useSelector as jest.Mock).mockReturnValue(null);

    render(<PatternsSettingsPopoverButtonHarness />);

    expect(screen.getByText('Select patterns field')).toBeInTheDocument();
  });
});

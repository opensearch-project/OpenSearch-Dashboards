/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { IntlProvider } from 'react-intl';
import { SaveAsDatasetOption } from './save_as_dataset_option';

const renderWithIntl = (component: React.ReactElement) => {
  // @ts-expect-error TS2769 TODO(ts-error): fixme
  return render(<IntlProvider locale="en">{component}</IntlProvider>);
};

describe('SaveAsDatasetOption', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders checkbox with correct label', () => {
    renderWithIntl(
      <SaveAsDatasetOption checked={false} onChange={mockOnChange} disabled={false} />
    );

    expect(screen.getByText('Save as dataset')).toBeInTheDocument();
    expect(screen.getByTestId('saveAsDatasetCheckbox')).toBeInTheDocument();
  });

  it('renders checked state correctly', () => {
    renderWithIntl(<SaveAsDatasetOption checked={true} onChange={mockOnChange} disabled={false} />);

    const checkbox = screen.getByTestId('saveAsDatasetCheckbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('renders unchecked state correctly', () => {
    renderWithIntl(
      <SaveAsDatasetOption checked={false} onChange={mockOnChange} disabled={false} />
    );

    const checkbox = screen.getByTestId('saveAsDatasetCheckbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it('calls onChange when checkbox is clicked', () => {
    renderWithIntl(
      <SaveAsDatasetOption checked={false} onChange={mockOnChange} disabled={false} />
    );

    const checkbox = screen.getByTestId('saveAsDatasetCheckbox');
    fireEvent.click(checkbox);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(true);
  });

  it('renders disabled state correctly', () => {
    renderWithIntl(<SaveAsDatasetOption checked={false} onChange={mockOnChange} disabled={true} />);

    const checkbox = screen.getByTestId('saveAsDatasetCheckbox') as HTMLInputElement;
    expect(checkbox.disabled).toBe(true);
  });

  it('shows warning message when disabled', () => {
    renderWithIntl(<SaveAsDatasetOption checked={false} onChange={mockOnChange} disabled={true} />);

    expect(
      screen.getByText('This data type does not support saving as a dataset.')
    ).toBeInTheDocument();
  });

  it('does not show warning message when enabled', () => {
    renderWithIntl(
      <SaveAsDatasetOption checked={false} onChange={mockOnChange} disabled={false} />
    );

    expect(
      screen.queryByText('This data type does not support saving as a dataset.')
    ).not.toBeInTheDocument();
  });
});

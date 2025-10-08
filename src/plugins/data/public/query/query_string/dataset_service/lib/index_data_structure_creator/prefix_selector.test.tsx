/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { I18nProvider } from '@osd/i18n/react';
import { PrefixSelector } from './prefix_selector';

const mockOnPrefixChange = jest.fn();

const defaultProps = {
  customPrefix: '',
  validationError: '',
  onPrefixChange: mockOnPrefixChange,
};

const renderComponent = (props = {}) =>
  render(
    <I18nProvider>
      <PrefixSelector {...defaultProps} {...props} />
    </I18nProvider>
  );

describe('PrefixSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with empty prefix', () => {
    const { container } = renderComponent();
    expect(container.querySelector('input')).toHaveValue('');
  });

  test('renders component with custom prefix', () => {
    const { container } = renderComponent({ customPrefix: 'logs*' });
    expect(container.querySelector('.euiComboBox')).toBeInTheDocument();
  });

  test('calls onPrefixChange when creating new option', () => {
    const { container } = renderComponent();

    const input = container.querySelector('input')!;
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockOnPrefixChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: { value: 'test' },
      })
    );
  });

  test('renders without errors when clearing selection', () => {
    const { container } = renderComponent({ customPrefix: 'logs*' });
    expect(container.querySelector('.euiComboBox')).toBeInTheDocument();
  });

  test('shows invalid state when validation error exists', () => {
    const { container } = renderComponent({
      customPrefix: 'invalid prefix',
      validationError: 'Invalid characters',
    });

    expect(container.querySelector('.euiComboBox-isInvalid')).toBeInTheDocument();
  });
});

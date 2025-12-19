/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { I18nProvider } from '@osd/i18n/react';
import { MultiWildcardSelector } from './multi_wildcard_selector';

const mockOnPatternsChange = jest.fn();

const defaultProps = {
  patterns: [],
  onPatternsChange: mockOnPatternsChange,
};

const renderComponent = (props = {}) =>
  render(
    <I18nProvider>
      <MultiWildcardSelector {...defaultProps} {...props} />
    </I18nProvider>
  );

describe('MultiWildcardSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with empty patterns', () => {
    renderComponent();
    const input = screen.getByTestId('multiWildcardPatternInput');
    const addButton = screen.getByTestId('multiWildcardAddButton');

    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('');
    expect(addButton).toBeInTheDocument();
    expect(addButton).toBeDisabled();
  });

  test('renders with existing patterns', () => {
    renderComponent({ patterns: ['logs*', 'otel*'] });
    const input = screen.getByTestId('multiWildcardPatternInput');

    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  test('enables Add button when input has value', () => {
    renderComponent();
    const input = screen.getByTestId('multiWildcardPatternInput');
    const addButton = screen.getByTestId('multiWildcardAddButton');

    fireEvent.change(input, { target: { value: 'test*' } });

    expect(addButton).not.toBeDisabled();
  });

  test('auto-appends wildcard for single character input', () => {
    renderComponent();
    const input = screen.getByTestId('multiWildcardPatternInput') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'o' } });

    expect(input.value).toBe('o*');
  });

  test('adds pattern when Add button is clicked', () => {
    renderComponent();
    const input = screen.getByTestId('multiWildcardPatternInput');
    const addButton = screen.getByTestId('multiWildcardAddButton');

    fireEvent.change(input, { target: { value: 'logs*' } });
    fireEvent.click(addButton);

    expect(mockOnPatternsChange).toHaveBeenCalledWith(['logs*']);
  });

  test('adds pattern when Enter key is pressed', () => {
    renderComponent();
    const input = screen.getByTestId('multiWildcardPatternInput');

    fireEvent.change(input, { target: { value: 'otel*' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockOnPatternsChange).toHaveBeenCalledWith(['otel*']);
  });

  test('prevents adding duplicate patterns', () => {
    renderComponent({ patterns: ['logs*'] });
    const input = screen.getByTestId('multiWildcardPatternInput');
    const addButton = screen.getByTestId('multiWildcardAddButton');

    fireEvent.change(input, { target: { value: 'logs*' } });

    expect(addButton).toBeDisabled();
  });

  test('prevents adding duplicate patterns with Add button click', () => {
    renderComponent({ patterns: ['logs*'] });
    const input = screen.getByTestId('multiWildcardPatternInput');
    const addButton = screen.getByTestId('multiWildcardAddButton');

    fireEvent.change(input, { target: { value: 'logs*' } });
    fireEvent.click(addButton);

    // Should not call onPatternsChange since it's a duplicate
    expect(mockOnPatternsChange).not.toHaveBeenCalled();
  });

  test('adds multiple unique patterns', () => {
    renderComponent({ patterns: ['logs*'] });
    const input = screen.getByTestId('multiWildcardPatternInput');

    fireEvent.change(input, { target: { value: 'otel*' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockOnPatternsChange).toHaveBeenCalledWith(['logs*', 'otel*']);
  });

  test('clears input after adding pattern', () => {
    renderComponent();
    const input = screen.getByTestId('multiWildcardPatternInput') as HTMLInputElement;
    const addButton = screen.getByTestId('multiWildcardAddButton');

    fireEvent.change(input, { target: { value: 'metrics*' } });
    fireEvent.click(addButton);

    expect(input.value).toBe('');
  });

  test('trims whitespace from patterns', () => {
    renderComponent();
    const input = screen.getByTestId('multiWildcardPatternInput');

    fireEvent.change(input, { target: { value: '  spaces*  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockOnPatternsChange).toHaveBeenCalledWith(['spaces*']);
  });

  test('ignores non-Enter key presses', () => {
    renderComponent();
    const input = screen.getByTestId('multiWildcardPatternInput');

    fireEvent.change(input, { target: { value: 'test*' } });
    fireEvent.keyDown(input, { key: 'Tab' });

    expect(mockOnPatternsChange).not.toHaveBeenCalled();
  });

  test('ignores Enter key press with empty input', () => {
    renderComponent();
    const input = screen.getByTestId('multiWildcardPatternInput');

    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockOnPatternsChange).not.toHaveBeenCalled();
  });

  test('handles clearing auto-appended wildcard', () => {
    renderComponent();
    const input = screen.getByTestId('multiWildcardPatternInput') as HTMLInputElement;

    // Type single character to trigger auto-wildcard
    fireEvent.change(input, { target: { value: 'o' } });
    expect(input.value).toBe('o*');

    // Clear to just wildcard should clear everything
    fireEvent.change(input, { target: { value: '*' } });
    expect(input.value).toBe('');
  });

  test('handles complex pattern input', () => {
    renderComponent();
    const input = screen.getByTestId('multiWildcardPatternInput');

    fireEvent.change(input, { target: { value: 'application-logs-2024*' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockOnPatternsChange).toHaveBeenCalledWith(['application-logs-2024*']);
  });

  describe('Comma-separated patterns', () => {
    test('splits comma-separated patterns into multiple chips', () => {
      renderComponent();
      const input = screen.getByTestId('multiWildcardPatternInput');

      fireEvent.change(input, { target: { value: 'otel*,logs*' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockOnPatternsChange).toHaveBeenCalledWith(['otel*', 'logs*']);
    });

    test('handles comma-separated patterns with spaces', () => {
      renderComponent();
      const input = screen.getByTestId('multiWildcardPatternInput');

      fireEvent.change(input, { target: { value: 'otel*, logs*, metrics*' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockOnPatternsChange).toHaveBeenCalledWith(['otel*', 'logs*', 'metrics*']);
    });

    test('filters out duplicate patterns when splitting comma-separated input', () => {
      renderComponent({ patterns: ['logs*'] });
      const input = screen.getByTestId('multiWildcardPatternInput');

      fireEvent.change(input, { target: { value: 'otel*,logs*,metrics*' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      // Should only add otel* and metrics*, filtering out duplicate logs*
      expect(mockOnPatternsChange).toHaveBeenCalledWith(['logs*', 'otel*', 'metrics*']);
    });

    test('handles comma-separated patterns with Add button click', () => {
      renderComponent();
      const input = screen.getByTestId('multiWildcardPatternInput');
      const addButton = screen.getByTestId('multiWildcardAddButton');

      fireEvent.change(input, { target: { value: 'app*,web*' } });
      fireEvent.click(addButton);

      expect(mockOnPatternsChange).toHaveBeenCalledWith(['app*', 'web*']);
    });

    test('ignores empty patterns in comma-separated input', () => {
      renderComponent();
      const input = screen.getByTestId('multiWildcardPatternInput');

      fireEvent.change(input, { target: { value: 'otel*,,logs*,' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      // Should ignore empty patterns, and trailing comma gets converted to wildcard
      expect(mockOnPatternsChange).toHaveBeenCalledWith(['otel*', 'logs*', '*']);
    });

    test('disables Add button when all comma-separated patterns are duplicates', () => {
      renderComponent({ patterns: ['otel*', 'logs*'] });
      const input = screen.getByTestId('multiWildcardPatternInput');
      const addButton = screen.getByTestId('multiWildcardAddButton');

      fireEvent.change(input, { target: { value: 'otel*,logs*' } });

      expect(addButton).toBeDisabled();
    });

    test('enables Add button when at least one comma-separated pattern is new', () => {
      renderComponent({ patterns: ['logs*'] });
      const input = screen.getByTestId('multiWildcardPatternInput');
      const addButton = screen.getByTestId('multiWildcardAddButton');

      fireEvent.change(input, { target: { value: 'logs*,otel*' } });

      expect(addButton).not.toBeDisabled();
    });

    test('clears input after adding comma-separated patterns', () => {
      renderComponent();
      const input = screen.getByTestId('multiWildcardPatternInput') as HTMLInputElement;

      fireEvent.change(input, { target: { value: 'test1*,test2*' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(input.value).toBe('');
    });
  });

  describe('Illegal characters validation', () => {
    test('allows wildcard * and comma , as special characters', () => {
      renderComponent();
      const input = screen.getByTestId('multiWildcardPatternInput');
      const addButton = screen.getByTestId('multiWildcardAddButton');

      // Wildcard should be allowed
      fireEvent.change(input, { target: { value: 'logs*' } });
      expect(addButton).not.toBeDisabled();

      // Comma should be allowed (for separating patterns)
      fireEvent.change(input, { target: { value: 'logs*,otel*' } });
      expect(addButton).not.toBeDisabled();
    });

    test('rejects newly added illegal characters (colon, plus, hash)', () => {
      renderComponent();
      const input = screen.getByTestId('multiWildcardPatternInput');
      const addButton = screen.getByTestId('multiWildcardAddButton');

      // Colon should be rejected
      fireEvent.change(input, { target: { value: 'logs:test' } });
      expect(addButton).toBeDisabled();

      // Plus should be rejected
      fireEvent.change(input, { target: { value: 'logs+test' } });
      expect(addButton).toBeDisabled();

      // Hash should be rejected
      fireEvent.change(input, { target: { value: 'logs#test' } });
      expect(addButton).toBeDisabled();
    });

    test('rejects existing illegal characters', () => {
      renderComponent();
      const input = screen.getByTestId('multiWildcardPatternInput');
      const addButton = screen.getByTestId('multiWildcardAddButton');

      // Backslash
      fireEvent.change(input, { target: { value: 'logs\\test' } });
      expect(addButton).toBeDisabled();

      // Forward slash
      fireEvent.change(input, { target: { value: 'logs/test' } });
      expect(addButton).toBeDisabled();

      // Question mark
      fireEvent.change(input, { target: { value: 'logs?test' } });
      expect(addButton).toBeDisabled();
    });
  });
});

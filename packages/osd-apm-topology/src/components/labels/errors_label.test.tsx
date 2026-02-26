/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { render, screen } from '@testing-library/react';
import { ErrorsLabel } from './errors_label';
// Mock the ErrorsSwatch component
jest.mock('../swatches/errors_swatch', () => ({
  ErrorsSwatch: () => <div data-test-subj="mock-errors-swatch" />,
}));

describe('ErrorsLabel', () => {
  it('renders with text and default swatch', () => {
    render(<ErrorsLabel text="Errors" />);

    expect(screen.getByText('Errors')).toBeInTheDocument();
    expect(screen.getByTestId('mock-errors-swatch')).toBeInTheDocument();
  });

  it('renders with custom children', () => {
    render(
      <ErrorsLabel text="Errors">
        <div data-test-subj="custom-child">Custom Child</div>
      </ErrorsLabel>
    );

    expect(screen.getByText('Errors')).toBeInTheDocument();
    expect(screen.getByTestId('custom-child')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-errors-swatch')).not.toBeInTheDocument();
  });
});

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { render, screen } from '../../test-utils/vitest.utilities';
import { ErrorsLabel } from './ErrorsLabel';
// Mock the ErrorsSwatch component
jest.mock('../Swatches/ErrorsSwatch', () => ({
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

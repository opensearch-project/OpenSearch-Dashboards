/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { render, screen } from '../../test_utils/vitest.utilities';
import { OkLabel } from './ok_label';
// Mock the OkSwatch component
jest.mock('../swatches/ok_swatch', () => ({
  OkSwatch: () => <div data-test-subj="mock-ok-swatch" />,
}));

describe('OkLabel', () => {
  it('renders with text and default swatch', () => {
    render(<OkLabel text="Ok" />);

    expect(screen.getByText('Ok')).toBeInTheDocument();
    expect(screen.getByTestId('mock-ok-swatch')).toBeInTheDocument();
  });

  it('renders with custom children', () => {
    render(
      <OkLabel text="Ok">
        <div data-test-subj="custom-child">Custom Child</div>
      </OkLabel>
    );

    expect(screen.getByText('Ok')).toBeInTheDocument();
    expect(screen.getByTestId('custom-child')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-ok-swatch')).not.toBeInTheDocument();
  });
});

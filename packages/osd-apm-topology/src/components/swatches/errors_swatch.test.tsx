/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { render, screen } from '@testing-library/react';
import { ErrorsSwatch } from './errors_swatch';
import { COLOR_SWATCH_TEST_ID } from './color_swatch';

describe('ErrorsSwatch', () => {
  it('renders with the correct color variable', () => {
    render(<ErrorsSwatch />);

    const swatchElement = screen.getByTestId(COLOR_SWATCH_TEST_ID);
    expect(swatchElement).toBeInTheDocument();
    expect(swatchElement).toHaveStyle({ backgroundColor: 'var(--osd-color-errors)' });
  });
});

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { render, screen } from '../../test-utils/vitest.utilities';
import { ErrorsSwatch } from './ErrorsSwatch';
import { COLOR_SWATCH_TEST_ID } from './ColorSwatch';

describe('ErrorsSwatch', () => {
  it('renders with the correct color variable', () => {
    render(<ErrorsSwatch />);

    const swatchElement = screen.getByTestId(COLOR_SWATCH_TEST_ID);
    expect(swatchElement).toBeInTheDocument();
    expect(swatchElement).toHaveStyle({ backgroundColor: 'var(--osd-color-errors)' });
  });
});

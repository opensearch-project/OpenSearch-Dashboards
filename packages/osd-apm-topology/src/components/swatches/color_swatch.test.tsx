/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { render, screen } from '../../test_utils/vitest.utilities';
import { COLOR_SWATCH_TEST_ID, ColorSwatch } from './color_swatch';

describe('ColorSwatch', () => {
  it('renders with the provided color', () => {
    const testColor = '#FF0000';
    render(<ColorSwatch color={testColor} />);

    const swatchElement = screen.getByTestId(COLOR_SWATCH_TEST_ID);
    expect(swatchElement).toBeInTheDocument();
    expect(swatchElement).toHaveStyle({ backgroundColor: testColor });
  });

  it('applies the correct CSS classes', () => {
    render(<ColorSwatch color="#00FF00" />);

    const swatchElement = screen.getByTestId(COLOR_SWATCH_TEST_ID);
    expect(swatchElement).toHaveClass('osd:w-4');
    expect(swatchElement).toHaveClass('osd:aspect-square');
    expect(swatchElement).toHaveClass('osd:rounded-xs');
  });
});

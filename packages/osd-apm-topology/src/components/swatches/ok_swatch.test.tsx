/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { render, screen } from '../../test_utils/vitest.utilities';
import { OkSwatch } from './ok_swatch';
import { COLOR_SWATCH_TEST_ID } from './color_swatch';

describe('OkSwatch', () => {
  it('renders with the correct color variable', () => {
    render(<OkSwatch />);

    const swatchElement = screen.getByTestId(COLOR_SWATCH_TEST_ID);
    expect(swatchElement).toBeInTheDocument();
    expect(swatchElement).toHaveStyle({ backgroundColor: 'var(--osd-color-ok)' });
  });
});

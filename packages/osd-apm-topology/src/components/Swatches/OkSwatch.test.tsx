/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { render, screen } from '../../test-utils/vitest.utilities';
import { OkSwatch } from './OkSwatch';
import { COLOR_SWATCH_TEST_ID } from './ColorSwatch';

describe('OkSwatch', () => {
  it('renders with the correct color variable', () => {
    render(<OkSwatch />);

    const swatchElement = screen.getByTestId(COLOR_SWATCH_TEST_ID);
    expect(swatchElement).toBeInTheDocument();
    expect(swatchElement).toHaveStyle({ backgroundColor: 'var(--osd-color-ok)' });
  });
});

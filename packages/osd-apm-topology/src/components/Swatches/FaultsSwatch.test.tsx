/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { render, screen } from '../../test-utils/vitest.utilities';
import { FaultsSwatch } from './FaultsSwatch';
import { COLOR_SWATCH_TEST_ID } from './ColorSwatch';

describe('FaultsSwatch', () => {
  it('renders with the correct color variable', () => {
    render(<FaultsSwatch />);

    const swatchElement = screen.getByTestId(COLOR_SWATCH_TEST_ID);
    expect(swatchElement).toBeInTheDocument();
    expect(swatchElement).toHaveStyle({ backgroundColor: 'var(--osd-color-faults)' });
  });
});

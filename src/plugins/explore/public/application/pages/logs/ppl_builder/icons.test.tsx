/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render } from '@testing-library/react';
import { CodeToggleIcon } from './icons';

describe('CodeToggleIcon', () => {
  it('renders an inline svg glyph that inherits the current color', () => {
    const { container } = render(<CodeToggleIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    // currentColor lets the button's text color drive the stroke.
    expect(svg).toHaveAttribute('stroke', 'currentColor');
    // The `</>` glyph is drawn as a single path.
    expect(container.querySelector('path')).toBeInTheDocument();
  });
});

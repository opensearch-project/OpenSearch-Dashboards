/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { render } from '@testing-library/react';
import { AbsolutePosition } from './absolute_position';

describe('AbsolutePosition', () => {
  it('renders children correctly', () => {
    const testContent = 'Test Content';
    const { getByText } = render(<AbsolutePosition>{testContent}</AbsolutePosition>);
    expect(getByText(testContent)).toBeInTheDocument();
  });

  it('applies the correct positioning', () => {
    const positionProps = {
      top: '10px',
      left: '20px',
    };

    const { container } = render(
      <AbsolutePosition {...positionProps}>
        <div>Content</div>
      </AbsolutePosition>
    );

    const wrapper = container.firstChild as HTMLElement;

    // Check that positioning styles are applied correctly
    expect(wrapper.style.top).toBe('10px');
    expect(wrapper.style.left).toBe('20px');
  });
});

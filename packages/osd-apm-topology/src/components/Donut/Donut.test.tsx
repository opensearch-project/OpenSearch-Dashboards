/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '../../test-utils/vitest.utilities';
import { Donut, DONUT_TEST_ID, DONUT_ICON_TEST_ID, DONUT_TORUS_TEST_ID } from './Donut';

// Ensure React is available globally for source files using automatic JSX transform
(global as any).React = React;

jest.mock('./components/DonutSegments', () => ({
  DonutSegments: () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const R = require('react');
    return R.createElement('circle', { 'data-test-subj': 'donut-segments' });
  },
}));

const baseProps = {
  segments: [{ percent: 100, color: '#00ff00', label: 'healthy', offset: 0 }],
  iconSize: 24,
  diameter: 60,
  fill: '#ffffff',
  stroke: '#000000',
};

const queryByTestId = (container: HTMLElement, testId: string) =>
  container.querySelector(`[data-test-subj="${testId}"]`) as HTMLElement | null;

describe('Donut', () => {
  it('renders SVG with correct width and height from diameter', () => {
    const { container } = render(<Donut {...baseProps} />);
    const svg = queryByTestId(container, DONUT_TORUS_TEST_ID);
    expect(svg).toBeTruthy();
    expect(svg!.getAttribute('width')).toBe('60');
    expect(svg!.getAttribute('height')).toBe('60');
  });

  it('renders SVG with test-id donut-torus', () => {
    const { container } = render(<Donut {...baseProps} />);
    expect(queryByTestId(container, DONUT_TORUS_TEST_ID)).toBeTruthy();
  });

  it('renders icon container when children provided', () => {
    const { container } = render(
      <Donut {...baseProps}>
        <span>icon</span>
      </Donut>
    );
    expect(queryByTestId(container, DONUT_ICON_TEST_ID)).toBeTruthy();
  });

  it('does not render icon container when no children', () => {
    const { container } = render(<Donut {...baseProps} />);
    expect(queryByTestId(container, DONUT_ICON_TEST_ID)).toBeNull();
  });

  it('applies celDonutInverted class when isInverted is true', () => {
    const { container } = render(
      <Donut {...baseProps} isInverted={true}>
        <span>icon</span>
      </Donut>
    );
    const iconContainer = queryByTestId(container, DONUT_ICON_TEST_ID);
    expect(iconContainer!.className).toContain('celDonutInverted');
  });

  it('does NOT apply celDonutInverted class when isInverted is false', () => {
    const { container } = render(
      <Donut {...baseProps} isInverted={false}>
        <span>icon</span>
      </Donut>
    );
    const iconContainer = queryByTestId(container, DONUT_ICON_TEST_ID);
    expect(iconContainer!.className).not.toContain('celDonutInverted');
  });

  it('sizes icon container to iconSize', () => {
    const { container } = render(
      <Donut {...baseProps} iconSize={32}>
        <span>icon</span>
      </Donut>
    );
    const iconContainer = queryByTestId(container, DONUT_ICON_TEST_ID);
    expect(iconContainer!.style.width).toBe('32px');
    expect(iconContainer!.style.height).toBe('32px');
  });
});

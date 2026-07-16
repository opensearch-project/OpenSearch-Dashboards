/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import { withConnector } from './tree_connector';

const LEVEL_GAP = 12;
const LEVEL_INDENT = 24;

describe('withConnector', () => {
  it('renders the child content', () => {
    render(<div>{withConnector(0, <span data-test-subj="child">row</span>)}</div>);
    expect(screen.getByTestId('child')).toHaveTextContent('row');
  });

  it('indents by depth * LEVEL_INDENT', () => {
    render(<div>{withConnector(2, <span data-test-subj="child">row</span>)}</div>);
    const wrapper = screen.getByTestId('child').closest('div[style]')!.parentElement!;
    expect(wrapper).toHaveStyle({
      marginLeft: `${2 * LEVEL_INDENT}px`,
      marginTop: `${LEVEL_GAP}px`,
    });
  });

  it('draws the vertical line to the bottom for a non-last child', () => {
    const { container } = render(<div>{withConnector(0, <span>row</span>, false)}</div>);
    // First absolutely-positioned line is the vertical rule; non-last => bottom:0.
    const vertical = container.querySelectorAll(
      'div[style*="position: absolute"]'
    )[0] as HTMLElement;
    expect(vertical.style.bottom).toBe('0px');
  });

  it('stops the vertical line at the branch (50%) for the last child', () => {
    const { container } = render(<div>{withConnector(0, <span>row</span>, true)}</div>);
    const vertical = container.querySelectorAll(
      'div[style*="position: absolute"]'
    )[0] as HTMLElement;
    expect(vertical.style.bottom).toBe('50%');
  });

  it('uses a calc() bottom off anchorY for the last child when anchorY is given', () => {
    const { container } = render(<div>{withConnector(0, <span>row</span>, true, 20)}</div>);
    const vertical = container.querySelectorAll(
      'div[style*="position: absolute"]'
    )[0] as HTMLElement;
    expect(vertical.style.bottom).toBe('calc(100% - 20px)');
  });

  it('positions the horizontal branch at anchorY when provided, else 50%', () => {
    const { container: withAnchor } = render(
      <div>{withConnector(0, <span>row</span>, false, 30)}</div>
    );
    const horizontal = withAnchor.querySelectorAll(
      'div[style*="position: absolute"]'
    )[1] as HTMLElement;
    expect(horizontal.style.top).toBe('30px');

    const { container: noAnchor } = render(<div>{withConnector(0, <span>row</span>)}</div>);
    const horizontalDefault = noAnchor.querySelectorAll(
      'div[style*="position: absolute"]'
    )[1] as HTMLElement;
    expect(horizontalDefault.style.top).toBe('50%');
  });

  it('reaches up by the given topReach', () => {
    const { container } = render(
      <div>{withConnector(0, <span>row</span>, false, undefined, 40)}</div>
    );
    const vertical = container.querySelectorAll(
      'div[style*="position: absolute"]'
    )[0] as HTMLElement;
    expect(vertical.style.top).toBe('-40px');
  });
});

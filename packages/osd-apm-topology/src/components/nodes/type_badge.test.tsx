/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '../../test_utils/vitest.utilities';
import { TypeBadge } from './type_badge';

describe('TypeBadge', () => {
  it('renders label text', () => {
    render(<TypeBadge label="Service" color="#006CE0" />);
    expect(screen.getByText('Service')).toBeInTheDocument();
  });

  it('applies backgroundColor from color prop', () => {
    const { container } = render(<TypeBadge label="Agent" color="#006BB4" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.style.backgroundColor).toBe('rgb(0, 107, 180)');
  });

  it('defaults text color to #FFFFFF', () => {
    const { container } = render(<TypeBadge label="Service" color="#006CE0" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.style.color).toBe('rgb(255, 255, 255)');
  });

  it('applies custom textColor', () => {
    const { container } = render(<TypeBadge label="Tool" color="#F5A700" textColor="#1A1A1A" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.style.color).toBe('rgb(26, 26, 26)');
  });

  it('renders icon when provided', () => {
    render(<TypeBadge label="Service" color="#006CE0" icon={<span>icon</span>} />);
    expect(screen.getByText('icon')).toBeInTheDocument();
  });

  it('does not render icon span when no icon', () => {
    const { container } = render(<TypeBadge label="Service" color="#006CE0" />);
    // The badge should only have one child text node (the label)
    const badge = container.firstChild as HTMLElement;
    // With icon, badge has 2 child elements (icon span + label text). Without, just the label text.
    expect(badge.childElementCount).toBe(0);
  });
});

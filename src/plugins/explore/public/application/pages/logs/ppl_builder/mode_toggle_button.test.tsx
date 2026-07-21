/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { ModeToggleButton } from './mode_toggle_button';

describe('ModeToggleButton', () => {
  it('renders the toggle and fires onToggle when clicked', () => {
    const onToggle = jest.fn();
    render(<ModeToggleButton isCode={false} onToggle={onToggle} />);
    const btn = screen.getByTestId('pplBuilderModeToggle');
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('labels the button "Code mode" when in builder mode (not active)', () => {
    render(<ModeToggleButton isCode={false} onToggle={jest.fn()} />);
    const btn = screen.getByTestId('pplBuilderModeToggle');
    expect(btn).toHaveAttribute('aria-label', 'Code mode');
    expect(btn.className).not.toContain('plqIconBtn--active');
  });

  it('labels the button "Builder mode" and marks it active when in code mode', () => {
    render(<ModeToggleButton isCode={true} onToggle={jest.fn()} />);
    const btn = screen.getByTestId('pplBuilderModeToggle');
    expect(btn).toHaveAttribute('aria-label', 'Builder mode');
    expect(btn.className).toContain('plqIconBtn--active');
  });

  it('disables the toggle when disabled is set', () => {
    const onToggle = jest.fn();
    render(<ModeToggleButton isCode={false} onToggle={onToggle} disabled />);
    const btn = screen.getByTestId('pplBuilderModeToggle');
    expect(btn).toBeDisabled();
  });
});

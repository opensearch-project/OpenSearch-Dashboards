/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatusIndicator } from './status_indicator';
import type { StatusLevel } from './status_indicator';

describe('StatusIndicator', () => {
  const statusIcons: Record<StatusLevel, string> = {
    ok: '\u2713',
    warning: '\u26A0',
    error: '\u2716',
    critical: '\u2716',
    unknown: '\u2014',
  };

  it.each<StatusLevel>(['ok', 'warning', 'error', 'critical', 'unknown'])(
    'renders default icon character for status "%s"',
    (status) => {
      render(<StatusIndicator status={status} />);
      expect(screen.getByText(statusIcons[status])).toBeInTheDocument();
    }
  );

  it.each<StatusLevel>(['ok', 'warning', 'error', 'critical', 'unknown'])(
    'renders icon element with role="img" for status "%s"',
    (status) => {
      const { container } = render(<StatusIndicator status={status} />);
      const iconSpan = container.querySelector('[role="img"]') as HTMLElement;
      expect(iconSpan).toBeTruthy();
      expect(iconSpan).toHaveAttribute('aria-label', status);
      // Note: jsdom drops CSS var() values, so we cannot assert on inline color.
      // The color is set via STATUS_COLORS[status] in the source.
    }
  );

  it('renders custom icon when provided', () => {
    render(<StatusIndicator status="error" icon={<span data-test-subj="custom-icon">!</span>} />);
    // When custom icon is provided, no role="img" element is rendered
    expect(screen.getByText('!')).toBeInTheDocument();
  });

  it('renders label text when provided', () => {
    render(<StatusIndicator status="error" label="SLI breach" />);
    expect(screen.getByText('SLI breach')).toBeInTheDocument();
  });

  it('does not render label when not provided', () => {
    const { container } = render(<StatusIndicator status="ok" />);
    // Only the icon span should be present, no label span
    const outerSpan = container.firstChild as HTMLElement;
    expect(outerSpan.children).toHaveLength(1);
  });

  it('sets role="img" and aria-label on default icon', () => {
    render(<StatusIndicator status="warning" />);
    const iconEl = screen.getByRole('img');
    expect(iconEl).toHaveAttribute('aria-label', 'warning');
  });
});

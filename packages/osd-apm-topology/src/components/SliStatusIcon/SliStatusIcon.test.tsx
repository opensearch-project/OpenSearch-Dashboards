/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { render, screen } from '../../test-utils/vitest.utilities';
import { SLI_STATUS_ICON_TEST_ID, SliStatusIcon } from './SliStatusIcon';

describe('SliStatus', () => {
  const defaultProps = {
    status: 'alarm' as const,
    size: 24,
  };

  it('renders alarm icon correctly', () => {
    render(<SliStatusIcon {...defaultProps} />);
    const sliStatus = screen.getByTestId(SLI_STATUS_ICON_TEST_ID('alarm'));
    expect(sliStatus).toBeInTheDocument();
    expect(sliStatus).toHaveAttribute('role', 'img');
    expect(sliStatus).toHaveAttribute('aria-label', 'Sli status');
  });

  it('renders recovered icon correctly', () => {
    render(<SliStatusIcon {...defaultProps} status="recovered" />);
    const sliStatus = screen.getByTestId(SLI_STATUS_ICON_TEST_ID('recovered'));
    expect(sliStatus).toBeInTheDocument();
  });

  it('applies pulsing animation class when isPulsing is true', () => {
    render(<SliStatusIcon {...defaultProps} isPulsing={true} />);
    const sliStatus = screen.getByTestId(SLI_STATUS_ICON_TEST_ID('alarm'));
    expect(sliStatus.className).toContain('celAnimated');
  });

  it('does not apply pulsing animation class when isPulsing is false', () => {
    render(<SliStatusIcon {...defaultProps} isPulsing={false} />);

    const sliStatus = screen.getByTestId(SLI_STATUS_ICON_TEST_ID('alarm'));
    expect(sliStatus.className).not.toContain('celAnimated');
  });

  it('applies correct size to icons', () => {
    const customSize = 48;
    render(<SliStatusIcon {...defaultProps} size={customSize} />);

    const sliStatus = screen.getByTestId(SLI_STATUS_ICON_TEST_ID('alarm'));
    expect(sliStatus).toHaveStyle({
      width: `${customSize}px`,
      height: `${customSize}px`,
    });
  });
});

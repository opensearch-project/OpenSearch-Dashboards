/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { render, screen } from '@testing-library/react';
import { BreachedLabel } from './breached_label';
// Mock the SliStatusIcon component
jest.mock('../sli_status_icon', () => ({
  SliStatusIcon: () => <div data-test-subj="mock-sli-status-icon" />,
}));

describe('BreachedLabel', () => {
  it('renders with text and default icon', () => {
    render(<BreachedLabel text="Breached" />);

    expect(screen.getByText('Breached')).toBeInTheDocument();
    expect(screen.getByTestId('mock-sli-status-icon')).toBeInTheDocument();
  });

  it('renders with custom children', () => {
    render(
      <BreachedLabel text="Breached">
        <div data-test-subj="custom-child">Custom Child</div>
      </BreachedLabel>
    );

    expect(screen.getByText('Breached')).toBeInTheDocument();
    expect(screen.getByTestId('custom-child')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-sli-status-icon')).not.toBeInTheDocument();
  });
});

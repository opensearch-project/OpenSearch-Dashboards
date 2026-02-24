/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { render, screen } from '../../test-utils/vitest.utilities';
import { AlarmLabel } from './AlarmLabel';
// Mock the SliStatusIcon component
jest.mock('../SliStatusIcon', () => ({
  SliStatusIcon: () => <div data-test-subj="mock-sli-status-icon" />,
}));

describe('AlarmLabel', () => {
  it('renders with text and default icon', () => {
    render(<AlarmLabel text="Alarm" />);

    expect(screen.getByText('Alarm')).toBeInTheDocument();
    expect(screen.getByTestId('mock-sli-status-icon')).toBeInTheDocument();
  });

  it('renders with custom children', () => {
    render(
      <AlarmLabel text="Alarm">
        <div data-test-subj="custom-child">Custom Child</div>
      </AlarmLabel>
    );

    expect(screen.getByText('Alarm')).toBeInTheDocument();
    expect(screen.getByTestId('custom-child')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-sli-status-icon')).not.toBeInTheDocument();
  });
});

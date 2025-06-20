/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { Actions } from './index';

// Mock registry
jest.mock('./registry', () => ({
  queryBarActionsRegistry: {
    getAll: () => [
      { label: 'Set up an alert from query', iconType: 'bell', onClick: jest.fn() },
      { label: 'Suggest anomaly detection', iconType: 'logPatternAnalysis', onClick: jest.fn() },
    ],
  },
}));

describe('Actions', () => {
  it('renders Actions button', () => {
    render(<Actions />);
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('opens popover and shows actions', () => {
    render(<Actions />);
    fireEvent.click(screen.getByText('Actions'));
    expect(screen.getByText('Set up an alert from query')).toBeInTheDocument();
    expect(screen.getByText('Suggest anomaly detection')).toBeInTheDocument();
  });
});

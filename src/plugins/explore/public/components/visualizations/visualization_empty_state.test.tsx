/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { VisualizationEmptyState } from './visualization_empty_state';

describe('VisualizationEmptyState', () => {
  it('renders empty state with title and tabs', () => {
    render(<VisualizationEmptyState />);

    expect(
      screen.getByText('Select a visualization type and fields to get started')
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Sample queries' })).toBeInTheDocument();
  });

  it('displays help content by default', () => {
    render(<VisualizationEmptyState />);

    expect(screen.getByText('Reference documentations')).toBeInTheDocument();
  });

  it('displays sample queries when tab is selected', () => {
    render(<VisualizationEmptyState />);

    const sampleTab = screen.getByRole('tab', { name: 'Sample queries' });
    sampleTab.click();

    expect(screen.getByText('Top services with faults')).toBeInTheDocument();
    expect(screen.getByText('Top slow operations')).toBeInTheDocument();
    expect(screen.getByText('Top slow database statements')).toBeInTheDocument();
  });
});

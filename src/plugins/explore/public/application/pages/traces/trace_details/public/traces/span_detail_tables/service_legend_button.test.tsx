/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ServiceLegendButton } from './service_legend_button';

describe('ServiceLegendButton', () => {
  const mockColorMap = {
    'service-1': '#FF0000',
    'service-2': '#00FF00',
    'service-3': '#0000FF',
  };

  const mockServicesInOrder = ['service-1', 'service-2', 'service-3'];

  it('renders button when services are provided', () => {
    render(<ServiceLegendButton servicesInOrder={mockServicesInOrder} colorMap={mockColorMap} />);

    expect(screen.getByTestId('service-legend-toggle')).toBeInTheDocument();
    expect(screen.getByText('Service legend')).toBeInTheDocument();
  });

  it('does not render when no services provided', () => {
    render(<ServiceLegendButton servicesInOrder={[]} colorMap={mockColorMap} />);

    expect(screen.queryByTestId('service-legend-toggle')).not.toBeInTheDocument();
  });

  it('opens popover when button is clicked', () => {
    render(<ServiceLegendButton servicesInOrder={mockServicesInOrder} colorMap={mockColorMap} />);

    const button = screen.getByTestId('service-legend-toggle');
    fireEvent.click(button);

    expect(screen.getByText('service-1')).toBeInTheDocument();
    expect(screen.getByText('service-2')).toBeInTheDocument();
    expect(screen.getByText('service-3')).toBeInTheDocument();
  });

  it('closes popover when button is clicked again', async () => {
    render(<ServiceLegendButton servicesInOrder={mockServicesInOrder} colorMap={mockColorMap} />);

    const button = screen.getByTestId('service-legend-toggle');
    fireEvent.click(button);

    expect(screen.getByText('service-1')).toBeInTheDocument();

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.queryByText('service-1')).not.toBeInTheDocument();
    });
  });

  it('displays correct colors for services', () => {
    render(<ServiceLegendButton servicesInOrder={mockServicesInOrder} colorMap={mockColorMap} />);

    const button = screen.getByTestId('service-legend-toggle');
    fireEvent.click(button);

    const colorIndicators = screen.getAllByRole('generic').filter((el) => el.style.backgroundColor);

    expect(colorIndicators).toHaveLength(3);
  });
});

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { Legend } from './Legend';
jest.mock('../../shared/resources', () => ({
  LegendIcon: 'legend-icon.svg',
}));

jest.mock('./LegendPanel', () => ({
  LegendPanel: ({ onClose }: { onClose: () => void }) => (
    <div data-test-subj="legend-panel">
      <div>Legend</div>
      <button onClick={onClose} />
    </div>
  ),
}));

jest.mock('../Portal', () => ({
  Portal: ({ children, position }: { children: React.ReactNode; position: any }) => (
    <div data-test-subj="portal" data-position={JSON.stringify(position)}>
      {children}
    </div>
  ),
}));

describe('Legend Component', () => {
  it('renders the legend button correctly', () => {
    render(<Legend />);

    const button = screen.getByRole('button', { name: /toggle legend/i });
    expect(button).toBeInTheDocument();
    const icon = button.querySelector('img');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('src', 'legend-icon.svg');
  });

  it('opens the legend popup when button is clicked', () => {
    render(<Legend />);

    expect(screen.queryByTestId('legend-panel')).not.toBeInTheDocument();

    const button = screen.getByRole('button', { name: /toggle legend/i });
    fireEvent.click(button);

    expect(screen.getByTestId('legend-panel')).toBeInTheDocument();
    expect(screen.getByText('Legend')).toBeInTheDocument();
  });

  it('closes the legend popup when close button is clicked', () => {
    render(<Legend />);

    const button = screen.getByRole('button', { name: /toggle legend/i });
    fireEvent.click(button);

    expect(screen.getByTestId('legend-panel')).toBeInTheDocument();

    const closeButton = screen.getByRole('button', { name: '' });
    fireEvent.click(closeButton);

    expect(screen.queryByTestId('legend-panel')).not.toBeInTheDocument();
  });

  it('positions the legend panel correctly when opened', () => {
    // Mock getBoundingClientRect
    const mockRect = {
      x: 200,
      y: 100,
      width: 32,
      height: 32,
      top: 100,
      right: 232,
      bottom: 132,
      left: 200,
      toJSON: () => ({}),
    };
    Element.prototype.getBoundingClientRect = jest.fn(() => mockRect as DOMRect);

    render(<Legend />);

    const button = screen.getByRole('button', { name: /toggle legend/i });
    fireEvent.click(button);

    const portal = screen.getByTestId('portal');
    const position = JSON.parse(portal.getAttribute('data-position') || '{}');
    expect(position).toEqual({
      top: 100,
      right: 829,
    });
  });
});

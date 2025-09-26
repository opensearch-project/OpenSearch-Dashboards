/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChartControls } from './chart_controls';
import { NormalizedSeries } from './types';

// Mock EUI components that might have complex implementations
jest.mock('@elastic/eui', () => ({
  ...jest.requireActual('@elastic/eui'),
  EuiColorPaletteDisplay: ({ palette }: any) => (
    <div data-test-subj="color-palette" style={{ backgroundColor: palette[0]?.color }} />
  ),
}));

describe('ChartControls', () => {
  const mockSeries: NormalizedSeries[] = [
    {
      id: 'series-1',
      name: 'CPU Usage',
      data: [{ x: new Date(), y: 50 }],
      color: '#FF0000',
      visible: true,
    },
    {
      id: 'series-2',
      name: 'Memory Usage',
      data: [{ x: new Date(), y: 75 }],
      color: '#00FF00',
      visible: true,
    },
    {
      id: 'series-3',
      name: 'Very Long Series Name That Should Be Truncated',
      data: [{ x: new Date(), y: 25 }],
      color: '#0000FF',
      visible: false,
    },
  ];

  const defaultProps = {
    onExpand: jest.fn(),
    showExpandButton: true,
    series: mockSeries,
    onSeriesToggle: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Expand Button', () => {
    it('renders expand button when showExpandButton is true', () => {
      render(<ChartControls {...defaultProps} />);

      const expandButton = screen.getByTestId('chart-expand-button');
      expect(expandButton).toBeInTheDocument();
      expect(expandButton).toHaveAttribute('aria-label', 'Expand chart to full view');
    });

    it('does not render expand button when showExpandButton is false', () => {
      render(<ChartControls {...defaultProps} showExpandButton={false} />);

      const expandButton = screen.queryByTestId('chart-expand-button');
      expect(expandButton).not.toBeInTheDocument();
    });

    it('calls onExpand when expand button is clicked', () => {
      const onExpand = jest.fn();
      render(<ChartControls {...defaultProps} onExpand={onExpand} />);

      const expandButton = screen.getByTestId('chart-expand-button');
      fireEvent.click(expandButton);

      expect(onExpand).toHaveBeenCalledTimes(1);
    });

    it('does not crash when onExpand is not provided', () => {
      render(<ChartControls {...defaultProps} onExpand={undefined} />);

      const expandButton = screen.getByTestId('chart-expand-button');
      expect(() => fireEvent.click(expandButton)).not.toThrow();
    });
  });

  describe('Legend Controls', () => {
    it('renders legend button when multiple series are present', () => {
      render(<ChartControls {...defaultProps} />);

      const legendButton = screen.getByTestId('chart-legend-button');
      expect(legendButton).toBeInTheDocument();
      expect(legendButton).toHaveAttribute('aria-label', 'Toggle series legend');
    });

    it('does not render legend button when only one series is present', () => {
      render(<ChartControls {...defaultProps} series={[mockSeries[0]]} />);

      const legendButton = screen.queryByTestId('chart-legend-button');
      expect(legendButton).not.toBeInTheDocument();
    });

    it('does not render legend button when no series are present', () => {
      render(<ChartControls {...defaultProps} series={[]} />);

      const legendButton = screen.queryByTestId('chart-legend-button');
      expect(legendButton).not.toBeInTheDocument();
    });

    it('opens legend popover when legend button is clicked', async () => {
      render(<ChartControls {...defaultProps} />);

      const legendButton = screen.getByTestId('chart-legend-button');
      fireEvent.click(legendButton);

      await waitFor(() => {
        const popover = screen.getByTestId('chart-legend-popover');
        expect(popover).toBeInTheDocument();
      });
    });

    it('displays correct visible series count in popover title', async () => {
      render(<ChartControls {...defaultProps} />);

      const legendButton = screen.getByTestId('chart-legend-button');
      fireEvent.click(legendButton);

      await waitFor(() => {
        const title = screen.getByText('Data Series (2/3 visible)');
        expect(title).toBeInTheDocument();
      });
    });
  });

  describe('Series Toggle Controls', () => {
    it('renders series toggle switches for each series', async () => {
      render(<ChartControls {...defaultProps} />);

      const legendButton = screen.getByTestId('chart-legend-button');
      fireEvent.click(legendButton);

      await waitFor(() => {
        expect(screen.getByTestId('series-toggle-series-1')).toBeInTheDocument();
        expect(screen.getByTestId('series-toggle-series-2')).toBeInTheDocument();
        expect(screen.getByTestId('series-toggle-series-3')).toBeInTheDocument();
      });
    });

    it('shows correct initial state for series toggles', async () => {
      render(<ChartControls {...defaultProps} />);

      const legendButton = screen.getByTestId('chart-legend-button');
      fireEvent.click(legendButton);

      await waitFor(() => {
        const toggle1 = screen.getByTestId('series-toggle-series-1').querySelector('input');
        const toggle2 = screen.getByTestId('series-toggle-series-2').querySelector('input');
        const toggle3 = screen.getByTestId('series-toggle-series-3').querySelector('input');

        expect(toggle1).toBeChecked();
        expect(toggle2).toBeChecked();
        expect(toggle3).not.toBeChecked();
      });
    });

    it('calls onSeriesToggle when a series toggle is clicked', async () => {
      const onSeriesToggle = jest.fn();
      render(<ChartControls {...defaultProps} onSeriesToggle={onSeriesToggle} />);

      const legendButton = screen.getByTestId('chart-legend-button');
      fireEvent.click(legendButton);

      await waitFor(() => {
        const toggle1 = screen.getByTestId('series-toggle-series-1');
        fireEvent.click(toggle1);

        expect(onSeriesToggle).toHaveBeenCalledWith('series-1');
      });
    });

    it('truncates long series names', async () => {
      render(<ChartControls {...defaultProps} />);

      const legendButton = screen.getByTestId('chart-legend-button');
      fireEvent.click(legendButton);

      await waitFor(() => {
        const longNameElement = screen.getByText('Very Long Series Name...');
        expect(longNameElement).toBeInTheDocument();
        expect(longNameElement).toHaveAttribute(
          'title',
          'Very Long Series Name That Should Be Truncated'
        );
      });
    });

    it('does not truncate short series names', async () => {
      render(<ChartControls {...defaultProps} />);

      const legendButton = screen.getByTestId('chart-legend-button');
      fireEvent.click(legendButton);

      await waitFor(() => {
        const shortNameElement = screen.getByText('CPU Usage');
        expect(shortNameElement).toBeInTheDocument();
      });
    });
  });

  describe('Show/Hide All Controls', () => {
    it('renders show all and hide all buttons', async () => {
      render(<ChartControls {...defaultProps} />);

      const legendButton = screen.getByTestId('chart-legend-button');
      fireEvent.click(legendButton);

      await waitFor(() => {
        expect(screen.getByTestId('show-all-series-button')).toBeInTheDocument();
        expect(screen.getByTestId('hide-all-series-button')).toBeInTheDocument();
      });
    });

    it('disables show all button when all series are visible', async () => {
      const allVisibleSeries = mockSeries.map((s) => ({ ...s, visible: true }));
      render(<ChartControls {...defaultProps} series={allVisibleSeries} />);

      const legendButton = screen.getByTestId('chart-legend-button');
      fireEvent.click(legendButton);

      await waitFor(() => {
        const showAllButton = screen.getByTestId('show-all-series-button');
        expect(showAllButton).toBeDisabled();
      });
    });

    it('disables hide all button when only one series is visible', async () => {
      const oneVisibleSeries = mockSeries.map((s, index) => ({
        ...s,
        visible: index === 0,
      }));
      render(<ChartControls {...defaultProps} series={oneVisibleSeries} />);

      const legendButton = screen.getByTestId('chart-legend-button');
      fireEvent.click(legendButton);

      await waitFor(() => {
        const hideAllButton = screen.getByTestId('hide-all-series-button');
        expect(hideAllButton).toBeDisabled();
      });
    });

    it('calls onSeriesToggle for each hidden series when show all is clicked', async () => {
      const onSeriesToggle = jest.fn();
      render(<ChartControls {...defaultProps} onSeriesToggle={onSeriesToggle} />);

      const legendButton = screen.getByTestId('chart-legend-button');
      fireEvent.click(legendButton);

      await waitFor(() => {
        const showAllButton = screen.getByTestId('show-all-series-button');
        fireEvent.click(showAllButton);

        // Should only call for the hidden series (series-3)
        expect(onSeriesToggle).toHaveBeenCalledWith('series-3');
        expect(onSeriesToggle).toHaveBeenCalledTimes(1);
      });
    });

    it('calls onSeriesToggle for visible series when hide all is clicked', async () => {
      const onSeriesToggle = jest.fn();
      render(<ChartControls {...defaultProps} onSeriesToggle={onSeriesToggle} />);

      const legendButton = screen.getByTestId('chart-legend-button');
      fireEvent.click(legendButton);

      await waitFor(() => {
        const hideAllButton = screen.getByTestId('hide-all-series-button');
        fireEvent.click(hideAllButton);

        // Should call for visible series except keep at least one visible
        // With 2 visible series, should hide 1 (keeping 1 visible)
        expect(onSeriesToggle).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Color Display', () => {
    it('displays series colors in the legend', async () => {
      render(<ChartControls {...defaultProps} />);

      const legendButton = screen.getByTestId('chart-legend-button');
      fireEvent.click(legendButton);

      await waitFor(() => {
        const colorPalettes = screen.getAllByTestId('color-palette');
        expect(colorPalettes).toHaveLength(3);
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for buttons', () => {
      render(<ChartControls {...defaultProps} />);

      const expandButton = screen.getByTestId('chart-expand-button');
      const legendButton = screen.getByTestId('chart-legend-button');

      expect(expandButton).toHaveAttribute('aria-label', 'Expand chart to full view');
      expect(legendButton).toHaveAttribute('aria-label', 'Toggle series legend');
    });

    it('has proper ARIA labels for show/hide all buttons', async () => {
      render(<ChartControls {...defaultProps} />);

      const legendButton = screen.getByTestId('chart-legend-button');
      fireEvent.click(legendButton);

      await waitFor(() => {
        const showAllButton = screen.getByTestId('show-all-series-button');
        const hideAllButton = screen.getByTestId('hide-all-series-button');

        expect(showAllButton).toHaveAttribute('aria-label', 'Show all series');
        expect(hideAllButton).toHaveAttribute('aria-label', 'Hide all series');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles missing onSeriesToggle callback gracefully', async () => {
      render(<ChartControls {...defaultProps} onSeriesToggle={undefined} />);

      const legendButton = screen.getByTestId('chart-legend-button');
      fireEvent.click(legendButton);

      await waitFor(() => {
        const toggle1 = screen.getByTestId('series-toggle-series-1');
        expect(() => fireEvent.click(toggle1)).not.toThrow();
      });
    });

    it('handles empty series array', () => {
      render(<ChartControls {...defaultProps} series={[]} />);

      const controls = screen.getByTestId('chart-controls');
      expect(controls).toBeInTheDocument();

      const legendButton = screen.queryByTestId('chart-legend-button');
      expect(legendButton).not.toBeInTheDocument();
    });

    it('handles series without colors', async () => {
      const seriesWithoutColors = mockSeries.map((s) => ({ ...s, color: undefined }));
      render(<ChartControls {...defaultProps} series={seriesWithoutColors} />);

      const legendButton = screen.getByTestId('chart-legend-button');
      fireEvent.click(legendButton);

      await waitFor(() => {
        const colorPalettes = screen.getAllByTestId('color-palette');
        expect(colorPalettes).toHaveLength(3);
        // Should use default color #006BB4
      });
    });
  });
});

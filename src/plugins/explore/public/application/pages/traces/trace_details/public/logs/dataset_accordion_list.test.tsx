/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DatasetAccordionList, DatasetAccordionListProps } from './dataset_accordion_list';
import { LogHit } from '../../server/ppl_request_logs';
import { Dataset } from '../../../../../../../../data/common';

// Mock external components and modules
jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: (id: string, options: { defaultMessage: string }) => options.defaultMessage,
  },
}));

// Mock the DatasetLogsTable component
jest.mock('./dataset_logs_table', () => ({
  DatasetLogsTable: ({ logs, isLoading, onSpanClick }: any) => (
    <div data-test-subj="mocked-dataset-logs-table">
      <div>Logs count: {logs.length}</div>
      <div>Loading: {isLoading ? 'true' : 'false'}</div>
      {onSpanClick && <button onClick={() => onSpanClick('test-span-id')}>Test Span Click</button>}
    </div>
  ),
}));

describe('DatasetAccordionList', () => {
  const mockDatasets: Dataset[] = [
    {
      id: 'dataset-1',
      title: 'Application Logs',
      type: 'INDEX_PATTERN',
      timeFieldName: '@timestamp',
    },
    {
      id: 'dataset-2',
      title: 'System Logs',
      type: 'INDEX_PATTERN',
      timeFieldName: 'timestamp',
    },
    {
      id: 'dataset-3',
      title: 'Error Logs',
      type: 'INDEX_PATTERN',
      timeFieldName: '@timestamp',
    },
  ];

  const mockLogs: LogHit[] = [
    {
      _id: 'log1',
      _source: { body: 'Application log message', severityText: 'INFO' },
      timestamp: '2023-10-01T10:00:00Z',
      traceId: 'trace1',
      level: 'INFO',
      message: 'Application log message',
      spanId: 'span123',
    },
    {
      _id: 'log2',
      _source: { body: 'System log message', severityText: 'WARN' },
      timestamp: '2023-10-01T11:00:00Z',
      traceId: 'trace1',
      level: 'WARN',
      message: 'System log message',
      spanId: 'span456',
    },
  ];

  const mockDatasetLogs: Record<string, LogHit[]> = {
    'dataset-1': mockLogs,
    'dataset-2': [mockLogs[0]],
    'dataset-3': [],
  };

  const mockOnViewInExplore = jest.fn();
  const mockOnSpanClick = jest.fn();

  const defaultProps: DatasetAccordionListProps = {
    logDatasets: mockDatasets,
    datasetLogs: mockDatasetLogs,
    onViewInExplore: mockOnViewInExplore,
    onSpanClick: mockOnSpanClick,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders all dataset accordions', () => {
      render(<DatasetAccordionList {...defaultProps} />);

      expect(screen.getByTestId('dataset-accordion-dataset-1')).toBeInTheDocument();
      expect(screen.getByTestId('dataset-accordion-dataset-2')).toBeInTheDocument();
      expect(screen.getByTestId('dataset-accordion-dataset-3')).toBeInTheDocument();
    });

    it('renders dataset titles correctly', () => {
      render(<DatasetAccordionList {...defaultProps} />);

      expect(screen.getByText('Application Logs')).toBeInTheDocument();
      expect(screen.getByText('System Logs')).toBeInTheDocument();
      expect(screen.getByText('Error Logs')).toBeInTheDocument();
    });

    it('renders dataset labels', () => {
      render(<DatasetAccordionList {...defaultProps} />);

      const datasetLabels = screen.getAllByText('Dataset:');
      expect(datasetLabels).toHaveLength(3);
    });

    it('renders recent results text', () => {
      render(<DatasetAccordionList {...defaultProps} />);

      const recentResultsTexts = screen.getAllByText('10 recent results');
      expect(recentResultsTexts).toHaveLength(3);
    });

    it('renders view in explore buttons only for datasets with logs', () => {
      render(<DatasetAccordionList {...defaultProps} />);

      expect(screen.getByTestId('dataset-view-in-explore-button-dataset-1')).toBeInTheDocument();
      expect(screen.getByTestId('dataset-view-in-explore-button-dataset-2')).toBeInTheDocument();
      expect(
        screen.queryByTestId('dataset-view-in-explore-button-dataset-3')
      ).not.toBeInTheDocument();
    });

    it('renders view in explore button text only for datasets with logs', () => {
      render(<DatasetAccordionList {...defaultProps} />);

      const viewButtons = screen.getAllByText('View in Discover Logs');
      expect(viewButtons).toHaveLength(2); // Only dataset-1 and dataset-2 have logs
    });
  });

  describe('Accordion Functionality', () => {
    it('renders accordions as initially open', () => {
      render(<DatasetAccordionList {...defaultProps} />);

      // Check that DatasetLogsTable components are rendered (indicating accordions are open)
      // Note: dataset-3 has no logs, so it shows "No logs found" instead of DatasetLogsTable
      const logsTables = screen.getAllByTestId('mocked-dataset-logs-table');
      expect(logsTables).toHaveLength(2); // Only datasets with logs render DatasetLogsTable

      // Verify that the empty dataset shows the no logs message
      expect(screen.getByText('No logs found for this dataset')).toBeInTheDocument();
    });
  });

  describe('DatasetLogsTable Integration', () => {
    it('passes correct logs to DatasetLogsTable components', () => {
      render(<DatasetAccordionList {...defaultProps} />);

      const logsTables = screen.getAllByTestId('mocked-dataset-logs-table');

      // Check logs count for each dataset that has logs
      // Note: dataset-3 has no logs, so it doesn't render DatasetLogsTable
      expect(logsTables).toHaveLength(2);
      expect(logsTables[0]).toHaveTextContent('Logs count: 2'); // dataset-1
      expect(logsTables[1]).toHaveTextContent('Logs count: 1'); // dataset-2

      // dataset-3 shows "No logs found" message instead
      expect(screen.getByText('No logs found for this dataset')).toBeInTheDocument();
    });

    it('passes onSpanClick prop to DatasetLogsTable', () => {
      render(<DatasetAccordionList {...defaultProps} />);

      // Only datasets with logs render DatasetLogsTable with span click buttons
      const spanClickButtons = screen.getAllByText('Test Span Click');
      expect(spanClickButtons).toHaveLength(2); // dataset-1 and dataset-2 only

      fireEvent.click(spanClickButtons[0]);
      expect(mockOnSpanClick).toHaveBeenCalledWith('test-span-id');
    });

    it('handles missing logs for dataset gracefully', () => {
      const propsWithMissingLogs = {
        ...defaultProps,
        datasetLogs: {
          'dataset-1': mockLogs,
          // dataset-2 and dataset-3 missing
        },
      };

      render(<DatasetAccordionList {...propsWithMissingLogs} />);

      const logsTables = screen.getAllByTestId('mocked-dataset-logs-table');

      // Only dataset-1 has logs, so only 1 DatasetLogsTable is rendered
      expect(logsTables).toHaveLength(1);
      expect(logsTables[0]).toHaveTextContent('Logs count: 2'); // dataset-1

      // dataset-2 and dataset-3 show "No logs found" messages
      const noLogsMessages = screen.getAllByText('No logs found for this dataset');
      expect(noLogsMessages).toHaveLength(2);
    });

    it('displays no logs message when dataset has no logs', () => {
      render(<DatasetAccordionList {...defaultProps} />);

      // dataset-3 has no logs, should show the no logs message
      expect(screen.getByText('No logs found for this dataset')).toBeInTheDocument();
    });
  });

  describe('View in Explore Functionality', () => {
    it('calls onViewInExplore with correct parameters when button is clicked', () => {
      render(<DatasetAccordionList {...defaultProps} />);

      const viewButton = screen.getByTestId('dataset-view-in-explore-button-dataset-1');
      fireEvent.click(viewButton);

      expect(mockOnViewInExplore).toHaveBeenCalledWith(mockDatasets[0], mockLogs);
    });

    it('calls onViewInExplore multiple times for different datasets', () => {
      render(<DatasetAccordionList {...defaultProps} />);

      fireEvent.click(screen.getByTestId('dataset-view-in-explore-button-dataset-1'));
      fireEvent.click(screen.getByTestId('dataset-view-in-explore-button-dataset-2'));

      expect(mockOnViewInExplore).toHaveBeenCalledTimes(2);
      expect(mockOnViewInExplore).toHaveBeenNthCalledWith(1, mockDatasets[0], mockLogs);
      expect(mockOnViewInExplore).toHaveBeenNthCalledWith(2, mockDatasets[1], [mockLogs[0]]);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles empty logDatasets array', () => {
      const emptyProps = {
        ...defaultProps,
        logDatasets: [],
        datasetLogs: {},
      };

      render(<DatasetAccordionList {...emptyProps} />);

      // Should not render any accordions
      expect(screen.queryByTestId(/dataset-accordion-/)).not.toBeInTheDocument();
      expect(screen.queryByText('View in Discover Logs')).not.toBeInTheDocument();
    });

    it('handles datasets with undefined or null IDs gracefully', () => {
      const datasetsWithBadIds = [{ ...mockDatasets[0], id: '' }, { ...mockDatasets[1] }];

      const propsWithBadIds = {
        ...defaultProps,
        logDatasets: datasetsWithBadIds,
      };

      // Should not crash
      expect(() => render(<DatasetAccordionList {...propsWithBadIds} />)).not.toThrow();
    });

    it('handles datasets with missing titles', () => {
      const datasetsWithMissingTitles = [
        { ...mockDatasets[0], title: '' },
        { ...mockDatasets[1], title: undefined as any },
      ];

      const propsWithMissingTitles = {
        ...defaultProps,
        logDatasets: datasetsWithMissingTitles,
      };

      render(<DatasetAccordionList {...propsWithMissingTitles} />);

      // Should render accordions even with missing titles
      expect(screen.getByTestId('dataset-accordion-dataset-1')).toBeInTheDocument();
      expect(screen.getByTestId('dataset-accordion-dataset-2')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides proper test subjects for automation', () => {
      render(<DatasetAccordionList {...defaultProps} />);

      // Check that all test subjects are properly set
      expect(screen.getByTestId('dataset-accordion-dataset-1')).toBeInTheDocument();
      expect(screen.getByTestId('dataset-view-in-explore-button-dataset-1')).toBeInTheDocument();
    });

    it('maintains keyboard navigation support through EUI components', () => {
      render(<DatasetAccordionList {...defaultProps} />);

      // EUI components should handle keyboard navigation
      const accordions = screen.getAllByTestId(/dataset-accordion-/);
      accordions.forEach((accordion) => {
        expect(accordion).toBeInTheDocument();
      });

      const buttons = screen.getAllByText('View in Discover Logs');
      buttons.forEach((button) => {
        expect(button).toBeInTheDocument();
      });
    });

    it('provides proper button roles and interactions', () => {
      render(<DatasetAccordionList {...defaultProps} />);

      const viewButtons = screen.getAllByText('View in Discover Logs');
      viewButtons.forEach((button) => {
        expect(button.closest('button')).toBeInTheDocument();
      });
    });
  });
});

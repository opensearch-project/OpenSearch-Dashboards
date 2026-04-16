/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ShareModal } from './share_modal';
import type { Message, AssistantMessage, UserMessage, ToolMessage } from '../../common/types';

// Mock the export functions
const mockExportAsPdf = jest.fn();
const mockExportAsMarkdown = jest.fn();
const mockCollectChatExportData = jest.fn().mockReturnValue({
  question: 'What caused the crash?',
  answer: 'Found 3,247 crash events.',
  traces: [],
  metadata: { timestamp: '2026-04-08T16:42:00Z', threadId: 'thread-123' },
});

jest.mock('../services/export', () => ({
  collectChatExportData: (...args: any[]) => mockCollectChatExportData(...args),
  exportAsPdf: (...args: any[]) => mockExportAsPdf(...args),
  exportAsMarkdown: (...args: any[]) => mockExportAsMarkdown(...args),
}));

// Mock useOpenSearchDashboards
const mockAddDanger = jest.fn();
jest.mock('../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: () => ({
    services: {
      core: {
        notifications: {
          toasts: {
            addDanger: mockAddDanger,
          },
        },
      },
    },
  }),
}));

describe('ShareModal', () => {
  const mockPrintWindow = {
    document: { write: jest.fn(), close: jest.fn() },
    print: jest.fn(),
    close: jest.fn(),
    onload: null as any,
  };

  const mockTimeline: Message[] = [
    { id: 'u1', role: 'user', content: 'What caused the crash?' } as UserMessage,
    {
      id: 'a1',
      role: 'assistant',
      content: 'Found 3,247 crash events.',
      toolCalls: [
        {
          id: 'tc1',
          type: 'function',
          function: { name: 'LogTool', arguments: '{}' },
        },
      ],
    } as AssistantMessage,
    { id: 'tr1', role: 'tool', content: 'Results', toolCallId: 'tc1' } as ToolMessage,
  ];

  const defaultProps = {
    onClose: jest.fn(),
    timeline: mockTimeline,
    targetMessage: mockTimeline[1] as AssistantMessage,
    threadId: 'thread-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(window, 'open').mockReturnValue(mockPrintWindow as any);
  });

  it('should render the modal with title and description', () => {
    render(<ShareModal {...defaultProps} />);
    expect(screen.getByText('Share Investigation')).toBeInTheDocument();
    expect(
      screen.getByText('Export this investigation as a self-contained report anyone can open.')
    ).toBeInTheDocument();
  });

  it('should render all checkboxes with correct defaults', () => {
    render(<ShareModal {...defaultProps} />);

    const summaryCheckbox = screen.getByLabelText(/AI Summary/);
    const tracesCheckbox = screen.getByLabelText(/Evidence/);
    const metadataCheckbox = screen.getByLabelText(/Metadata/);

    expect(summaryCheckbox).toBeChecked();
    expect(tracesCheckbox).toBeChecked();
    expect(metadataCheckbox).not.toBeChecked();
  });

  it('should render format selector with PDF selected by default', () => {
    render(<ShareModal {...defaultProps} />);
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('Markdown')).toBeInTheDocument();
  });

  it('should render note text area', () => {
    render(<ShareModal {...defaultProps} />);
    expect(screen.getByPlaceholderText(/texture cache issue/)).toBeInTheDocument();
  });

  it('should render Cancel and Download Report buttons', () => {
    render(<ShareModal {...defaultProps} />);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Download Report')).toBeInTheDocument();
  });

  it('should call onClose when Cancel is clicked', () => {
    render(<ShareModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should disable Download Report when no checkboxes are selected', () => {
    render(<ShareModal {...defaultProps} />);

    // Uncheck all checkboxes
    fireEvent.click(screen.getByLabelText(/AI Summary/));
    fireEvent.click(screen.getByLabelText(/Evidence/));
    fireEvent.click(screen.getByLabelText(/Visualizations/));

    const downloadButton = screen.getByText('Download Report');
    expect(downloadButton.closest('button')).toBeDisabled();
  });

  it('should enable Download Report when at least one checkbox is selected', () => {
    render(<ShareModal {...defaultProps} />);

    const downloadButton = screen.getByText('Download Report');
    expect(downloadButton.closest('button')).not.toBeDisabled();
  });

  it('should call exportAsPdf when PDF format is selected and Download is clicked', async () => {
    render(<ShareModal {...defaultProps} />);

    fireEvent.click(screen.getByText('Download Report'));

    await waitFor(() => {
      expect(mockCollectChatExportData).toHaveBeenCalledWith(
        mockTimeline,
        mockTimeline[1],
        'thread-123',
        expect.objectContaining({
          includeAISummary: true,
          includeTraces: true,
          includeVisualizations: true,
          includeMetadata: false,
          format: 'pdf',
        })
      );
      expect(mockExportAsPdf).toHaveBeenCalled();
      expect(mockExportAsMarkdown).not.toHaveBeenCalled();
    });
  });

  it('should default to PDF format when Download is clicked', async () => {
    render(<ShareModal {...defaultProps} />);

    fireEvent.click(screen.getByText('Download Report'));

    await waitFor(() => {
      expect(mockCollectChatExportData).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ format: 'pdf' })
      );
      expect(mockExportAsPdf).toHaveBeenCalled();
    });
  });

  it('should close modal after successful export', async () => {
    render(<ShareModal {...defaultProps} />);

    fireEvent.click(screen.getByText('Download Report'));

    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it('should show error toast when export fails', async () => {
    mockCollectChatExportData.mockImplementationOnce(() => {
      throw new Error('Export failed');
    });

    render(<ShareModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Download Report'));

    await waitFor(() => {
      expect(mockAddDanger).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Export failed',
        })
      );
    });
  });

  it('should not close modal when export fails', async () => {
    mockCollectChatExportData.mockImplementationOnce(() => {
      throw new Error('Export failed');
    });

    render(<ShareModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Download Report'));

    await waitFor(() => {
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  it('should pass note to export options when provided', async () => {
    render(<ShareModal {...defaultProps} />);

    const noteInput = screen.getByPlaceholderText(/texture cache issue/);
    fireEvent.change(noteInput, { target: { value: 'Check v2.1.3' } });
    fireEvent.click(screen.getByText('Download Report'));

    await waitFor(() => {
      expect(mockCollectChatExportData).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ note: 'Check v2.1.3' })
      );
    });
  });

  it('should toggle checkboxes correctly', () => {
    render(<ShareModal {...defaultProps} />);

    const summaryCheckbox = screen.getByLabelText(/AI Summary/);
    expect(summaryCheckbox).toBeChecked();

    fireEvent.click(summaryCheckbox);
    expect(summaryCheckbox).not.toBeChecked();

    fireEvent.click(summaryCheckbox);
    expect(summaryCheckbox).toBeChecked();
  });
});

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useAssistantAction } from '../../../context_provider/public';
import { ChatService } from '../services/chat_service';
import { SWITCH_DATA_SOURCE_TOOL_NAME } from '../../common';
import { useSwitchDataSourceAction } from './switch_data_source_action';

jest.mock('../../../context_provider/public');

describe('useSwitchDataSourceAction', () => {
  let mockUseAssistantAction: jest.MockedFunction<typeof useAssistantAction>;
  let registeredAction: any;
  let mockChatService: jest.Mocked<ChatService>;

  const renderHook = () => {
    const TestComponent = () => {
      useSwitchDataSourceAction(mockChatService);
      return <div>Test</div>;
    };
    render(<TestComponent />);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAssistantAction = useAssistantAction as jest.MockedFunction<typeof useAssistantAction>;
    mockUseAssistantAction.mockImplementation((action) => {
      registeredAction = action;
    });

    mockChatService = {
      getAvailableDataSources: jest.fn().mockResolvedValue([
        { id: 'ds-a', title: 'Cluster A' },
        { id: 'ds-b', title: 'Cluster B' },
        { id: 'ds-c', title: 'Cluster C' },
      ]),
      getCurrentDataSourceInfo: jest.fn().mockResolvedValue({ id: 'ds-a', title: 'Cluster A' }),
      getSessionDataSourceList: jest.fn().mockReturnValue(['ds-a', 'ds-b']),
      setConfirmedDataSourceId: jest.fn(),
      validateDataSourceId: jest.fn().mockResolvedValue({
        valid: true,
        dataSource: { id: 'ds-a', title: 'Cluster A' },
        availableDataSources: [
          { id: 'ds-a', title: 'Cluster A' },
          { id: 'ds-b', title: 'Cluster B' },
          { id: 'ds-c', title: 'Cluster C' },
        ],
      }),
    } as unknown as jest.Mocked<ChatService>;
  });

  it('should register the tool', () => {
    renderHook();

    expect(mockUseAssistantAction).toHaveBeenCalledWith(
      expect.objectContaining({
        name: SWITCH_DATA_SOURCE_TOOL_NAME,
        handler: expect.any(Function),
        render: expect.any(Function),
        requiresConfirmation: true,
        enabled: true,
      })
    );
  });

  describe('handler', () => {
    it('should refuse to switch until the user confirms a choice', async () => {
      renderHook();

      const result = await registeredAction.handler({ reason: 'need a conversation-level choice' });

      expect(result).toEqual({
        success: false,
        message: 'Waiting for the user to choose a data source.',
      });
      expect(mockChatService.validateDataSourceId).not.toHaveBeenCalled();
      expect(mockChatService.setConfirmedDataSourceId).not.toHaveBeenCalled();
    });

    it('should confirm the current data source and resolve its title', async () => {
      renderHook();

      const result = await registeredAction.handler({
        selectedDataSourceId: 'ds-a',
        confirmed: true,
      });

      expect(mockChatService.validateDataSourceId).toHaveBeenCalledWith('ds-a');
      expect(mockChatService.setConfirmedDataSourceId).toHaveBeenCalledWith('ds-a');
      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          dataSourceId: 'ds-a',
          datasourceTitle: 'Cluster A',
          message: 'Confirmed "Cluster A" as the active data source for this conversation.',
        })
      );
    });

    it('should still confirm the selected data source when it differs from the current one', async () => {
      (mockChatService.getCurrentDataSourceInfo as jest.Mock).mockResolvedValue({
        id: 'ds-b',
        title: 'Cluster B',
      });
      renderHook();

      const result = await registeredAction.handler({
        selectedDataSourceId: 'ds-a',
        confirmed: true,
      });

      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          dataSourceId: 'ds-a',
          datasourceTitle: 'Cluster A',
          message: 'Confirmed "Cluster A" as the active data source for this conversation.',
        })
      );
    });

    it('should prefer the authoritative title over the one the LLM passed', async () => {
      renderHook();

      const result = await registeredAction.handler({
        selectedDataSourceId: 'ds-a',
        selectedDataSourceTitle: 'Whatever the LLM guessed',
        confirmed: true,
      });

      expect(result.datasourceTitle).toBe('Cluster A');
    });

    it('should reject an id that is not a known data source without mutating state', async () => {
      (mockChatService.validateDataSourceId as jest.Mock).mockResolvedValue({
        valid: false,
        availableDataSources: [
          { id: 'ds-a', title: 'Cluster A' },
          { id: 'ds-b', title: 'Cluster B' },
        ],
      });
      renderHook();

      const result = await registeredAction.handler({
        selectedDataSourceId: 'an-index-pattern-id',
        confirmed: true,
      });

      expect(result.success).toBe(false);
      // The error names the valid ids so the LLM can correct itself in the same turn.
      expect(result.message).toContain('ds-a');
      expect(result.message).toContain('ds-b');
      expect(mockChatService.setConfirmedDataSourceId).not.toHaveBeenCalled();
    });

    it('should reject an empty id', async () => {
      renderHook();

      const result = await registeredAction.handler({ selectedDataSourceId: '', confirmed: true });

      expect(result.success).toBe(false);
      expect(result.message).toBe('The user must choose a data source from the conversation list.');
      expect(mockChatService.validateDataSourceId).not.toHaveBeenCalled();
      expect(mockChatService.setConfirmedDataSourceId).not.toHaveBeenCalled();
    });

    it('should report a failure when validation throws', async () => {
      (mockChatService.validateDataSourceId as jest.Mock).mockRejectedValue(new Error('boom'));
      renderHook();

      const result = await registeredAction.handler({
        selectedDataSourceId: 'ds-a',
        confirmed: true,
      });

      expect(result).toEqual({ success: false, message: 'boom' });
      expect(mockChatService.setConfirmedDataSourceId).not.toHaveBeenCalled();
    });
  });

  describe('render', () => {
    const renderCard = (props: any) => {
      renderHook();
      render(<>{registeredAction.render(props)}</>);
    };

    it('should show the resolved title when the switch succeeded', () => {
      renderCard({
        status: 'complete',
        args: {},
        result: JSON.stringify({
          success: true,
          dataSourceId: 'ds-a',
          datasourceTitle: 'Cluster A',
        }),
      });

      expect(screen.getByText('Switched to')).toBeInTheDocument();
      expect(screen.getByText('Cluster A')).toBeInTheDocument();
    });

    it('should show the failure message when the switch was rejected', () => {
      renderCard({
        status: 'complete',
        args: {},
        result: JSON.stringify({ success: false, message: 'Unknown dataSourceId "bogus".' }),
      });

      expect(screen.getByText('Unknown dataSourceId "bogus".')).toBeInTheDocument();
    });

    it('should ignore a non-object tool result without rendering a data source label', () => {
      // JSON.parse accepts a bare number/array; those must not be read as a result shape.
      renderCard({ status: 'complete', args: { selectedDataSourceId: 'ds-a' }, result: '42' });

      expect(screen.getByText('Switched to')).toBeInTheDocument();
      expect(screen.queryByText('ds-a')).not.toBeInTheDocument();
      expect(screen.queryByText('Failed to switch data source')).not.toBeInTheDocument();
    });

    it('should show a picker with the data sources already seen in the conversation', async () => {
      renderCard({
        status: 'executing',
        args: { reason: 'the next tool needs a conversation-level data source choice' },
      });

      expect(screen.getByText('Choose a data source to continue')).toBeInTheDocument();
      await waitFor(() => expect(screen.getByText('Cluster B')).toBeInTheDocument());
      expect(screen.getByText('Cluster A')).toBeInTheDocument();
      expect(
        screen.getByText('Reason: the next tool needs a conversation-level data source choice')
      ).toBeInTheDocument();
      expect(screen.queryByText('Cluster C')).not.toBeInTheDocument();
    });

    it('should pass the human-selected data source back through onApprove', async () => {
      renderHook();
      const onApprove = jest.fn();

      render(
        <>
          {registeredAction.render({
            status: 'executing',
            args: {},
            onApprove,
          })}
        </>
      );

      await waitFor(() => expect(screen.getByText('Cluster B')).toBeInTheDocument());
      fireEvent.click(screen.getByText('Cluster B'));

      expect(onApprove).toHaveBeenCalledWith({
        selectedDataSourceId: 'ds-b',
        selectedDataSourceTitle: 'Cluster B',
      });
    });
  });
});

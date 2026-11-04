/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
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
      getThreadId: jest.fn().mockReturnValue('thread-1'),
      setConversationDataSource: jest.fn(),
      // ds-b is the conversation's data source, so switching to ds-a is a real switch.
      getConversationDataSourceId: jest.fn().mockReturnValue('ds-b'),
      getPendingDataSourceId: jest.fn().mockReturnValue(undefined),
      // No page dataset pins a data source unless a test says so.
      getPageDataSource: jest.fn().mockResolvedValue(undefined),
      verifyDataSourceId: jest.fn().mockResolvedValue({
        dataSource: { id: 'ds-a', title: 'Cluster A' },
        available: [
          { id: 'ds-a', title: 'Cluster A' },
          { id: 'ds-b', title: 'Cluster B' },
          { id: 'ds-c', title: 'Cluster C' },
        ],
        unverifiable: false,
      }),
    } as unknown as jest.Mocked<ChatService>;
  });

  it('should register the tool as a pure apply action (no confirmation gate)', () => {
    renderHook();

    expect(mockUseAssistantAction).toHaveBeenCalledWith(
      expect.objectContaining({
        name: SWITCH_DATA_SOURCE_TOOL_NAME,
        handler: expect.any(Function),
        render: expect.any(Function),
        useCustomRenderer: true,
        enabled: true,
      })
    );
    // The tool no longer blocks on a picker/confirmation — selecting is delegated to ask_user.
    expect(registeredAction.requiresConfirmation).toBeUndefined();
    // dataSourceId is the single required argument.
    expect(registeredAction.parameters.required).toEqual(['dataSourceId']);
  });

  describe('handler', () => {
    it('should record a verified data source that is not the conversation one', async () => {
      renderHook();

      const result = await registeredAction.handler({ dataSourceId: 'ds-a' });

      expect(mockChatService.verifyDataSourceId).toHaveBeenCalledWith('ds-a');
      expect(mockChatService.setConversationDataSource).toHaveBeenCalledWith('ds-a');
      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          dataSourceId: 'ds-a',
          datasourceTitle: 'Cluster A',
          message: 'Confirmed "Cluster A" as the active data source for this conversation.',
        })
      );
    });

    it('should skip, still carrying the id, when the id is already the recorded data source', async () => {
      (mockChatService.getConversationDataSourceId as jest.Mock).mockReturnValue('ds-a');
      renderHook();

      const result = await registeredAction.handler({ dataSourceId: 'ds-a' });

      expect(mockChatService.setConversationDataSource).not.toHaveBeenCalled();
      // The id stays in the result so the conversation history still records it.
      expect(result).toEqual(
        expect.objectContaining({ success: true, skipped: true, dataSourceId: 'ds-a' })
      );
      expect(result.message).toContain('already the active data source');
    });

    it('should record a pending choice even when it is already the conversation one', async () => {
      (mockChatService.getConversationDataSourceId as jest.Mock).mockReturnValue('ds-a');
      (mockChatService.getPendingDataSourceId as jest.Mock).mockReturnValue('ds-a');
      renderHook();

      const result = await registeredAction.handler({ dataSourceId: 'ds-a' });

      expect(mockChatService.setConversationDataSource).toHaveBeenCalledWith('ds-a');
      expect(result).toEqual(expect.objectContaining({ success: true, dataSourceId: 'ds-a' }));
      expect(result.skipped).toBeUndefined();
    });

    it('should reject an id that is not a known data source without mutating state', async () => {
      (mockChatService.verifyDataSourceId as jest.Mock).mockResolvedValue({
        available: [
          { id: 'ds-a', title: 'Cluster A' },
          { id: 'ds-b', title: 'Cluster B' },
        ],
        unverifiable: false,
      });
      renderHook();

      const result = await registeredAction.handler({ dataSourceId: 'an-index-pattern-id' });

      expect(result.success).toBe(false);
      // The error names the valid ids so the LLM can correct itself in the same turn.
      expect(result.message).toContain('ds-a');
      expect(result.message).toContain('ds-b');
      expect(mockChatService.setConversationDataSource).not.toHaveBeenCalled();
    });

    it('should reject a missing / empty id without verifying or mutating state', async () => {
      renderHook();

      const missing = await registeredAction.handler({});
      const empty = await registeredAction.handler({ dataSourceId: '' });

      expect(missing.success).toBe(false);
      expect(missing.message).toBe('A dataSourceId is required to switch the data source.');
      expect(empty.success).toBe(false);
      expect(mockChatService.verifyDataSourceId).not.toHaveBeenCalled();
      expect(mockChatService.setConversationDataSource).not.toHaveBeenCalled();
    });

    it('should not switch, and ask to retry, when the data source cannot be verified', async () => {
      (mockChatService.verifyDataSourceId as jest.Mock).mockResolvedValue({
        available: [{ id: 'ds-b', title: 'Cluster B' }],
        unverifiable: true,
      });
      renderHook();

      const result = await registeredAction.handler({ dataSourceId: 'ds-a' });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Could not verify data source "ds-a" right now');
      expect(result.message).not.toContain('Valid data source ids are');
      expect(mockChatService.setConversationDataSource).not.toHaveBeenCalled();
    });

    it('should not switch, and say why, when the page dataset pins another data source', async () => {
      (mockChatService.getPageDataSource as jest.Mock).mockResolvedValue({
        id: 'ds-b',
        title: 'Cluster B',
      });
      renderHook();

      const result = await registeredAction.handler({ dataSourceId: 'ds-a' });

      expect(result.success).toBe(false);
      expect(result.message).toContain('not switched to "Cluster A"');
      expect(result.message).toContain('belongs to "Cluster B"');
      expect(result.message).toContain('select a dataset from "Cluster A"');
      expect(mockChatService.setConversationDataSource).not.toHaveBeenCalled();
    });

    it('should record the page data source when the user names it on that page', async () => {
      (mockChatService.getPageDataSource as jest.Mock).mockResolvedValue({
        id: 'ds-a',
        title: 'Cluster A',
      });
      renderHook();

      const result = await registeredAction.handler({ dataSourceId: 'ds-a' });

      expect(result.success).toBe(true);
      expect(mockChatService.setConversationDataSource).toHaveBeenCalledWith('ds-a');
    });

    it('should report an unknown id rather than the page pin when the id is not a data source', async () => {
      (mockChatService.getPageDataSource as jest.Mock).mockResolvedValue({
        id: 'ds-b',
        title: 'Cluster B',
      });
      (mockChatService.verifyDataSourceId as jest.Mock).mockResolvedValue({
        available: [
          { id: 'ds-a', title: 'Cluster A' },
          { id: 'ds-b', title: 'Cluster B' },
        ],
        unverifiable: false,
      });
      renderHook();

      const result = await registeredAction.handler({ dataSourceId: 'not-a-data-source' });

      // Changing the page dataset would not help, so the agent is told the id is wrong.
      expect(result.success).toBe(false);
      expect(result.message).toContain('Unknown dataSourceId "not-a-data-source"');
      expect(mockChatService.getPageDataSource).not.toHaveBeenCalled();
      expect(mockChatService.setConversationDataSource).not.toHaveBeenCalled();
    });

    it('should not record the switch when the conversation changed while it was checked', async () => {
      (mockChatService.getThreadId as jest.Mock)
        .mockReturnValueOnce('thread-1')
        .mockReturnValue('thread-2');
      renderHook();

      const result = await registeredAction.handler({ dataSourceId: 'ds-a' });

      expect(result.success).toBe(false);
      expect(result.message).toContain('conversation changed');
      expect(mockChatService.setConversationDataSource).not.toHaveBeenCalled();
    });

    it('should report a failure when verification throws', async () => {
      (mockChatService.verifyDataSourceId as jest.Mock).mockRejectedValue(new Error('boom'));
      renderHook();

      const result = await registeredAction.handler({ dataSourceId: 'ds-a' });

      expect(result).toEqual({ success: false, message: 'boom' });
      expect(mockChatService.setConversationDataSource).not.toHaveBeenCalled();
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
        result: JSON.stringify({
          success: true,
          dataSourceId: 'ds-a',
          datasourceTitle: 'Cluster A',
        }),
      });

      expect(screen.getByText('Switched to')).toBeInTheDocument();
      expect(screen.getByText('Cluster A')).toBeInTheDocument();
    });

    it('should not render switch UI when the tool call was skipped', () => {
      renderCard({
        status: 'complete',
        result: JSON.stringify({
          success: true,
          skipped: true,
          dataSourceId: 'ds-a',
        }),
      });

      expect(screen.queryByText('Switched to')).not.toBeInTheDocument();
      expect(screen.queryByText('ds-a')).not.toBeInTheDocument();
    });

    it('should show the failure message when the switch was rejected', () => {
      renderCard({
        status: 'complete',
        result: JSON.stringify({ success: false, message: 'Unknown dataSourceId "bogus".' }),
      });

      expect(screen.getByText('Unknown dataSourceId "bogus".')).toBeInTheDocument();
    });

    it('should ignore a non-object tool result without rendering a data source label', () => {
      // JSON.parse accepts a bare number/array; those must not be read as a result shape.
      renderCard({ status: 'complete', result: '42' });

      expect(screen.getByText('Switched to')).toBeInTheDocument();
      expect(screen.queryByText('ds-a')).not.toBeInTheDocument();
      expect(screen.queryByText('Failed to switch data source')).not.toBeInTheDocument();
    });

    it('should show a spinner while the switch is still executing', () => {
      renderCard({ status: 'executing' });

      expect(screen.getByText('Switching data source…')).toBeInTheDocument();
    });
  });
});

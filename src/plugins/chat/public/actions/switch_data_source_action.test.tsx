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
    it('should set the confirmed data source and resolve its authoritative title', async () => {
      renderHook();

      const result = await registeredAction.handler({ dataSourceId: 'ds-a' });

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

    it('should reject an id that is not a known data source without mutating state', async () => {
      (mockChatService.validateDataSourceId as jest.Mock).mockResolvedValue({
        valid: false,
        availableDataSources: [
          { id: 'ds-a', title: 'Cluster A' },
          { id: 'ds-b', title: 'Cluster B' },
        ],
      });
      renderHook();

      const result = await registeredAction.handler({ dataSourceId: 'an-index-pattern-id' });

      expect(result.success).toBe(false);
      // The error names the valid ids so the LLM can correct itself in the same turn.
      expect(result.message).toContain('ds-a');
      expect(result.message).toContain('ds-b');
      expect(mockChatService.setConfirmedDataSourceId).not.toHaveBeenCalled();
    });

    it('should reject a missing / empty id without validating or mutating state', async () => {
      renderHook();

      const missing = await registeredAction.handler({});
      const empty = await registeredAction.handler({ dataSourceId: '' });

      expect(missing.success).toBe(false);
      expect(missing.message).toBe('A dataSourceId is required to switch the data source.');
      expect(empty.success).toBe(false);
      expect(mockChatService.validateDataSourceId).not.toHaveBeenCalled();
      expect(mockChatService.setConfirmedDataSourceId).not.toHaveBeenCalled();
    });

    it('should report a failure when validation throws', async () => {
      (mockChatService.validateDataSourceId as jest.Mock).mockRejectedValue(new Error('boom'));
      renderHook();

      const result = await registeredAction.handler({ dataSourceId: 'ds-a' });

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

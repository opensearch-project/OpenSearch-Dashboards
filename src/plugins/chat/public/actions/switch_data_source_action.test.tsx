/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
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
      setLLMDataSourceId: jest.fn(),
      validateDataSourceId: jest.fn().mockResolvedValue({
        valid: true,
        dataSource: { id: 'ds-a', title: 'Cluster A' },
        availableDataSources: [
          { id: 'ds-a', title: 'Cluster A' },
          { id: 'ds-b', title: 'Cluster B' },
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
        enabled: true,
      })
    );
  });

  describe('handler', () => {
    it('should switch to a valid data source and resolve its title', async () => {
      renderHook();

      const result = await registeredAction.handler({ dataSourceId: 'ds-a' });

      expect(mockChatService.validateDataSourceId).toHaveBeenCalledWith('ds-a');
      expect(mockChatService.setLLMDataSourceId).toHaveBeenCalledWith('ds-a');
      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          dataSourceId: 'ds-a',
          datasourceTitle: 'Cluster A',
        })
      );
    });

    it('should prefer the authoritative title over the one the LLM passed', async () => {
      renderHook();

      const result = await registeredAction.handler({
        dataSourceId: 'ds-a',
        datasourceTitle: 'Whatever the LLM guessed',
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

      const result = await registeredAction.handler({ dataSourceId: 'an-index-pattern-id' });

      expect(result.success).toBe(false);
      // The error names the valid ids so the LLM can correct itself in the same turn.
      expect(result.message).toContain('ds-a');
      expect(result.message).toContain('ds-b');
      expect(mockChatService.setLLMDataSourceId).not.toHaveBeenCalled();
    });

    it('should reject an empty id', async () => {
      renderHook();

      const result = await registeredAction.handler({ dataSourceId: '' });

      expect(result.success).toBe(false);
      expect(mockChatService.validateDataSourceId).not.toHaveBeenCalled();
      expect(mockChatService.setLLMDataSourceId).not.toHaveBeenCalled();
    });

    it('should report a failure when validation throws', async () => {
      (mockChatService.validateDataSourceId as jest.Mock).mockRejectedValue(new Error('boom'));
      renderHook();

      const result = await registeredAction.handler({ dataSourceId: 'ds-a' });

      expect(result).toEqual({ success: false, message: 'boom' });
      expect(mockChatService.setLLMDataSourceId).not.toHaveBeenCalled();
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
        args: { dataSourceId: 'ds-a' },
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
        args: { dataSourceId: 'bogus' },
        result: JSON.stringify({ success: false, message: 'Unknown dataSourceId "bogus".' }),
      });

      expect(screen.getByText('Unknown dataSourceId "bogus".')).toBeInTheDocument();
    });

    it('should ignore a non-object tool result and fall back to the requested id', () => {
      // JSON.parse accepts a bare number/array; those must not be read as a result shape.
      renderCard({ status: 'complete', args: { dataSourceId: 'ds-a' }, result: '42' });

      expect(screen.getByText('Switched to')).toBeInTheDocument();
      expect(screen.getByText('ds-a')).toBeInTheDocument();
    });

    it('should show a running state while the tool executes', () => {
      renderCard({ status: 'executing', args: { dataSourceId: 'ds-a' } });

      expect(screen.getByText('Switching data source…')).toBeInTheDocument();
    });
  });
});

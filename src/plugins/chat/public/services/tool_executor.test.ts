/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ToolExecutor } from './tool_executor';
import { AssistantActionService } from '../../../context_provider/public';

// Mock AssistantActionService
const mockAssistantActionService = ({
  executeAction: jest.fn(),
} as unknown) as jest.Mocked<AssistantActionService>;

describe('ToolExecutor', () => {
  let toolExecutor: ToolExecutor;

  beforeEach(() => {
    jest.clearAllMocks();
    toolExecutor = new ToolExecutor(mockAssistantActionService);
  });

  describe('executeTool', () => {
    it('should execute registered action successfully', async () => {
      const mockResult = { success: true, data: 'action result' };
      mockAssistantActionService.executeAction.mockResolvedValue(mockResult);

      const result = await toolExecutor.executeTool('test_action', { param: 'value' });

      expect(mockAssistantActionService.executeAction).toHaveBeenCalledWith('test_action', {
        param: 'value',
      });
      expect(result).toEqual({
        success: true,
        data: mockResult,
        source: 'registered_action',
      });
    });

    it('should handle registered action failure', async () => {
      const error = new Error('Action failed');
      mockAssistantActionService.executeAction.mockRejectedValue(error);

      const result = await toolExecutor.executeTool('failing_action', {});

      expect(result).toEqual({
        success: false,
        error: 'Action failed',
        source: 'registered_action',
      });
    });

    it('should handle action not found and fallback to agent tool', async () => {
      const error = new Error('Action not found');
      mockAssistantActionService.executeAction.mockRejectedValue(error);

      const result = await toolExecutor.executeTool('unknown_action', {});

      expect(result).toEqual({
        success: true,
        data: { acknowledged: true },
        source: 'agent_tool',
        waitingForAgentResponse: true,
      });
    });

    it('should handle action not registered and fallback to agent tool', async () => {
      const error = new Error('Action not registered');
      mockAssistantActionService.executeAction.mockRejectedValue(error);

      const result = await toolExecutor.executeTool('unregistered_action', {});

      expect(result).toEqual({
        success: true,
        data: { acknowledged: true },
        source: 'agent_tool',
        waitingForAgentResponse: true,
      });
    });

    it('should handle unexpected errors', async () => {
      const error = new Error('Unexpected error');
      mockAssistantActionService.executeAction.mockRejectedValue(error);

      // Mock console.error to avoid noise in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await toolExecutor.executeTool('error_action', {});

      expect(result).toEqual({
        success: false,
        error: 'Unexpected error',
        source: 'registered_action',
      });

      consoleSpy.mockRestore();
    });

    it('should handle errors without message', async () => {
      const error = {};
      mockAssistantActionService.executeAction.mockRejectedValue(error);

      const result = await toolExecutor.executeTool('error_action', {});

      expect(result).toEqual({
        success: false,
        error: undefined,
        source: 'registered_action',
      });
    });
  });

  describe('pending tool management', () => {
    const mockToolCall = {
      id: 'tool-123',
      name: 'test_tool',
      args: { param: 'value' },
    };

    it('should mark tool as pending', () => {
      expect(toolExecutor.isPendingAgentResponse('tool-123')).toBe(false);

      toolExecutor.markToolPending('tool-123', mockToolCall);

      expect(toolExecutor.isPendingAgentResponse('tool-123')).toBe(true);
    });

    it('should get pending tool information', () => {
      toolExecutor.markToolPending('tool-123', mockToolCall);

      const pendingTool = toolExecutor.getPendingTool('tool-123');

      expect(pendingTool).toEqual(mockToolCall);
    });

    it('should return undefined for non-existent pending tool', () => {
      const pendingTool = toolExecutor.getPendingTool('non-existent');

      expect(pendingTool).toBeUndefined();
    });

    it('should clear specific pending tool', () => {
      toolExecutor.markToolPending('tool-123', mockToolCall);
      expect(toolExecutor.isPendingAgentResponse('tool-123')).toBe(true);

      toolExecutor.clearPendingTool('tool-123');

      expect(toolExecutor.isPendingAgentResponse('tool-123')).toBe(false);
      expect(toolExecutor.getPendingTool('tool-123')).toBeUndefined();
    });

    it('should clear all pending tools', () => {
      const mockToolCall2 = {
        id: 'tool-456',
        name: 'another_tool',
        args: {},
      };

      toolExecutor.markToolPending('tool-123', mockToolCall);
      toolExecutor.markToolPending('tool-456', mockToolCall2);

      expect(toolExecutor.isPendingAgentResponse('tool-123')).toBe(true);
      expect(toolExecutor.isPendingAgentResponse('tool-456')).toBe(true);

      toolExecutor.clearAllPendingTools();

      expect(toolExecutor.isPendingAgentResponse('tool-123')).toBe(false);
      expect(toolExecutor.isPendingAgentResponse('tool-456')).toBe(false);
    });
  });

  describe('tryExecuteRegisteredAction', () => {
    it('should return handled true for successful action', async () => {
      const mockResult = { data: 'success' };
      mockAssistantActionService.executeAction.mockResolvedValue(mockResult);

      const result = await (toolExecutor as any).tryExecuteRegisteredAction('test_action', {});

      expect(result.handled).toBe(true);
      expect(result.result).toEqual({
        success: true,
        data: mockResult,
        source: 'registered_action',
      });
    });

    it('should return handled false for not found action', async () => {
      const error = new Error('Action not found');
      mockAssistantActionService.executeAction.mockRejectedValue(error);

      const result = await (toolExecutor as any).tryExecuteRegisteredAction('unknown_action', {});

      expect(result.handled).toBe(false);
    });

    it('should return handled true with error for failed registered action', async () => {
      const error = new Error('Action execution failed');
      mockAssistantActionService.executeAction.mockRejectedValue(error);

      const result = await (toolExecutor as any).tryExecuteRegisteredAction('failing_action', {});

      expect(result.handled).toBe(true);
      expect(result.result).toEqual({
        success: false,
        error: 'Action execution failed',
        source: 'registered_action',
      });
    });
  });

  describe('executeAgentTool', () => {
    it('should return agent tool result', async () => {
      const result = await (toolExecutor as any).executeAgentTool('agent_tool', { param: 'value' });

      expect(result).toEqual({
        success: true,
        data: { acknowledged: true },
        source: 'agent_tool',
        waitingForAgentResponse: true,
      });
    });
  });
});

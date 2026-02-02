/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ToolExecutor } from './tool_executor';
import { ConfirmationService } from './confirmation_service';
import { AssistantActionService } from '../../../context_provider/public';

// Mock AssistantActionService
const mockAssistantActionService = ({
  executeAction: jest.fn(),
  isUserConfirmRequired: jest.fn(),
} as unknown) as jest.Mocked<AssistantActionService>;

describe('ToolExecutor', () => {
  let toolExecutor: ToolExecutor;
  let confirmationService: ConfirmationService;

  beforeEach(() => {
    jest.clearAllMocks();
    confirmationService = new ConfirmationService();
    toolExecutor = new ToolExecutor(mockAssistantActionService, confirmationService);
  });

  describe('executeTool without confirmation', () => {
    it('should execute registered action successfully', async () => {
      mockAssistantActionService.isUserConfirmRequired.mockReturnValue(false);
      mockAssistantActionService.executeAction.mockResolvedValue({ result: 'success' });

      const result = await toolExecutor.executeTool('testTool', { param: 'value' }, 'call-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ result: 'success' });
      expect(result.source).toBe('registered_action');
      expect(mockAssistantActionService.executeAction).toHaveBeenCalledWith('testTool', {
        param: 'value',
      });
    });

    it('should handle agent tool when action not found', async () => {
      mockAssistantActionService.isUserConfirmRequired.mockReturnValue(false);
      mockAssistantActionService.executeAction.mockRejectedValue(new Error('Action not found'));

      const result = await toolExecutor.executeTool('agentTool', { param: 'value' }, 'call-123');

      expect(result.success).toBe(true);
      expect(result.source).toBe('agent_tool');
      expect(result.waitingForAgentResponse).toBe(true);
    });

    it('should include datasourceId in tool args when provided', async () => {
      mockAssistantActionService.isUserConfirmRequired.mockReturnValue(false);
      mockAssistantActionService.executeAction.mockResolvedValue({ result: 'success' });

      await toolExecutor.executeTool('testTool', { param: 'value' }, 'call-123', 'datasource-1');

      expect(mockAssistantActionService.executeAction).toHaveBeenCalledWith('testTool', {
        param: 'value',
        datasourceId: 'datasource-1',
      });
    });
  });

  describe('executeTool with confirmation', () => {
    it('should request confirmation for tools that require it', async () => {
      mockAssistantActionService.isUserConfirmRequired.mockReturnValue(true);
      mockAssistantActionService.executeAction.mockResolvedValue({ result: 'confirmed' });

      // Start execution (will wait for confirmation)
      const executionPromise = toolExecutor.executeTool(
        'confirmTool',
        { param: 'value' },
        'call-123'
      );

      // Simulate user approval
      const pending = confirmationService.getPendingConfirmations();
      expect(pending.length).toBe(1);
      confirmationService.approve(pending[0].id);

      const result = await executionPromise;

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ result: 'confirmed' });
      expect(mockAssistantActionService.executeAction).toHaveBeenCalledWith('confirmTool', {
        param: 'value',
        confirmed: true,
      });
    });

    it('should reject execution when user rejects confirmation', async () => {
      mockAssistantActionService.isUserConfirmRequired.mockReturnValue(true);

      // Start execution (will wait for confirmation)
      const executionPromise = toolExecutor.executeTool(
        'confirmTool',
        { param: 'value' },
        'call-123'
      );

      // Simulate user rejection
      const pending = confirmationService.getPendingConfirmations();
      confirmationService.reject(pending[0].id);

      const result = await executionPromise;

      expect(result.success).toBe(false);
      expect(result.userRejected).toBe(true);
      expect(result.error).toBe('User rejected the tool execution');
      expect(mockAssistantActionService.executeAction).not.toHaveBeenCalled();
    });

    it('should include datasourceId even with confirmation', async () => {
      mockAssistantActionService.isUserConfirmRequired.mockReturnValue(true);
      mockAssistantActionService.executeAction.mockResolvedValue({ result: 'confirmed' });

      const executionPromise = toolExecutor.executeTool(
        'confirmTool',
        { param: 'value' },
        'call-123',
        'datasource-1'
      );

      const pending = confirmationService.getPendingConfirmations();
      confirmationService.approve(pending[0].id);

      await executionPromise;

      expect(mockAssistantActionService.executeAction).toHaveBeenCalledWith('confirmTool', {
        param: 'value',
        confirmed: true,
        datasourceId: 'datasource-1',
      });
    });
  });

  describe('pending tool management', () => {
    it('should mark tool as pending', () => {
      const toolCall = { id: 'call-123', name: 'testTool', args: { param: 'value' } };

      toolExecutor.markToolPending('call-123', toolCall);

      expect(toolExecutor.isPendingAgentResponse('call-123')).toBe(true);
      expect(toolExecutor.getPendingTool('call-123')).toEqual(toolCall);
    });

    it('should clear pending tool', () => {
      const toolCall = { id: 'call-123', name: 'testTool', args: { param: 'value' } };

      toolExecutor.markToolPending('call-123', toolCall);
      expect(toolExecutor.isPendingAgentResponse('call-123')).toBe(true);

      toolExecutor.clearPendingTool('call-123');
      expect(toolExecutor.isPendingAgentResponse('call-123')).toBe(false);
      expect(toolExecutor.getPendingTool('call-123')).toBeUndefined();
    });

    it('should clear all pending tools', () => {
      toolExecutor.markToolPending('call-1', { id: 'call-1', name: 'tool1', args: {} });
      toolExecutor.markToolPending('call-2', { id: 'call-2', name: 'tool2', args: {} });

      expect(toolExecutor.isPendingAgentResponse('call-1')).toBe(true);
      expect(toolExecutor.isPendingAgentResponse('call-2')).toBe(true);

      toolExecutor.clearAllPendingTools();

      expect(toolExecutor.isPendingAgentResponse('call-1')).toBe(false);
      expect(toolExecutor.isPendingAgentResponse('call-2')).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should return error for registered action execution failures', async () => {
      mockAssistantActionService.isUserConfirmRequired.mockReturnValue(false);
      mockAssistantActionService.executeAction.mockRejectedValue(new Error('Execution failed'));

      const result = await toolExecutor.executeTool('testTool', { param: 'value' }, 'call-123');

      // When action fails but is not "not found", it returns error from registered action
      expect(result.success).toBe(false);
      expect(result.source).toBe('registered_action');
      expect(result.error).toBe('Execution failed');
    });

    it('should handle unexpected errors gracefully', async () => {
      mockAssistantActionService.isUserConfirmRequired.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await toolExecutor.executeTool('testTool', { param: 'value' }, 'call-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unexpected error');
    });
  });
});

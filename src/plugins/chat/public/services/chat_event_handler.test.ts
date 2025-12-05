/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChatEventHandler } from './chat_event_handler';
import { AssistantActionService } from '../../../context_provider/public';
import { ChatService } from './chat_service';
import { EventType } from '../../common/events';
import type {
  TextMessageStartEvent,
  TextMessageContentEvent,
  TextMessageEndEvent,
  ToolCallStartEvent,
  ToolCallArgsEvent,
  ToolCallEndEvent,
  ToolCallResultEvent,
} from '../../common/events';
import type { Message, AssistantMessage, ToolMessage } from '../../common/types';

// Mock dependencies
const mockAssistantActionService = ({
  updateToolCallState: jest.fn(),
  executeAction: jest.fn(),
  hasAction: jest.fn().mockReturnValue(true),
} as unknown) as jest.Mocked<AssistantActionService>;

const mockChatService = ({
  sendToolResult: jest.fn(),
} as unknown) as jest.Mocked<ChatService>;

describe('ChatEventHandler', () => {
  let chatEventHandler: ChatEventHandler;
  let mockOnTimelineUpdate: jest.Mock;
  let mockOnStreamingStateChange: jest.Mock;
  let mockGetTimeline: jest.Mock;
  let timeline: Message[];

  beforeEach(() => {
    jest.clearAllMocks();

    timeline = [];
    mockOnTimelineUpdate = jest.fn((updater) => {
      timeline = updater(timeline);
    });
    mockOnStreamingStateChange = jest.fn();
    mockGetTimeline = jest.fn(() => timeline);

    chatEventHandler = new ChatEventHandler(
      mockAssistantActionService,
      mockChatService,
      mockOnTimelineUpdate,
      mockOnStreamingStateChange,
      mockGetTimeline
    );
  });

  describe('handleEvent', () => {
    it('should route events to appropriate handlers', async () => {
      const events = [
        { type: EventType.RUN_STARTED },
        { type: EventType.RUN_FINISHED },
        { type: EventType.TEXT_MESSAGE_START, messageId: 'msg-1' },
        { type: EventType.TEXT_MESSAGE_CONTENT, messageId: 'msg-1', delta: 'Hello' },
        { type: EventType.TEXT_MESSAGE_END, messageId: 'msg-1' },
        { type: EventType.TOOL_CALL_START, toolCallId: 'tool-1', toolCallName: 'test_tool' },
        { type: EventType.TOOL_CALL_ARGS, toolCallId: 'tool-1', delta: '{"param": "value"}' },
        { type: EventType.TOOL_CALL_END, toolCallId: 'tool-1' },
        { type: EventType.TOOL_CALL_RESULT, toolCallId: 'tool-1', content: 'result' },
        { type: EventType.RUN_ERROR, message: 'Error occurred' },
      ];

      for (const event of events) {
        await chatEventHandler.handleEvent(event as any);
      }

      // Verify streaming state changes
      expect(mockOnStreamingStateChange).toHaveBeenCalledWith(true); // RUN_STARTED
      expect(mockOnStreamingStateChange).toHaveBeenCalledWith(false); // RUN_FINISHED and RUN_ERROR
    });
  });

  describe('text message handling', () => {
    it('should handle complete text message flow', async () => {
      const messageId = 'msg-123';

      // Start message
      await chatEventHandler.handleEvent({
        type: EventType.TEXT_MESSAGE_START,
        messageId,
      } as TextMessageStartEvent);

      expect(mockOnTimelineUpdate).toHaveBeenCalledWith(expect.any(Function));
      expect(timeline).toHaveLength(1);
      expect(timeline[0]).toEqual({
        id: messageId,
        role: 'assistant',
        toolCalls: [],
      });

      // Add content
      await chatEventHandler.handleEvent({
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId,
        delta: 'Hello ',
      } as TextMessageContentEvent);

      await chatEventHandler.handleEvent({
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId,
        delta: 'world!',
      } as TextMessageContentEvent);

      expect(timeline[0]).toEqual({
        id: messageId,
        role: 'assistant',
        content: 'Hello world!',
        toolCalls: [],
      });

      // End message
      await chatEventHandler.handleEvent({
        type: EventType.TEXT_MESSAGE_END,
        messageId,
      } as TextMessageEndEvent);

      expect(timeline[0]).toEqual({
        id: messageId,
        role: 'assistant',
        content: 'Hello world!',
      });
    });

    it('should handle message with no content', async () => {
      const messageId = 'msg-empty';

      await chatEventHandler.handleEvent({
        type: EventType.TEXT_MESSAGE_START,
        messageId,
      } as TextMessageStartEvent);

      await chatEventHandler.handleEvent({
        type: EventType.TEXT_MESSAGE_END,
        messageId,
      } as TextMessageEndEvent);

      const message = timeline[0] as AssistantMessage;
      expect(message.content).toBeUndefined();
      expect(message.toolCalls).toBeUndefined();
    });
  });

  describe('tool call handling', () => {
    it('should handle complete tool call flow', async () => {
      const messageId = 'msg-123';
      const toolCallId = 'tool-456';

      // Start message first
      await chatEventHandler.handleEvent({
        type: EventType.TEXT_MESSAGE_START,
        messageId,
      } as TextMessageStartEvent);

      // Start tool call
      await chatEventHandler.handleEvent({
        type: EventType.TOOL_CALL_START,
        toolCallId,
        toolCallName: 'test_tool',
        parentMessageId: messageId,
      } as ToolCallStartEvent);

      expect(mockAssistantActionService.updateToolCallState).toHaveBeenCalledWith(toolCallId, {
        id: toolCallId,
        name: 'test_tool',
        status: 'pending',
        timestamp: expect.any(Number),
      });

      // Add arguments
      await chatEventHandler.handleEvent({
        type: EventType.TOOL_CALL_ARGS,
        toolCallId,
        delta: '{"param": ',
      } as ToolCallArgsEvent);

      await chatEventHandler.handleEvent({
        type: EventType.TOOL_CALL_ARGS,
        toolCallId,
        delta: '"value"}',
      } as ToolCallArgsEvent);

      const message = timeline[0] as AssistantMessage;
      expect(message.toolCalls).toHaveLength(1);
      expect(message.toolCalls![0]).toEqual({
        id: toolCallId,
        type: 'function',
        function: {
          name: 'test_tool',
          arguments: '{"param": "value"}',
        },
      });
    });

    it('should execute registered action successfully', async () => {
      const toolCallId = 'tool-123';
      const mockResult = { success: true, data: 'action result' };

      mockAssistantActionService.executeAction = jest.fn().mockResolvedValue(mockResult);

      // Mock sendToolResult to return the expected structure
      const mockToolMessage: ToolMessage = {
        id: `tool-result-${toolCallId}`,
        role: 'tool',
        content: JSON.stringify(mockResult),
        toolCallId,
      };

      const mockObservable = {
        subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
      };

      mockChatService.sendToolResult = jest.fn().mockResolvedValue({
        observable: mockObservable,
        toolMessage: mockToolMessage,
      });

      await chatEventHandler.handleEvent({
        type: EventType.TOOL_CALL_START,
        toolCallId,
        toolCallName: 'registered_action',
      } as ToolCallStartEvent);

      await chatEventHandler.handleEvent({
        type: EventType.TOOL_CALL_ARGS,
        toolCallId,
        delta: '{"param": "value"}',
      } as ToolCallArgsEvent);

      await chatEventHandler.handleEvent({
        type: EventType.TOOL_CALL_END,
        toolCallId,
      } as ToolCallEndEvent);

      expect(mockAssistantActionService.executeAction).toHaveBeenCalledWith('registered_action', {
        param: 'value',
      });

      expect(mockAssistantActionService.updateToolCallState).toHaveBeenCalledWith(toolCallId, {
        status: 'complete',
        result: mockResult,
      });

      // Should add tool result message
      const toolMessage = timeline.find((msg) => msg.role === 'tool') as ToolMessage;
      expect(toolMessage).toBeDefined();
      expect(toolMessage.toolCallId).toBe(toolCallId);
      expect(toolMessage.content).toBe(JSON.stringify(mockResult));
    });

    it('should handle tool execution failure', async () => {
      const toolCallId = 'tool-123';
      const error = new Error('Tool execution failed');

      mockAssistantActionService.executeAction = jest.fn().mockRejectedValue(error);

      await chatEventHandler.handleEvent({
        type: EventType.TOOL_CALL_START,
        toolCallId,
        toolCallName: 'failing_action',
      } as ToolCallStartEvent);

      await chatEventHandler.handleEvent({
        type: EventType.TOOL_CALL_ARGS,
        toolCallId,
        delta: '{}',
      } as ToolCallArgsEvent);

      await chatEventHandler.handleEvent({
        type: EventType.TOOL_CALL_END,
        toolCallId,
      } as ToolCallEndEvent);

      // Check that the tool call state was updated through the execution flow
      expect(mockAssistantActionService.updateToolCallState).toHaveBeenCalledWith(toolCallId, {
        id: toolCallId,
        name: 'failing_action',
        status: 'pending',
        timestamp: expect.any(Number),
      });

      expect(mockAssistantActionService.updateToolCallState).toHaveBeenCalledWith(toolCallId, {
        args: {},
        status: 'executing',
      });

      expect(mockAssistantActionService.updateToolCallState).toHaveBeenCalledWith(toolCallId, {
        status: 'complete',
        result: undefined,
      });
    });

    it('should handle agent-only tools', async () => {
      const toolCallId = 'tool-123';
      const notFoundError = new Error('Action not found');

      mockAssistantActionService.hasAction.mockReturnValueOnce(false);
      mockAssistantActionService.executeAction = jest.fn().mockRejectedValue(notFoundError);

      await chatEventHandler.handleEvent({
        type: EventType.TOOL_CALL_START,
        toolCallId,
        toolCallName: 'agent_tool',
      } as ToolCallStartEvent);

      await chatEventHandler.handleEvent({
        type: EventType.TOOL_CALL_ARGS,
        toolCallId,
        delta: '{}',
      } as ToolCallArgsEvent);

      await chatEventHandler.handleEvent({
        type: EventType.TOOL_CALL_END,
        toolCallId,
      } as ToolCallEndEvent);

      // Should not add tool result message immediately for agent tools
      const toolMessages = timeline.filter((msg) => msg.role === 'tool');
      expect(toolMessages).toHaveLength(0);
    });

    it('should handle tool call result from agent', async () => {
      const toolCallId = 'tool-123';

      await chatEventHandler.handleEvent({
        type: EventType.TOOL_CALL_RESULT,
        toolCallId,
        content: 'Agent tool result',
      } as ToolCallResultEvent);

      const toolMessage = timeline.find((msg) => msg.role === 'tool') as ToolMessage;
      expect(toolMessage).toBeDefined();
      expect(toolMessage.toolCallId).toBe(toolCallId);
      expect(toolMessage.content).toBe('Agent tool result');
    });

    it('should parse JSON content in tool call result', async () => {
      const toolCallId = 'tool-123';
      const jsonContent = JSON.stringify({
        content: [
          { type: 'text', text: 'First part' },
          { type: 'text', text: 'Second part' },
        ],
      });

      await chatEventHandler.handleEvent({
        type: EventType.TOOL_CALL_RESULT,
        toolCallId,
        content: jsonContent,
      } as ToolCallResultEvent);

      const toolMessage = timeline.find((msg) => msg.role === 'tool') as ToolMessage;
      expect(toolMessage.content).toBe('First part\nSecond part');
    });
  });

  describe('run state handling', () => {
    it('should handle run started', async () => {
      await chatEventHandler.handleEvent({
        type: EventType.RUN_STARTED,
        threadId: 'test-thread',
        runId: 'test-run',
      });

      expect(mockOnStreamingStateChange).toHaveBeenCalledWith(true);
    });

    it('should handle run finished', async () => {
      await chatEventHandler.handleEvent({
        type: EventType.RUN_FINISHED,
        threadId: 'test-thread',
        runId: 'test-run',
      });

      expect(mockOnStreamingStateChange).toHaveBeenCalledWith(false);
    });

    it('should handle run error', async () => {
      await chatEventHandler.handleEvent({
        type: EventType.RUN_ERROR,
        message: 'Something went wrong',
      });

      expect(mockOnStreamingStateChange).toHaveBeenCalledWith(false);

      const errorMessage = timeline.find((msg) => msg.role === 'system');
      expect(errorMessage).toBeDefined();
      expect(errorMessage!.content).toBe('Error: Something went wrong');
    });
  });

  describe('clearState', () => {
    it('should clear all internal state', async () => {
      // Add some state
      await chatEventHandler.handleEvent({
        type: EventType.TEXT_MESSAGE_START,
        messageId: 'msg-1',
      } as TextMessageStartEvent);

      await chatEventHandler.handleEvent({
        type: EventType.TOOL_CALL_START,
        toolCallId: 'tool-1',
        toolCallName: 'test_tool',
      } as ToolCallStartEvent);

      // Clear state
      chatEventHandler.clearState();

      // Verify state is cleared by checking that subsequent events don't reference old state
      await chatEventHandler.handleEvent({
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId: 'msg-1',
        delta: 'This should not update the old message',
      } as TextMessageContentEvent);

      // The timeline should have been updated twice: once for TEXT_MESSAGE_START and once for TOOL_CALL_START
      expect(mockOnTimelineUpdate).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling', () => {
    it('should handle malformed tool call arguments', async () => {
      const toolCallId = 'tool-123';

      await chatEventHandler.handleEvent({
        type: EventType.TOOL_CALL_START,
        toolCallId,
        toolCallName: 'test_tool',
      } as ToolCallStartEvent);

      await chatEventHandler.handleEvent({
        type: EventType.TOOL_CALL_ARGS,
        toolCallId,
        delta: 'invalid-json',
      } as ToolCallArgsEvent);

      await chatEventHandler.handleEvent({
        type: EventType.TOOL_CALL_END,
        toolCallId,
      } as ToolCallEndEvent);

      // Should handle JSON parse error gracefully
      expect(mockAssistantActionService.updateToolCallState).toHaveBeenCalledWith(toolCallId, {
        status: 'failed',
        error: expect.stringContaining('Unexpected token'),
      });
    });

    it('should handle missing tool call', async () => {
      // Mock console.warn to avoid noise in tests
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await chatEventHandler.handleEvent({
        type: EventType.TOOL_CALL_END,
        toolCallId: 'non-existent-tool',
      } as ToolCallEndEvent);

      expect(consoleSpy).toHaveBeenCalledWith('Tool call not found: non-existent-tool');
      consoleSpy.mockRestore();
    });
  });
});

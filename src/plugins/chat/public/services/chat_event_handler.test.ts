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

const mockGetCurrentState = jest.fn().mockReturnValue({
  actions: new Map(), // Empty map means no actions have requiresConfirmation flag
});

// Mock dependencies
const mockAssistantActionService = ({
  updateToolCallState: jest.fn(),
  executeAction: jest.fn(),
  hasAction: jest.fn().mockReturnValue(true),
  getCurrentState: mockGetCurrentState,
  isUserConfirmRequired: jest.fn().mockReturnValue(false),
} as unknown) as jest.Mocked<AssistantActionService>;

const mockChatService = ({
  sendToolResult: jest.fn(),
  getCurrentDataSourceId: jest.fn().mockReturnValue(undefined),
} as unknown) as jest.Mocked<ChatService>;

const mockConfirmationService = {
  requestConfirmation: jest.fn().mockResolvedValue({ approved: true }),
};

describe('ChatEventHandler', () => {
  let chatEventHandler: ChatEventHandler;
  let mockOnTimelineUpdate: jest.Mock;
  let mockOnStreamingStateChange: jest.Mock;
  let mockOnStartResponse: jest.Mock;
  let mockGetTimeline: jest.Mock;
  let timeline: Message[];

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset hasAction to return true by default
    mockAssistantActionService.hasAction = jest.fn().mockReturnValue(true);

    // Reset confirmationService to approve by default
    mockConfirmationService.requestConfirmation = jest.fn().mockResolvedValue({ approved: true });

    timeline = [];
    mockOnTimelineUpdate = jest.fn((updater) => {
      timeline = updater(timeline);
    });
    mockOnStreamingStateChange = jest.fn();
    mockOnStartResponse = jest.fn();
    mockGetTimeline = jest.fn(() => timeline);

    chatEventHandler = new ChatEventHandler({
      assistantActionService: mockAssistantActionService,
      chatService: mockChatService,
      // @ts-expect-error TS2740 TODO(ts-error): fixme
      confirmationService: mockConfirmationService,
      callbacks: {
        onTimelineUpdate: mockOnTimelineUpdate,
        onStreamingStateChange: mockOnStreamingStateChange,
        onStartResponse: mockOnStartResponse,
        getTimeline: mockGetTimeline,
      },
    });
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

    it('should attach tool call to last assistant message when it appears after last user message', async () => {
      const assistantMessageId = 'assistant-msg-123';
      const toolCallId = 'tool-456';

      // Set up timeline: user message, then assistant message
      await chatEventHandler.handleEvent({
        type: EventType.TEXT_MESSAGE_START,
        messageId: assistantMessageId,
      } as TextMessageStartEvent);

      await chatEventHandler.handleEvent({
        type: EventType.TEXT_MESSAGE_END,
        messageId: assistantMessageId,
      } as TextMessageEndEvent);

      // Add a user message to timeline manually
      timeline.unshift({
        id: 'user-msg-001',
        role: 'user',
        content: 'Hello',
      });

      // Now trigger tool call without parentMessageId
      // The last assistant message (assistantMessageId) appears AFTER the user message in timeline
      await chatEventHandler.handleEvent({
        type: EventType.TOOL_CALL_START,
        toolCallId,
        toolCallName: 'test_tool',
        // No parentMessageId - should use selection strategy
      } as ToolCallStartEvent);

      // Tool call should be attached to the existing assistant message
      const assistantMessage = timeline.find(
        (msg) => msg.id === assistantMessageId
      ) as AssistantMessage;
      expect(assistantMessage).toBeDefined();
      expect(assistantMessage.toolCalls).toHaveLength(1);
      expect(assistantMessage.toolCalls![0].id).toBe(toolCallId);
    });

    it('should create fake assistant message when user message appears after last assistant message', async () => {
      const assistantMessageId = 'assistant-msg-123';
      const toolCallId = 'tool-456';

      // Set up timeline: assistant message, then user message
      await chatEventHandler.handleEvent({
        type: EventType.TEXT_MESSAGE_START,
        messageId: assistantMessageId,
      } as TextMessageStartEvent);

      await chatEventHandler.handleEvent({
        type: EventType.TEXT_MESSAGE_END,
        messageId: assistantMessageId,
      } as TextMessageEndEvent);

      // Add a user message AFTER the assistant message
      timeline.push({
        id: 'user-msg-002',
        role: 'user',
        content: 'Another question',
      });

      const initialTimelineLength = timeline.length;

      // Trigger tool call without parentMessageId
      // The last user message appears AFTER the assistant message, so a new fake message should be created
      await chatEventHandler.handleEvent({
        type: EventType.TOOL_CALL_START,
        toolCallId,
        toolCallName: 'test_tool',
        // No parentMessageId - should create fake assistant message
      } as ToolCallStartEvent);

      // Should have created a new fake assistant message
      expect(timeline.length).toBe(initialTimelineLength + 1);

      // The new message should be an assistant message with the tool call
      const fakeAssistantMessage = timeline[timeline.length - 1] as AssistantMessage;
      expect(fakeAssistantMessage.role).toBe('assistant');
      expect(fakeAssistantMessage.id).toMatch(/^fake-assistant-message-/);
      expect(fakeAssistantMessage.toolCalls).toHaveLength(1);
      expect(fakeAssistantMessage.toolCalls![0].id).toBe(toolCallId);
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

  describe('user confirmation handling', () => {
    beforeEach(() => {
      mockAssistantActionService.isUserConfirmRequired = jest.fn().mockReturnValue(true);
    });

    it('should handle user rejection of tool execution', async () => {
      const toolCallId = 'tool-123';
      const mockRejectedResult = {
        success: false,
        error: 'User rejected the tool execution',
        userRejected: true,
        data: {
          message: 'The user chose not to proceed with this action.',
          toolName: 'test_action',
          args: { param: 'value' },
        },
      };

      mockConfirmationService.requestConfirmation = jest
        .fn()
        .mockResolvedValue({ approved: false });

      await chatEventHandler.handleEvent({
        type: EventType.TOOL_CALL_START,
        toolCallId,
        toolCallName: 'test_action',
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

      // Should update state to failed
      expect(mockAssistantActionService.updateToolCallState).toHaveBeenCalledWith(toolCallId, {
        status: 'failed',
      });

      // Should send rejection back to assistant
      expect(mockChatService.sendToolResult).toHaveBeenCalledWith(
        toolCallId,
        mockRejectedResult,
        expect.any(Array)
      );
    });

    it('should handle user approval of tool execution', async () => {
      const toolCallId = 'tool-123';
      const mockApprovedResult = { success: true, data: 'Action executed successfully' };

      // Mock tool executor to return successful result (no userRejected flag)
      mockAssistantActionService.executeAction = jest.fn().mockResolvedValue(mockApprovedResult);

      // Mock sendToolResult
      const mockToolMessage: ToolMessage = {
        id: `tool-result-${toolCallId}`,
        role: 'tool',
        content: JSON.stringify(mockApprovedResult),
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
        toolCallName: 'test_action',
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

      // Should update state to complete
      expect(mockAssistantActionService.updateToolCallState).toHaveBeenCalledWith(toolCallId, {
        status: 'complete',
        result: mockApprovedResult,
      });

      // Should send result back to assistant
      expect(mockChatService.sendToolResult).toHaveBeenCalledWith(
        toolCallId,
        mockApprovedResult,
        expect.any(Array)
      );
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

  describe('onStartResponse callback', () => {
    it('should call onStartResponse(true) when TEXT_MESSAGE_START event is handled', async () => {
      const messageId = 'msg-123';

      await chatEventHandler.handleEvent({
        type: EventType.TEXT_MESSAGE_START,
        messageId,
      } as TextMessageStartEvent);

      // Verify onStartResponse was called with true
      expect(mockOnStartResponse).toHaveBeenCalledWith(true);
    });

    it('should call onStartResponse(true) when TOOL_CALL_START event is handled', async () => {
      const toolCallId = 'tool-123';

      await chatEventHandler.handleEvent({
        type: EventType.TOOL_CALL_START,
        toolCallId,
        toolCallName: 'test_tool',
      } as ToolCallStartEvent);

      // Verify onStartResponse was called with true
      expect(mockOnStartResponse).toHaveBeenCalledWith(true);
    });

    it('should call onStartResponse(false) when tool result response completes', async () => {
      const toolCallId = 'tool-123';
      const mockResult = { success: true, data: 'test result' };

      mockAssistantActionService.executeAction = jest.fn().mockResolvedValue(mockResult);

      // Mock sendToolResult to return observable that completes
      const mockToolMessage: ToolMessage = {
        id: `tool-result-${toolCallId}`,
        role: 'tool',
        content: JSON.stringify(mockResult),
        toolCallId,
      };

      let completeCallback: any;
      const mockObservable = {
        subscribe: jest.fn((callbacks) => {
          completeCallback = callbacks.complete;
          return { unsubscribe: jest.fn() };
        }),
      };

      mockChatService.sendToolResult = jest.fn().mockResolvedValue({
        observable: mockObservable,
        toolMessage: mockToolMessage,
      });

      // Trigger tool call flow
      await chatEventHandler.handleEvent({
        type: EventType.TOOL_CALL_START,
        toolCallId,
        toolCallName: 'test_action',
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

      // Clear previous calls to focus on the completion callback
      mockOnStartResponse.mockClear();

      // Trigger completion
      completeCallback();

      // Verify onStartResponse was called with false on completion
      expect(mockOnStartResponse).toHaveBeenCalledWith(false);
    });

    it('should call onStartResponse(false) when tool result response errors', async () => {
      const toolCallId = 'tool-123';
      const mockResult = { success: true, data: 'test result' };

      mockAssistantActionService.executeAction = jest.fn().mockResolvedValue(mockResult);

      // Mock sendToolResult to return observable that errors
      const mockToolMessage: ToolMessage = {
        id: `tool-result-${toolCallId}`,
        role: 'tool',
        content: JSON.stringify(mockResult),
        toolCallId,
      };

      let errorCallback: any;
      const mockObservable = {
        subscribe: jest.fn((callbacks) => {
          errorCallback = callbacks.error;
          return { unsubscribe: jest.fn() };
        }),
      };

      mockChatService.sendToolResult = jest.fn().mockResolvedValue({
        observable: mockObservable,
        toolMessage: mockToolMessage,
      });

      // Trigger tool call flow
      await chatEventHandler.handleEvent({
        type: EventType.TOOL_CALL_START,
        toolCallId,
        toolCallName: 'test_action',
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

      // Clear previous calls to focus on the error callback
      mockOnStartResponse.mockClear();

      // Trigger error
      errorCallback(new Error('Test error'));

      // Verify onStartResponse was called with false on error
      expect(mockOnStartResponse).toHaveBeenCalledWith(false);
    });
  });

  describe('handleMessagesSnapshot', () => {
    it('should restore timeline from MESSAGES_SNAPSHOT event', async () => {
      const messages: Message[] = [
        { id: 'msg-1', role: 'user', content: 'Hello' },
        { id: 'msg-2', role: 'assistant', content: 'Hi there!' },
        { id: 'msg-3', role: 'user', content: 'How are you?' },
      ];

      await chatEventHandler.handleEvent({
        type: EventType.MESSAGES_SNAPSHOT,
        messages,
        timestamp: Date.now(),
      });

      expect(mockOnTimelineUpdate).toHaveBeenCalled();
      expect(timeline).toEqual(messages);
    });

    it('should reset streaming state', async () => {
      const messages: Message[] = [{ id: 'msg-1', role: 'user', content: 'Hello' }];

      await chatEventHandler.handleEvent({
        type: EventType.MESSAGES_SNAPSHOT,
        messages,
        timestamp: Date.now(),
      });

      expect(mockOnStreamingStateChange).toHaveBeenCalledWith(false);
    });

    it('should handle empty messages array', async () => {
      await chatEventHandler.handleEvent({
        type: EventType.MESSAGES_SNAPSHOT,
        messages: [],
        timestamp: Date.now(),
      });

      expect(timeline).toEqual([]);
      expect(mockOnStreamingStateChange).toHaveBeenCalledWith(false);
    });

    it('should handle messages with tool calls', async () => {
      const messages: Message[] = [
        { id: 'msg-1', role: 'user', content: 'List files' },
        {
          id: 'msg-2',
          role: 'assistant',
          content: '',
          toolCalls: [
            {
              id: 'tool-1',
              type: 'function',
              function: {
                name: 'list_files',
                arguments: '{"path": "/"}',
              },
            },
          ],
        },
        {
          id: 'msg-3',
          role: 'tool',
          toolCallId: 'tool-1',
          content: 'file1.txt\nfile2.txt',
        },
      ];

      await chatEventHandler.handleEvent({
        type: EventType.MESSAGES_SNAPSHOT,
        messages,
        timestamp: Date.now(),
      });

      expect(timeline).toEqual(messages);
      expect(timeline).toHaveLength(3);
      expect((timeline[1] as AssistantMessage).toolCalls).toHaveLength(1);
      expect((timeline[2] as ToolMessage).toolCallId).toBe('tool-1');
    });

    it('should handle messages with array content', async () => {
      const messages: Message[] = [
        {
          id: 'msg-1',
          role: 'user',
          content: [
            // @ts-expect-error TS2322 TODO(ts-error): fixme
            { type: 'image', image: 'data:image/png;base64,abc' },
            { type: 'text', text: 'What is this?' },
          ],
        },
        { id: 'msg-2', role: 'assistant', content: 'This is an image.' },
      ];

      await chatEventHandler.handleEvent({
        type: EventType.MESSAGES_SNAPSHOT,
        messages,
        timestamp: Date.now(),
      });

      expect(timeline).toEqual(messages);
      expect(Array.isArray(timeline[0].content)).toBe(true);
    });

    it('should override existing timeline', async () => {
      // Set up initial timeline
      timeline = [
        { id: 'old-1', role: 'user', content: 'Old message' },
        { id: 'old-2', role: 'assistant', content: 'Old response' },
      ];

      const newMessages: Message[] = [
        { id: 'new-1', role: 'user', content: 'New message' },
        { id: 'new-2', role: 'assistant', content: 'New response' },
      ];

      await chatEventHandler.handleEvent({
        type: EventType.MESSAGES_SNAPSHOT,
        messages: newMessages,
        timestamp: Date.now(),
      });

      expect(timeline).toEqual(newMessages);
      expect(timeline).toHaveLength(2);
      expect(timeline[0].id).toBe('new-1');
    });

    it('should handle snapshot with only user messages', async () => {
      const messages: Message[] = [
        { id: 'msg-1', role: 'user', content: 'First question' },
        { id: 'msg-2', role: 'user', content: 'Second question' },
      ];

      await chatEventHandler.handleEvent({
        type: EventType.MESSAGES_SNAPSHOT,
        messages,
        timestamp: Date.now(),
      });

      expect(timeline).toEqual(messages);
      expect(timeline.every((msg) => msg.role === 'user')).toBe(true);
    });

    it('should handle snapshot with complex conversation flow', async () => {
      const messages: Message[] = [
        { id: 'msg-1', role: 'user', content: 'Start conversation' },
        { id: 'msg-2', role: 'assistant', content: 'Hello!' },
        { id: 'msg-3', role: 'user', content: 'Use tool' },
        {
          id: 'msg-4',
          role: 'assistant',
          content: '',
          toolCalls: [
            {
              id: 'tool-1',
              type: 'function',
              function: { name: 'tool1', arguments: '{}' },
            },
          ],
        },
        { id: 'msg-5', role: 'tool', toolCallId: 'tool-1', content: 'tool result' },
        { id: 'msg-6', role: 'assistant', content: 'Based on the tool result...' },
      ];

      await chatEventHandler.handleEvent({
        type: EventType.MESSAGES_SNAPSHOT,
        messages,
        timestamp: Date.now(),
      });

      expect(timeline).toEqual(messages);
      expect(timeline).toHaveLength(6);
    });
  });

  describe('onSendToolResultStateChange callback', () => {
    let mockOnSendToolResultStateChange: jest.Mock;
    let chatEventHandlerWithCallback: ChatEventHandler;

    beforeEach(() => {
      mockOnSendToolResultStateChange = jest.fn();

      chatEventHandlerWithCallback = new ChatEventHandler({
        assistantActionService: mockAssistantActionService,
        chatService: mockChatService,
        // @ts-expect-error TS2322 TODO(ts-error): fixme
        confirmationService: mockConfirmationService,
        callbacks: {
          onTimelineUpdate: mockOnTimelineUpdate,
          onStreamingStateChange: mockOnStreamingStateChange,
          onStartResponse: mockOnStartResponse,
          onSendToolResultStateChange: mockOnSendToolResultStateChange,
          getTimeline: mockGetTimeline,
        },
      });
    });

    it('should call onSendToolResultStateChange(true) before sending tool result', async () => {
      const toolCallId = 'tool-123';
      const mockResult = { success: true, data: 'test result' };

      mockAssistantActionService.executeAction = jest.fn().mockResolvedValue(mockResult);

      // Mock sendToolResult to capture when it's called
      const mockToolMessage: ToolMessage = {
        id: `tool-result-${toolCallId}`,
        role: 'tool',
        content: JSON.stringify(mockResult),
        toolCallId,
      };

      let sendToolResultCalled = false;
      const mockObservable = {
        subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
      };

      mockChatService.sendToolResult = jest.fn().mockImplementation(async () => {
        // Verify onSendToolResultStateChange(true) was called before sendToolResult
        expect(mockOnSendToolResultStateChange).toHaveBeenCalledWith(true);
        sendToolResultCalled = true;
        return {
          observable: mockObservable,
          toolMessage: mockToolMessage,
        };
      });

      // Trigger tool call flow
      await chatEventHandlerWithCallback.handleEvent({
        type: EventType.TOOL_CALL_START,
        toolCallId,
        toolCallName: 'test_action',
      } as ToolCallStartEvent);

      await chatEventHandlerWithCallback.handleEvent({
        type: EventType.TOOL_CALL_ARGS,
        toolCallId,
        delta: '{}',
      } as ToolCallArgsEvent);

      await chatEventHandlerWithCallback.handleEvent({
        type: EventType.TOOL_CALL_END,
        toolCallId,
      } as ToolCallEndEvent);

      expect(sendToolResultCalled).toBe(true);
    });

    it('should call onSendToolResultStateChange(false) after sending tool result succeeds', async () => {
      const toolCallId = 'tool-123';
      const mockResult = { success: true, data: 'test result' };

      mockAssistantActionService.executeAction = jest.fn().mockResolvedValue(mockResult);

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

      // Trigger tool call flow
      await chatEventHandlerWithCallback.handleEvent({
        type: EventType.TOOL_CALL_START,
        toolCallId,
        toolCallName: 'test_action',
      } as ToolCallStartEvent);

      await chatEventHandlerWithCallback.handleEvent({
        type: EventType.TOOL_CALL_ARGS,
        toolCallId,
        delta: '{}',
      } as ToolCallArgsEvent);

      await chatEventHandlerWithCallback.handleEvent({
        type: EventType.TOOL_CALL_END,
        toolCallId,
      } as ToolCallEndEvent);

      // Verify the callback sequence: true before, false after
      expect(mockOnSendToolResultStateChange).toHaveBeenCalledWith(true);
      expect(mockOnSendToolResultStateChange).toHaveBeenCalledWith(false);

      // Verify the order: true was called before false
      const calls = mockOnSendToolResultStateChange.mock.calls;
      const trueCallIndex = calls.findIndex((call: any) => call[0] === true);
      const falseCallIndex = calls.findIndex((call: any) => call[0] === false);
      expect(trueCallIndex).toBeLessThan(falseCallIndex);
    });

    it('should call onSendToolResultStateChange(false) when sendToolResult fails', async () => {
      const toolCallId = 'tool-123';
      const mockResult = { success: true, data: 'test result' };

      mockAssistantActionService.executeAction = jest.fn().mockResolvedValue(mockResult);

      // Mock sendToolResult to throw an error
      mockChatService.sendToolResult = jest.fn().mockRejectedValue(new Error('Network error'));

      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Trigger tool call flow
      await chatEventHandlerWithCallback.handleEvent({
        type: EventType.TOOL_CALL_START,
        toolCallId,
        toolCallName: 'test_action',
      } as ToolCallStartEvent);

      await chatEventHandlerWithCallback.handleEvent({
        type: EventType.TOOL_CALL_ARGS,
        toolCallId,
        delta: '{}',
      } as ToolCallArgsEvent);

      await chatEventHandlerWithCallback.handleEvent({
        type: EventType.TOOL_CALL_END,
        toolCallId,
      } as ToolCallEndEvent);

      // Verify onSendToolResultStateChange(false) was called even on error
      expect(mockOnSendToolResultStateChange).toHaveBeenCalledWith(true);
      expect(mockOnSendToolResultStateChange).toHaveBeenCalledWith(false);

      consoleSpy.mockRestore();
    });

    it('should work without onSendToolResultStateChange callback', async () => {
      // Use the original chatEventHandler without the callback
      const toolCallId = 'tool-123';
      const mockResult = { success: true, data: 'test result' };

      mockAssistantActionService.executeAction = jest.fn().mockResolvedValue(mockResult);

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

      // Should not throw when callback is not provided
      await expect(
        chatEventHandler.handleEvent({
          type: EventType.TOOL_CALL_START,
          toolCallId,
          toolCallName: 'test_action',
        } as ToolCallStartEvent)
      ).resolves.not.toThrow();

      await expect(
        chatEventHandler.handleEvent({
          type: EventType.TOOL_CALL_ARGS,
          toolCallId,
          delta: '{}',
        } as ToolCallArgsEvent)
      ).resolves.not.toThrow();

      await expect(
        chatEventHandler.handleEvent({
          type: EventType.TOOL_CALL_END,
          toolCallId,
        } as ToolCallEndEvent)
      ).resolves.not.toThrow();
    });
  });

  describe('stopToolResultStreaming', () => {
    it('should stop active tool result streaming and reset state', async () => {
      const toolCallId = 'tool-123';
      const mockResult = { success: true, data: 'test result' };

      mockAssistantActionService.executeAction = jest.fn().mockResolvedValue(mockResult);

      // Mock sendToolResult to return observable with unsubscribe
      const mockToolMessage: ToolMessage = {
        id: `tool-result-${toolCallId}`,
        role: 'tool',
        content: JSON.stringify(mockResult),
        toolCallId,
      };

      const mockUnsubscribe = jest.fn();
      const mockObservable = {
        subscribe: jest.fn().mockReturnValue({ unsubscribe: mockUnsubscribe }),
      };

      mockChatService.sendToolResult = jest.fn().mockResolvedValue({
        observable: mockObservable,
        toolMessage: mockToolMessage,
      });

      // Trigger tool call flow to start streaming
      await chatEventHandler.handleEvent({
        type: EventType.TOOL_CALL_START,
        toolCallId,
        toolCallName: 'test_action',
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

      // Verify streaming was started
      expect(mockObservable.subscribe).toHaveBeenCalled();

      // Clear previous calls
      mockOnStreamingStateChange.mockClear();
      mockOnStartResponse.mockClear();

      // Stop the streaming
      chatEventHandler.stopToolResultStreaming();

      // Verify unsubscribe was called
      expect(mockUnsubscribe).toHaveBeenCalled();

      // Verify state was reset
      expect(mockOnStreamingStateChange).toHaveBeenCalledWith(false);
      expect(mockOnStartResponse).toHaveBeenCalledWith(false);
    });

    it('should handle stopToolResultStreaming when no streaming is active', () => {
      // Should not throw when there's no active subscription
      expect(() => {
        chatEventHandler.stopToolResultStreaming();
      }).not.toThrow();

      // State callbacks should not be called when there's no active streaming
      expect(mockOnStreamingStateChange).not.toHaveBeenCalled();
      expect(mockOnStartResponse).not.toHaveBeenCalled();
    });
  });

  describe('telemetry', () => {
    let mockTelemetryRecorder: {
      recordEvent: jest.Mock;
      recordMetric: jest.Mock;
      recordError: jest.Mock;
    };
    let chatEventHandlerWithTelemetry: ChatEventHandler;

    beforeEach(() => {
      mockTelemetryRecorder = {
        recordEvent: jest.fn(),
        recordMetric: jest.fn(),
        recordError: jest.fn(),
      };

      chatEventHandlerWithTelemetry = new ChatEventHandler({
        assistantActionService: mockAssistantActionService,
        chatService: mockChatService,
        // @ts-expect-error TS2322 TODO(ts-error): fixme
        confirmationService: mockConfirmationService,
        telemetryRecorder: mockTelemetryRecorder,
        callbacks: {
          onTimelineUpdate: mockOnTimelineUpdate,
          onStreamingStateChange: mockOnStreamingStateChange,
          onStartResponse: mockOnStartResponse,
          getTimeline: mockGetTimeline,
        },
      });
    });

    it('should record success telemetry when run finishes', async () => {
      // Start run
      await chatEventHandlerWithTelemetry.handleEvent({
        type: EventType.RUN_STARTED,
        threadId: 'test-thread',
        runId: 'test-run',
      });

      // Finish run
      await chatEventHandlerWithTelemetry.handleEvent({
        type: EventType.RUN_FINISHED,
        threadId: 'test-thread',
        runId: 'test-run',
      });

      // Verify success event was recorded
      expect(mockTelemetryRecorder.recordEvent).toHaveBeenCalledWith({
        name: 'chat_interaction_success',
        data: {
          threadId: 'test-thread',
          runId: 'test-run',
        },
      });

      // Verify duration metric was recorded
      expect(mockTelemetryRecorder.recordMetric).toHaveBeenCalledWith({
        name: 'chat_interaction_duration_ms',
        value: expect.any(Number),
        unit: 'ms',
        labels: {
          status: 'success',
        },
      });
    });

    it('should record failure telemetry when run errors', async () => {
      // Start run
      await chatEventHandlerWithTelemetry.handleEvent({
        type: EventType.RUN_STARTED,
        threadId: 'test-thread',
        runId: 'test-run',
      });

      // Error occurs
      await chatEventHandlerWithTelemetry.handleEvent({
        type: EventType.RUN_ERROR,
        message: 'Something went wrong',
        code: 'ERR_001',
      });

      // Verify failure event was recorded
      expect(mockTelemetryRecorder.recordEvent).toHaveBeenCalledWith({
        name: 'chat_interaction_failure',
        data: {
          errorMessage: 'Something went wrong',
          errorCode: 'ERR_001',
        },
      });

      // Verify error was recorded
      expect(mockTelemetryRecorder.recordError).toHaveBeenCalledWith({
        type: 'ChatInteractionError',
        message: 'Something went wrong',
        context: {
          errorCode: 'ERR_001',
        },
      });

      // Verify duration metric was recorded with failure status
      expect(mockTelemetryRecorder.recordMetric).toHaveBeenCalledWith({
        name: 'chat_interaction_duration_ms',
        value: expect.any(Number),
        unit: 'ms',
        labels: {
          status: 'failure',
        },
      });
    });

    it('should not record telemetry when telemetryRecorder is not provided', async () => {
      // Use the original handler without telemetry
      await chatEventHandler.handleEvent({
        type: EventType.RUN_STARTED,
        threadId: 'test-thread',
        runId: 'test-run',
      });

      await chatEventHandler.handleEvent({
        type: EventType.RUN_FINISHED,
        threadId: 'test-thread',
        runId: 'test-run',
      });

      // The mock should not have been called because original handler has no telemetry
      expect(mockTelemetryRecorder.recordEvent).not.toHaveBeenCalled();
    });

    it('should record duration correctly', async () => {
      // Mock Date.now to control timing
      const originalDateNow = Date.now;
      let currentTime = 1000;
      Date.now = jest.fn(() => currentTime);

      // Start run at time 1000
      await chatEventHandlerWithTelemetry.handleEvent({
        type: EventType.RUN_STARTED,
        threadId: 'test-thread',
        runId: 'test-run',
      });

      // Advance time by 500ms
      currentTime = 1500;

      // Finish run at time 1500
      await chatEventHandlerWithTelemetry.handleEvent({
        type: EventType.RUN_FINISHED,
        threadId: 'test-thread',
        runId: 'test-run',
      });

      // Verify duration was 500ms
      expect(mockTelemetryRecorder.recordMetric).toHaveBeenCalledWith({
        name: 'chat_interaction_duration_ms',
        value: 500,
        unit: 'ms',
        labels: {
          status: 'success',
        },
      });

      // Restore Date.now
      Date.now = originalDateNow;
    });
  });

  describe('sendToolResultToAssistant skip handling (duplicate tool result)', () => {
    it('should append system info message (not tool message) when sendToolResult returns skipped', async () => {
      const toolCallId = 'tool-skip-1';
      const mockResult = { success: true, data: 'test result' };

      mockAssistantActionService.executeAction = jest.fn().mockResolvedValue(mockResult);

      const constructedToolMessage: ToolMessage = {
        id: `tool-result-${toolCallId}`,
        role: 'tool',
        content: JSON.stringify(mockResult),
        toolCallId,
      };

      const emptyObservable = {
        subscribe: jest.fn().mockImplementation(({ complete }) => {
          if (complete) complete();
          return { unsubscribe: jest.fn() };
        }),
      };

      mockChatService.sendToolResult = jest.fn().mockResolvedValue({
        observable: emptyObservable,
        toolMessage: constructedToolMessage,
        skipped: { reason: 'result_already_exists' },
      });

      await chatEventHandler.handleEvent({
        type: EventType.TOOL_CALL_START,
        toolCallId,
        toolCallName: 'test_tool',
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

      const toolMessagesInTimeline = timeline.filter((m) => m.role === 'tool');
      expect(toolMessagesInTimeline).not.toContainEqual(constructedToolMessage);

      const systemMessages = timeline.filter((m) => m.role === 'system');
      const skipInfoMessage = systemMessages.find((m) =>
        (m as any).content?.includes('another window')
      );
      expect(skipInfoMessage).toBeDefined();
      expect((skipInfoMessage as any).id).toMatch(/^tool-skipped-/);
    });

    it('should not subscribe to the observable or flip streaming state when skipped', async () => {
      const toolCallId = 'tool-skip-2';
      const mockResult = 'string result';

      mockAssistantActionService.executeAction = jest.fn().mockResolvedValue(mockResult);

      const subscribeSpy = jest.fn();
      const emptyObservable = { subscribe: subscribeSpy };

      mockChatService.sendToolResult = jest.fn().mockResolvedValue({
        observable: emptyObservable,
        toolMessage: {
          id: `tool-result-${toolCallId}`,
          role: 'tool',
          content: mockResult,
          toolCallId,
        },
        skipped: { reason: 'result_already_exists' },
      });

      mockOnStreamingStateChange.mockClear();

      await chatEventHandler.handleEvent({
        type: EventType.TOOL_CALL_START,
        toolCallId,
        toolCallName: 'test_tool',
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

      expect(subscribeSpy).not.toHaveBeenCalled();
      expect(mockOnStreamingStateChange).not.toHaveBeenCalledWith(true);
    });

    it('should still call onSendToolResultStateChange(true) then (false) when skipped', async () => {
      const mockOnSendToolResultStateChange = jest.fn();
      const handlerWithCallback = new ChatEventHandler({
        assistantActionService: mockAssistantActionService,
        chatService: mockChatService,
        // @ts-expect-error TS2740 TODO(ts-error): fixme
        confirmationService: mockConfirmationService,
        callbacks: {
          onTimelineUpdate: mockOnTimelineUpdate,
          onStreamingStateChange: mockOnStreamingStateChange,
          onStartResponse: mockOnStartResponse,
          onSendToolResultStateChange: mockOnSendToolResultStateChange,
          getTimeline: mockGetTimeline,
        },
      });

      const toolCallId = 'tool-skip-3';
      mockAssistantActionService.executeAction = jest.fn().mockResolvedValue({ ok: true });

      mockChatService.sendToolResult = jest.fn().mockResolvedValue({
        observable: { subscribe: jest.fn() },
        toolMessage: {
          id: `tool-result-${toolCallId}`,
          role: 'tool',
          content: '{"ok":true}',
          toolCallId,
        },
        skipped: { reason: 'result_already_exists' },
      });

      await handlerWithCallback.handleEvent({
        type: EventType.TOOL_CALL_START,
        toolCallId,
        toolCallName: 'test_tool',
      } as ToolCallStartEvent);

      await handlerWithCallback.handleEvent({
        type: EventType.TOOL_CALL_ARGS,
        toolCallId,
        delta: '{}',
      } as ToolCallArgsEvent);

      await handlerWithCallback.handleEvent({
        type: EventType.TOOL_CALL_END,
        toolCallId,
      } as ToolCallEndEvent);

      expect(mockOnSendToolResultStateChange).toHaveBeenCalledWith(true);
      expect(mockOnSendToolResultStateChange).toHaveBeenCalledWith(false);
    });

    it('should follow the normal dispatch path when skipped is undefined', async () => {
      const toolCallId = 'tool-no-skip';
      const mockResult = { ok: true };

      mockAssistantActionService.executeAction = jest.fn().mockResolvedValue(mockResult);

      const constructedToolMessage: ToolMessage = {
        id: `tool-result-${toolCallId}`,
        role: 'tool',
        content: JSON.stringify(mockResult),
        toolCallId,
      };

      const subscribeSpy = jest.fn().mockReturnValue({ unsubscribe: jest.fn() });
      const observable = { subscribe: subscribeSpy };

      mockChatService.sendToolResult = jest.fn().mockResolvedValue({
        observable,
        toolMessage: constructedToolMessage,
      });

      await chatEventHandler.handleEvent({
        type: EventType.TOOL_CALL_START,
        toolCallId,
        toolCallName: 'test_tool',
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

      expect(timeline).toContainEqual(constructedToolMessage);
      const skipInfoMessage = timeline.find((m) => (m as any).id?.startsWith('tool-skipped-'));
      expect(skipInfoMessage).toBeUndefined();
      expect(subscribeSpy).toHaveBeenCalledTimes(1);
    });
  });
});

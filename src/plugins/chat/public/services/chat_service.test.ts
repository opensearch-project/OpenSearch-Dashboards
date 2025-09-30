/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChatService } from './chat_service';
import { AgUiAgent, BaseEvent } from './ag_ui_agent';
import { Observable } from 'rxjs';
import { Message } from '../../common/types';
import type { ToolDefinition } from '../../../context_provider/public';

// Mock AgUiAgent
jest.mock('./ag_ui_agent');

describe('ChatService', () => {
  let chatService: ChatService;
  let mockAgent: jest.Mocked<AgUiAgent>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock agent
    mockAgent = {
      runAgent: jest.fn(),
      abort: jest.fn(),
    } as any;

    // Mock AgUiAgent constructor
    (AgUiAgent as jest.MockedClass<typeof AgUiAgent>).mockImplementation(() => mockAgent);

    chatService = new ChatService('http://test-server');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with default server URL', () => {
      const service = new ChatService();
      expect(AgUiAgent).toHaveBeenCalledWith(undefined);
    });

    it('should create instance with custom server URL', () => {
      const customUrl = 'http://custom-server:8080';
      const service = new ChatService(customUrl);
      expect(AgUiAgent).toHaveBeenCalledWith(customUrl);
    });

    it('should initialize with empty available tools', () => {
      expect(chatService.availableTools).toEqual([]);
    });
  });

  describe('ID generation methods', () => {
    it('should generate unique thread IDs', () => {
      const service1 = new ChatService();
      const service2 = new ChatService();

      // Access private method via any cast for testing
      const threadId1 = (service1 as any).generateThreadId();
      const threadId2 = (service2 as any).generateThreadId();

      expect(threadId1).toMatch(/^thread-\d+-[a-z0-9]{9}$/);
      expect(threadId2).toMatch(/^thread-\d+-[a-z0-9]{9}$/);
      expect(threadId1).not.toBe(threadId2);
    });

    it('should generate unique run IDs', () => {
      const runId1 = (chatService as any).generateRunId();
      const runId2 = (chatService as any).generateRunId();

      expect(runId1).toMatch(/^run-\d+-[a-z0-9]{9}$/);
      expect(runId2).toMatch(/^run-\d+-[a-z0-9]{9}$/);
      expect(runId1).not.toBe(runId2);
    });

    it('should generate unique message IDs', () => {
      const msgId1 = (chatService as any).generateMessageId();
      const msgId2 = (chatService as any).generateMessageId();

      expect(msgId1).toMatch(/^msg-\d+-[a-z0-9]{9}$/);
      expect(msgId2).toMatch(/^msg-\d+-[a-z0-9]{9}$/);
      expect(msgId1).not.toBe(msgId2);
    });

    it('should generate incremental request IDs', () => {
      const reqId1 = (chatService as any).generateRequestId();
      const reqId2 = (chatService as any).generateRequestId();

      expect(reqId1).toMatch(/^chat-req-\d+-1$/);
      expect(reqId2).toMatch(/^chat-req-\d+-2$/);
    });
  });

  describe('request tracking', () => {
    it('should track active requests', () => {
      expect((chatService as any).isRequestActive()).toBe(false);

      (chatService as any).addActiveRequest('test-req-1');
      expect((chatService as any).isRequestActive()).toBe(true);

      (chatService as any).addActiveRequest('test-req-2');
      expect((chatService as any).activeRequests.size).toBe(2);

      (chatService as any).removeActiveRequest('test-req-1');
      expect((chatService as any).activeRequests.size).toBe(1);
      expect((chatService as any).isRequestActive()).toBe(true);

      (chatService as any).removeActiveRequest('test-req-2');
      expect((chatService as any).isRequestActive()).toBe(false);
    });
  });

  describe('sendMessage', () => {
    beforeEach(() => {
      // Mock window.assistantContextStore
      (global as any).window = {
        assistantContextStore: {
          getAllContexts: jest.fn().mockReturnValue([]),
          getBackendFormattedContexts: jest.fn().mockReturnValue([]),
        },
      };
    });

    afterEach(() => {
      delete (global as any).window;
    });

    it('should send message and return observable with user message', async () => {
      const mockObservable = new Observable<BaseEvent>();
      mockAgent.runAgent.mockReturnValue(mockObservable);

      const messages: Message[] = [];
      const content = 'Hello, world!';

      const result = await chatService.sendMessage(content, messages);

      expect(result.userMessage).toEqual({
        id: expect.stringMatching(/^msg-\d+-[a-z0-9]{9}$/),
        role: 'user',
        content: 'Hello, world!',
      });

      expect(result.observable).toBeDefined();
      expect(mockAgent.runAgent).toHaveBeenCalledWith({
        threadId: expect.stringMatching(/^thread-\d+-[a-z0-9]{9}$/),
        runId: expect.stringMatching(/^run-\d+-[a-z0-9]{9}$/),
        messages: [result.userMessage],
        tools: [],
        context: [],
        state: {},
        forwardedProps: {},
      });
    });

    it('should trim message content', async () => {
      const mockObservable = new Observable<BaseEvent>();
      mockAgent.runAgent.mockReturnValue(mockObservable);

      const result = await chatService.sendMessage('  Hello  ', []);

      expect(result.userMessage.content).toBe('Hello');
    });

    it('should include available tools in request', async () => {
      const mockObservable = new Observable<BaseEvent>();
      mockAgent.runAgent.mockReturnValue(mockObservable);

      const tools: ToolDefinition[] = [
        {
          name: 'test_tool',
          description: 'Test tool',
          parameters: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
      ];
      chatService.availableTools = tools;

      await chatService.sendMessage('test', []);

      expect(mockAgent.runAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          tools,
        })
      );
    });

    it('should handle missing context store gracefully', async () => {
      // Mock window without assistantContextStore
      (global as any).window = {};

      const mockObservable = new Observable<BaseEvent>();
      mockAgent.runAgent.mockReturnValue(mockObservable);

      const result = await chatService.sendMessage('test', []);

      expect(result.userMessage.content).toBe('test');
      expect(result.observable).toBeDefined();
      expect(mockAgent.runAgent).toHaveBeenCalledWith({
        threadId: expect.stringMatching(/^thread-\d+-[a-z0-9]{9}$/),
        runId: expect.stringMatching(/^run-\d+-[a-z0-9]{9}$/),
        messages: [result.userMessage],
        tools: [],
        context: [],
        state: {},
        forwardedProps: {},
      });
    });
  });

  describe('sendToolResult', () => {
    beforeEach(() => {
      (global as any).window = {
        assistantContextStore: {
          getAllContexts: jest.fn().mockReturnValue([]),
          getBackendFormattedContexts: jest.fn().mockReturnValue([]),
        },
      };
    });

    afterEach(() => {
      delete (global as any).window;
    });

    it('should send tool result and return observable with tool message', async () => {
      const mockObservable = new Observable<BaseEvent>();
      mockAgent.runAgent.mockReturnValue(mockObservable);

      const toolCallId = 'tool-call-123';
      const result = { success: true, data: 'test result' };
      const messages: Message[] = [];

      const response = await chatService.sendToolResult(toolCallId, result, messages);

      expect(response.toolMessage).toEqual({
        id: expect.stringMatching(/^msg-\d+-[a-z0-9]{9}$/),
        role: 'tool',
        content: JSON.stringify(result),
        toolCallId,
      });

      expect(response.observable).toBeDefined();
      expect(mockAgent.runAgent).toHaveBeenCalledWith({
        threadId: expect.stringMatching(/^thread-\d+-[a-z0-9]{9}$/),
        runId: expect.stringMatching(/^run-\d+-[a-z0-9]{9}$/),
        messages: [response.toolMessage],
        tools: [],
        context: [],
        state: {},
        forwardedProps: {},
      });
    });

    it('should handle string results directly', async () => {
      const mockObservable = new Observable<BaseEvent>();
      mockAgent.runAgent.mockReturnValue(mockObservable);

      const response = await chatService.sendToolResult('tool-123', 'string result', []);

      expect(response.toolMessage.content).toBe('string result');
    });

    it('should stringify object results', async () => {
      const mockObservable = new Observable<BaseEvent>();
      mockAgent.runAgent.mockReturnValue(mockObservable);

      const objectResult = { key: 'value', number: 42 };
      const response = await chatService.sendToolResult('tool-123', objectResult, []);

      expect(response.toolMessage.content).toBe(JSON.stringify(objectResult));
    });
  });

  describe('abort', () => {
    it('should call agent abort method', () => {
      chatService.abort();
      expect(mockAgent.abort).toHaveBeenCalled();
    });
  });

  describe('newThread', () => {
    it('should generate new thread ID', () => {
      const originalThreadId = (chatService as any).threadId;

      chatService.newThread();

      const newThreadId = (chatService as any).threadId;
      expect(newThreadId).not.toBe(originalThreadId);
      expect(newThreadId).toMatch(/^thread-\d+-[a-z0-9]{9}$/);
    });
  });
});

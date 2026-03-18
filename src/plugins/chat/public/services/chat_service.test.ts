/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChatService } from './chat_service';
import { AgUiAgent, BaseEvent } from './ag_ui_agent';
import { Observable, BehaviorSubject } from 'rxjs';
import { Message } from '../../common/types';
import { ToolDefinition } from '../../../context_provider/public';
import { ChatServiceStart } from '../../../../core/public';

// Mock AgUiAgent
jest.mock('./ag_ui_agent');

// Mock data source management
jest.mock('../../../data_source_management/public', () => ({
  getDefaultDataSourceId: jest.fn(),
}));

describe('ChatService', () => {
  let chatService: ChatService;
  let mockAgent: jest.Mocked<AgUiAgent>;
  let mockCoreChatService: jest.Mocked<ChatServiceStart>;
  let mockThreadId$: BehaviorSubject<string | undefined>;
  let mockUiSettings: any;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock UI settings
    mockUiSettings = {
      get: jest.fn(),
    } as any;

    // Set up global sessionStorage mock before creating ChatService
    Object.defineProperty(global, 'sessionStorage', {
      value: {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });

    // Set up global window mock for context store
    Object.defineProperty(global, 'window', {
      value: {},
      writable: true,
    });

    // Create mock thread ID observable - starts as undefined
    const generateMockThreadId = () => {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 11);
      return `thread-${timestamp}-${randomStr}`;
    };
    mockThreadId$ = new BehaviorSubject<string | undefined>(undefined);

    // Create mock window state with proper state management
    const mockWindowState$ = new BehaviorSubject({
      isWindowOpen: false,
      windowMode: 'sidecar' as const,
      paddingSize: 400,
    });

    // Mock callback sets for window events
    const mockWindowOpenCallbacks = new Set<() => void>();
    const mockWindowCloseCallbacks = new Set<() => void>();

    // Create mock core chat service with proper callback management
    mockCoreChatService = {
      isAvailable: jest.fn().mockReturnValue(true),
      getThreadId: jest.fn(() => mockThreadId$.getValue()),
      getThreadId$: jest.fn(() => mockThreadId$.asObservable()),
      setThreadId: jest.fn((id: string) => mockThreadId$.next(id)),
      newThread: jest.fn(() => {
        const newId = generateMockThreadId();
        mockThreadId$.next(newId);
      }),
      isWindowOpen: jest.fn(() => mockWindowState$.getValue().isWindowOpen),
      getWindowState: jest.fn(() => mockWindowState$.getValue()),
      getWindowState$: jest.fn(() => mockWindowState$.asObservable()),
      setWindowState: jest.fn((state: any) => {
        const currentState = mockWindowState$.getValue();
        const newState = { ...currentState, ...state };
        mockWindowState$.next(newState);
      }),
      onWindowOpen: jest.fn((callback: () => void) => {
        mockWindowOpenCallbacks.add(callback);
        return () => mockWindowOpenCallbacks.delete(callback);
      }),
      onWindowClose: jest.fn((callback: () => void) => {
        mockWindowCloseCallbacks.add(callback);
        return () => mockWindowCloseCallbacks.delete(callback);
      }),
      openWindow: jest.fn(async () => {
        const currentState = mockWindowState$.getValue();
        if (!currentState.isWindowOpen) {
          mockWindowState$.next({ ...currentState, isWindowOpen: true });
          // Use setImmediate/nextTick to ensure callbacks run asynchronously
          await Promise.resolve();
          mockWindowOpenCallbacks.forEach((callback) => callback());
        }
      }),
      closeWindow: jest.fn(() => {
        const currentState = mockWindowState$.getValue();
        if (currentState.isWindowOpen) {
          mockWindowState$.next({ ...currentState, isWindowOpen: false });
          mockWindowCloseCallbacks.forEach((callback) => callback());
        }
      }),
      sendMessage: jest.fn(),
      sendMessageWithWindow: jest.fn(),
      suggestedActionsService: undefined,
      getMemoryProvider: jest.fn().mockReturnValue({ includeFullHistory: false }),
    } as any;

    // Create mock agent
    mockAgent = {
      runAgent: jest.fn(),
      abort: jest.fn(),
      resetConnection: jest.fn(),
    } as any;

    // Mock AgUiAgent constructor
    (AgUiAgent as jest.MockedClass<typeof AgUiAgent>).mockImplementation(() => mockAgent);

    chatService = new ChatService(mockUiSettings, mockCoreChatService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with empty available tools', () => {
      expect(chatService.availableTools).toEqual([]);
    });
  });

  describe('getThreadId$', () => {
    it('should return an observable that emits the current thread ID', (done) => {
      // Initialize a thread first
      chatService.newThread();
      const threadId$ = chatService.getThreadId$();

      threadId$.subscribe((threadId) => {
        expect(threadId).toMatch(/^thread-\d+-[a-z0-9]{9}$/);
        expect(typeof threadId).toBe('string');
        done();
      });
    });

    it('should emit new thread ID when newThread is called', (done) => {
      // Initialize a thread first
      chatService.newThread();
      const threadId$ = chatService.getThreadId$();
      const emittedValues: Array<string | undefined> = [];

      threadId$.subscribe((threadId) => {
        if (threadId) {
          emittedValues.push(threadId);
        }

        if (emittedValues.length === 2) {
          // Verify we got two different thread IDs
          expect(emittedValues[0]).toMatch(/^thread-\d+-[a-z0-9]{9}$/);
          expect(emittedValues[1]).toMatch(/^thread-\d+-[a-z0-9]{9}$/);
          expect(emittedValues[0]).not.toBe(emittedValues[1]);
          done();
        }
      });

      // Trigger a new thread after initial subscription
      setTimeout(() => {
        chatService.newThread();
      }, 10);
    });

    it('should provide consistent thread ID across multiple subscriptions', () => {
      // Initialize a thread first
      chatService.newThread();
      const threadId$ = chatService.getThreadId$();
      let threadId1: string | undefined;
      let threadId2: string | undefined;

      // First subscription
      threadId$.subscribe((threadId) => {
        threadId1 = threadId;
      });

      // Second subscription
      threadId$.subscribe((threadId) => {
        threadId2 = threadId;
      });

      // Both subscriptions should receive the same current thread ID
      expect(threadId1).toBeDefined();
      expect(threadId2).toBeDefined();
      expect(threadId1).toBe(threadId2);
    });
  });

  describe('ID generation methods', () => {
    it('should generate unique thread IDs', () => {
      // Create separate mock core services for independent instances
      const generateThreadId1 = () =>
        `thread-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      const generateThreadId2 = () =>
        `thread-${Date.now() + 1}-${Math.random().toString(36).substring(2, 11)}`;

      const mockThreadId1$ = new BehaviorSubject<string>(generateThreadId1());
      const mockThreadId2$ = new BehaviorSubject<string>(generateThreadId2());

      const mockCoreService1 = {
        ...mockCoreChatService,
        getThreadId: () => mockThreadId1$.getValue(),
        getThreadId$: () => mockThreadId1$.asObservable(),
      } as any;

      const mockCoreService2 = {
        ...mockCoreChatService,
        getThreadId: () => mockThreadId2$.getValue(),
        getThreadId$: () => mockThreadId2$.asObservable(),
      } as any;

      const service1 = new ChatService(mockUiSettings, mockCoreService1);
      const service2 = new ChatService(mockUiSettings, mockCoreService2);

      const threadId1 = service1.getThreadId();
      const threadId2 = service2.getThreadId();

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

  describe('sendMessage', () => {
    beforeEach(() => {
      // Initialize a thread first - required for sendMessage
      chatService.newThread();
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
      expect(mockAgent.runAgent).toHaveBeenCalledWith(
        {
          threadId: expect.stringMatching(/^thread-\d+-[a-z0-9]{9}$/),
          runId: expect.stringMatching(/^run-\d+-[a-z0-9]{9}$/),
          messages: [result.userMessage],
          tools: [],
          context: [],
          state: {},
          forwardedProps: {},
        },
        undefined
      ); // dataSourceId is undefined when no uiSettings provided
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
        }),
        undefined // dataSourceId is undefined when no uiSettings provided
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
      expect(mockAgent.runAgent).toHaveBeenCalledWith(
        {
          threadId: expect.stringMatching(/^thread-\d+-[a-z0-9]{9}$/),
          runId: expect.stringMatching(/^run-\d+-[a-z0-9]{9}$/),
          messages: [result.userMessage],
          tools: [],
          context: [],
          state: {},
          forwardedProps: {},
        },
        undefined
      ); // dataSourceId is undefined when no uiSettings provided
    });

    it('should merge text with multimodal content when last message has array content', async () => {
      const mockObservable = new Observable<BaseEvent>();
      mockAgent.runAgent.mockReturnValue(mockObservable);

      const imageMessage: Message = {
        id: 'image-msg-1',
        role: 'user',
        content: [
          {
            type: 'binary',
            mimeType: 'image/jpeg',
            data: 'base64encodeddata',
          },
        ],
      };

      const result = await chatService.sendMessage('Analyze this image', [imageMessage]);

      // Should merge image with text into a single message
      expect(result.userMessage.content).toEqual([
        {
          type: 'binary',
          mimeType: 'image/jpeg',
          data: 'base64encodeddata',
        },
        {
          type: 'text',
          text: 'Analyze this image',
        },
      ]);

      // Should have a new ID
      expect(result.userMessage.id).not.toBe('image-msg-1');
      expect(result.userMessage.id).toMatch(/^msg-\d+-[a-z0-9]{9}$/);

      // Should only send the merged message (not the original image message)
      expect(mockAgent.runAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [result.userMessage],
        }),
        undefined
      );
    });

    it('should preserve order when merging multimodal content', async () => {
      const mockObservable = new Observable<BaseEvent>();
      mockAgent.runAgent.mockReturnValue(mockObservable);

      const multimodalMessage: Message = {
        id: 'multi-msg-1',
        role: 'user',
        content: [
          {
            type: 'binary',
            mimeType: 'image/png',
            data: 'firstimage',
          },
          {
            type: 'binary',
            mimeType: 'image/jpeg',
            data: 'secondimage',
          },
        ],
      };

      const result = await chatService.sendMessage('What are these?', [multimodalMessage]);

      // Should preserve order: first image, second image, then text
      expect(result.userMessage.content).toEqual([
        {
          type: 'binary',
          mimeType: 'image/png',
          data: 'firstimage',
        },
        {
          type: 'binary',
          mimeType: 'image/jpeg',
          data: 'secondimage',
        },
        {
          type: 'text',
          text: 'What are these?',
        },
      ]);
    });

    it('should create simple text message when no array content exists', async () => {
      const mockObservable = new Observable<BaseEvent>();
      mockAgent.runAgent.mockReturnValue(mockObservable);

      const textMessage: Message = {
        id: 'text-msg-1',
        role: 'user',
        content: 'Previous message',
      };

      const result = await chatService.sendMessage('New message', [textMessage]);

      // Should create a simple text message (not array)
      expect(result.userMessage.content).toBe('New message');
      expect(Array.isArray(result.userMessage.content)).toBe(false);
    });

    it('should not merge when last message is not a user message', async () => {
      const mockObservable = new Observable<BaseEvent>();
      mockAgent.runAgent.mockReturnValue(mockObservable);

      const assistantMessage: Message = {
        id: 'assistant-msg-1',
        role: 'assistant',
        content: 'I am the assistant',
      };

      const result = await chatService.sendMessage('User message', [assistantMessage]);

      // Should create a simple text message
      expect(result.userMessage.content).toBe('User message');
      expect(Array.isArray(result.userMessage.content)).toBe(false);
    });

    it('should throw error when thread ID is not set', async () => {
      // Reset thread ID to undefined by creating a new service without calling newThread
      const newService = new ChatService(mockUiSettings, mockCoreChatService);

      // Mock getThreadId to return undefined
      mockCoreChatService.getThreadId.mockReturnValue(undefined);

      await expect(newService.sendMessage('test', [])).rejects.toThrow(
        'Thread ID is required to send a message'
      );
    });
  });

  describe('sendToolResult', () => {
    // Helper function to create mock MESSAGES_SNAPSHOT event with toolCalls
    const createMockMessagesSnapshot = (toolCallId: string) => [
      {
        type: 'MESSAGES_SNAPSHOT',
        timestamp: Date.now(),
        messages: [
          {
            role: 'user',
            id: 'user-msg-1',
            content: 'Test message',
          },
          {
            role: 'assistant',
            id: 'assistant-msg-1',
            content: 'Response with tool call',
            toolCalls: [
              {
                id: toolCallId,
                type: 'function',
                function: {
                  name: 'test_tool',
                  arguments: '{}',
                },
              },
            ],
          },
        ],
      },
    ];

    beforeEach(() => {
      // Initialize a thread first - required for sendToolResult
      chatService.newThread();
      (global as any).window = {
        assistantContextStore: {
          getAllContexts: jest.fn().mockReturnValue([]),
          getBackendFormattedContexts: jest.fn().mockReturnValue([]),
        },
      };

      // Mock getConversation to return MESSAGES_SNAPSHOT with toolCalls (for waitForToolCallSync)
      chatService.conversationHistoryService.getConversation = jest
        .fn()
        .mockImplementation(() => Promise.resolve(createMockMessagesSnapshot('tool-call-123')));
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

      // Mock getConversation to return MESSAGES_SNAPSHOT with the specific toolCallId
      chatService.conversationHistoryService.getConversation = jest
        .fn()
        .mockResolvedValue(createMockMessagesSnapshot(toolCallId));

      const response = await chatService.sendToolResult(toolCallId, result, messages);

      expect(response.toolMessage).toEqual({
        id: expect.stringMatching(/^msg-\d+-[a-z0-9]{9}$/),
        role: 'tool',
        content: JSON.stringify(result),
        toolCallId,
      });

      expect(response.observable).toBeDefined();
      expect(mockAgent.runAgent).toHaveBeenCalledWith(
        {
          threadId: expect.stringMatching(/^thread-\d+-[a-z0-9]{9}$/),
          runId: expect.stringMatching(/^run-\d+-[a-z0-9]{9}$/),
          messages: [response.toolMessage],
          tools: [],
          context: [],
          state: {},
          forwardedProps: {},
        },
        undefined
      ); // dataSourceId is undefined when no uiSettings provided
    });

    it('should handle string results directly', async () => {
      const mockObservable = new Observable<BaseEvent>();
      mockAgent.runAgent.mockReturnValue(mockObservable);

      // Mock getConversation to return MESSAGES_SNAPSHOT with the specific toolCallId
      chatService.conversationHistoryService.getConversation = jest
        .fn()
        .mockResolvedValue(createMockMessagesSnapshot('tool-123'));

      const response = await chatService.sendToolResult('tool-123', 'string result', []);

      expect(response.toolMessage.content).toBe('string result');
    });

    it('should stringify object results', async () => {
      const mockObservable = new Observable<BaseEvent>();
      mockAgent.runAgent.mockReturnValue(mockObservable);

      // Mock getConversation to return MESSAGES_SNAPSHOT with the specific toolCallId
      chatService.conversationHistoryService.getConversation = jest
        .fn()
        .mockResolvedValue(createMockMessagesSnapshot('tool-123'));

      const objectResult = { key: 'value', number: 42 };
      const response = await chatService.sendToolResult('tool-123', objectResult, []);

      expect(response.toolMessage.content).toBe(JSON.stringify(objectResult));
    });

    it('should only pass tool message when memory provider does not include full history', async () => {
      const mockObservable = new Observable<BaseEvent>();
      mockAgent.runAgent.mockReturnValue(mockObservable);

      // Mock memory provider with includeFullHistory = false
      mockCoreChatService.getMemoryProvider = jest
        .fn()
        .mockReturnValue({ includeFullHistory: false });

      const toolCallId = 'tool-call-456';
      const result = { success: true };
      const messages: Message[] = [
        { id: 'msg-1', role: 'user', content: 'Previous user message' },
        { id: 'msg-2', role: 'assistant', content: 'Previous assistant message' },
      ];

      // Mock getConversation to return MESSAGES_SNAPSHOT with the specific toolCallId
      chatService.conversationHistoryService.getConversation = jest
        .fn()
        .mockResolvedValue(createMockMessagesSnapshot(toolCallId));

      const response = await chatService.sendToolResult(toolCallId, result, messages);

      // Verify that only the tool message is passed, not the full history
      expect(mockAgent.runAgent).toHaveBeenCalledWith(
        {
          threadId: expect.stringMatching(/^thread-\d+-[a-z0-9]{9}$/),
          runId: expect.stringMatching(/^run-\d+-[a-z0-9]{9}$/),
          messages: [response.toolMessage], // Only tool message, not [...messages, toolMessage]
          tools: [],
          context: [],
          state: {},
          forwardedProps: {},
        },
        undefined
      );

      // Verify the tool message structure
      expect(response.toolMessage).toEqual({
        id: expect.stringMatching(/^msg-\d+-[a-z0-9]{9}$/),
        role: 'tool',
        content: JSON.stringify(result),
        toolCallId,
      });
    });

    it('should wait for tool call sync when includeFullHistory is false', async () => {
      const mockObservable = new Observable<BaseEvent>();
      mockAgent.runAgent.mockReturnValue(mockObservable);

      // Mock memory provider with includeFullHistory = false
      mockCoreChatService.getMemoryProvider = jest
        .fn()
        .mockReturnValue({ includeFullHistory: false });

      const toolCallId = 'tool-call-sync-test';

      // Mock getConversation to return MESSAGES_SNAPSHOT with the tool call
      chatService.conversationHistoryService.getConversation = jest
        .fn()
        .mockResolvedValue(createMockMessagesSnapshot(toolCallId));

      const response = await chatService.sendToolResult(toolCallId, { success: true }, []);

      // Verify getConversation was called to check for sync
      expect(chatService.conversationHistoryService.getConversation).toHaveBeenCalled();
      expect(response.toolMessage.toolCallId).toBe(toolCallId);
    });

    it('should skip waiting for tool call sync when includeFullHistory is true', async () => {
      const mockObservable = new Observable<BaseEvent>();
      mockAgent.runAgent.mockReturnValue(mockObservable);

      // Mock memory provider with includeFullHistory = true
      mockCoreChatService.getMemoryProvider = jest
        .fn()
        .mockReturnValue({ includeFullHistory: true });

      const toolCallId = 'tool-call-no-sync';

      // Mock getConversation - should NOT be called when includeFullHistory is true
      chatService.conversationHistoryService.getConversation = jest.fn();

      const messages: Message[] = [{ id: 'msg-1', role: 'user', content: 'Previous message' }];

      const response = await chatService.sendToolResult(toolCallId, { success: true }, messages);

      // Verify getConversation was NOT called since we're including full history
      expect(chatService.conversationHistoryService.getConversation).not.toHaveBeenCalled();

      // Verify full history is passed when includeFullHistory is true
      expect(mockAgent.runAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [...messages, response.toolMessage],
        }),
        undefined
      );
    });

    it('should retry polling when tool call result is not yet synced', async () => {
      const mockObservable = new Observable<BaseEvent>();
      mockAgent.runAgent.mockReturnValue(mockObservable);

      // Mock memory provider with includeFullHistory = false
      mockCoreChatService.getMemoryProvider = jest
        .fn()
        .mockReturnValue({ includeFullHistory: false });

      const toolCallId = 'tool-call-retry-test';

      // Mock getConversation to return empty first, then with the tool call in MESSAGES_SNAPSHOT
      let callCount = 0;
      chatService.conversationHistoryService.getConversation = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          // First two calls return MESSAGES_SNAPSHOT without the tool call
          return Promise.resolve([
            {
              type: 'MESSAGES_SNAPSHOT',
              timestamp: Date.now(),
              messages: [
                {
                  role: 'user',
                  id: 'user-msg-1',
                  content: 'Test message',
                },
              ],
            },
          ]);
        }
        // Third call returns MESSAGES_SNAPSHOT with the tool call
        return Promise.resolve(createMockMessagesSnapshot(toolCallId));
      });

      const response = await chatService.sendToolResult(toolCallId, { success: true }, []);

      // Verify getConversation was called multiple times (polling)
      expect(chatService.conversationHistoryService.getConversation).toHaveBeenCalledTimes(3);
      expect(response.toolMessage.toolCallId).toBe(toolCallId);
    });
    it('should throw error when thread ID is not set', async () => {
      // Create a new service without calling newThread
      const newService = new ChatService(mockUiSettings, mockCoreChatService);

      // Mock getThreadId to return undefined
      mockCoreChatService.getThreadId.mockReturnValue(undefined);

      await expect(newService.sendToolResult('tool-123', 'result', [])).rejects.toThrow(
        'Thread ID is required to send a tool result'
      );
    });
  });

  describe('abort', () => {
    it('should call agent abort method', () => {
      chatService.abort();
      expect(mockAgent.abort).toHaveBeenCalled();
    });
  });

  describe('resetConnection', () => {
    it('should call agent resetConnection method', () => {
      chatService.resetConnection();
      expect(mockAgent.resetConnection).toHaveBeenCalled();
    });

    it('should reset connection state after multiple calls', () => {
      // Call multiple times to ensure it works consistently
      chatService.resetConnection();
      chatService.resetConnection();
      chatService.resetConnection();

      expect(mockAgent.resetConnection).toHaveBeenCalledTimes(3);
    });

    it('should be callable independently of other methods', () => {
      // Test that resetConnection can be called without other method calls
      const newService = new ChatService(mockUiSettings, mockCoreChatService);
      newService.resetConnection();

      // Get the mock agent from the new service
      const newMockAgent = (AgUiAgent as jest.MockedClass<typeof AgUiAgent>).mock.results[1]?.value;
      expect(newMockAgent.resetConnection).toHaveBeenCalled();
    });

    it('should work in combination with abort', () => {
      chatService.abort();
      chatService.resetConnection();

      expect(mockAgent.abort).toHaveBeenCalled();
      expect(mockAgent.resetConnection).toHaveBeenCalled();
    });
  });

  describe('newThread', () => {
    let mockContextStore: any;

    beforeEach(() => {
      // Mock context store
      mockContextStore = {
        getAllContexts: jest.fn(() => [
          { id: 'ctx1', categories: ['dynamic'], description: 'Context 1', value: 'data1' },
          { id: 'ctx2', categories: ['dynamic'], description: 'Context 2', value: 'data2' },
          { categories: ['page', 'static'], description: 'Page Context', value: 'page-data' }, // Page context with categories
        ]),
        removeContextById: jest.fn(),
      };
      (global as any).window.assistantContextStore = mockContextStore;
    });

    afterEach(() => {
      delete (global as any).window.assistantContextStore;
    });

    it('should generate new thread ID', () => {
      const originalThreadId = chatService.getThreadId();

      chatService.newThread();

      const newThreadId = chatService.getThreadId();
      expect(newThreadId).not.toBe(originalThreadId);
      expect(newThreadId).toMatch(/^thread-\d+-[a-z0-9]{9}$/);
    });

    it('should clear dynamic context from global store', () => {
      chatService.newThread();

      // Should get all contexts
      expect(mockContextStore.getAllContexts).toHaveBeenCalled();

      // Should remove only contexts with IDs that are NOT page contexts (dynamic contexts)
      expect(mockContextStore.removeContextById).toHaveBeenCalledWith('ctx1');
      expect(mockContextStore.removeContextById).toHaveBeenCalledWith('ctx2');
      expect(mockContextStore.removeContextById).toHaveBeenCalledTimes(2);
      // Page context should not be removed as it has 'page' category
    });

    it('should handle missing context store gracefully', () => {
      delete (global as any).window.assistantContextStore;

      expect(() => chatService.newThread()).not.toThrow();
    });

    it('should call resetConnection to clear agent state', () => {
      chatService.newThread();

      expect(mockAgent.resetConnection).toHaveBeenCalled();
    });
  });

  describe('saveConversation', () => {
    it('should throw error when thread ID is not set', async () => {
      // Mock getThreadId to return undefined
      mockCoreChatService.getThreadId.mockReturnValue(undefined);

      const messages: Message[] = [{ id: 'msg-1', role: 'user', content: 'test' }];

      await expect(chatService.saveConversation(messages)).rejects.toThrow(
        'Thread ID is required to save conversation'
      );
    });

    it('should not throw when messages array is empty', async () => {
      // Mock getThreadId to return undefined - but it shouldn't matter for empty messages
      mockCoreChatService.getThreadId.mockReturnValue(undefined);

      // Should not throw because empty messages array returns early
      await expect(chatService.saveConversation([])).resolves.not.toThrow();
    });

    it('should save conversation when thread ID is set', async () => {
      // Initialize a thread
      chatService.newThread();

      const messages: Message[] = [{ id: 'msg-1', role: 'user', content: 'test' }];

      // Mock the saveConversation method on conversationHistoryService
      chatService.conversationHistoryService.saveConversation = jest
        .fn()
        .mockResolvedValue(undefined);

      await chatService.saveConversation(messages);

      expect(chatService.conversationHistoryService.saveConversation).toHaveBeenCalledWith(
        expect.stringMatching(/^thread-\d+-[a-z0-9]{9}$/),
        messages
      );
    });
  });

  describe('ChatWindow instance management', () => {
    describe('setChatWindowInstance', () => {
      it('should store ChatWindow instance', () => {
        const mockInstance = {
          sendMessage: jest.fn(),
          startNewChat: jest.fn(),
        } as any;
        chatService.setChatWindowInstance(mockInstance);
        expect((chatService as any).chatWindowInstance).toBe(mockInstance);
      });
    });

    describe('clearChatWindowInstance', () => {
      it('should clear ChatWindow instance', () => {
        const mockInstance = {
          sendMessage: jest.fn(),
          startNewChat: jest.fn(),
        } as any;
        chatService.setChatWindowInstance(mockInstance);
        chatService.clearChatWindowInstance();
        expect((chatService as any).chatWindowInstance).toBeNull();
      });
    });
  });

  describe('window control methods', () => {
    describe('openWindow', () => {
      it('should delegate to core service and return window instance', async () => {
        const mockInstance = {
          sendMessage: jest.fn(),
          startNewChat: jest.fn(),
        } as any;

        // Set up the mock to provide instance when openWindow is called
        mockCoreChatService.openWindow = jest.fn().mockImplementation(async () => {
          chatService.setChatWindowInstance(mockInstance);
        });

        const result = await chatService.openWindow();

        expect(mockCoreChatService.openWindow).toHaveBeenCalled();
        expect(result).toBe(mockInstance);
      });

      it('should return existing instance immediately when window is already open', async () => {
        const mockInstance = {
          sendMessage: jest.fn(),
          startNewChat: jest.fn(),
        } as any;
        chatService.setChatWindowInstance(mockInstance);
        mockCoreChatService.isWindowOpen = jest.fn().mockReturnValue(true);

        const result = await chatService.openWindow();

        expect(result).toBe(mockInstance);
      });

      it('should wait for instance to be set after opening window', async () => {
        const mockInstance = {
          sendMessage: jest.fn(),
          startNewChat: jest.fn(),
        } as any;

        // Set up the mock to provide instance after a delay
        mockCoreChatService.openWindow = jest.fn().mockImplementation(async () => {
          setTimeout(() => {
            chatService.setChatWindowInstance(mockInstance);
          }, 10);
        });

        // Start openWindow (it will wait for instance)
        const result = await chatService.openWindow();

        expect(mockCoreChatService.openWindow).toHaveBeenCalled();
        expect(result).toBe(mockInstance);
      });
    });

    describe('closeWindow', () => {
      it('should delegate to core service', async () => {
        await chatService.closeWindow();

        expect(mockCoreChatService.closeWindow).toHaveBeenCalled();
      });
    });
  });

  describe('sendMessageWithWindow', () => {
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

    it('should open window before sending message', async () => {
      const mockInstance = {
        sendMessage: jest.fn().mockResolvedValue(undefined),
        startNewChat: jest.fn(),
      };

      // Set up the mock to provide instance when openWindow is called
      mockCoreChatService.openWindow = jest.fn().mockImplementation(async () => {
        // Simulate the window opening and instance being set
        chatService.setChatWindowInstance(mockInstance as any);
      });

      await chatService.sendMessageWithWindow('test', []);

      expect(mockCoreChatService.openWindow).toHaveBeenCalled();
      expect(mockInstance.sendMessage).toHaveBeenCalledWith({ content: 'test', messages: [] });
    });

    it('should delegate to ChatWindow when instance is available and window is open', async () => {
      const mockSendMessage = jest.fn().mockResolvedValue(undefined);
      const mockChatWindowInstance = {
        sendMessage: mockSendMessage,
        startNewChat: jest.fn(),
      };

      chatService.setChatWindowInstance(mockChatWindowInstance as any);
      mockCoreChatService.isWindowOpen = jest.fn().mockReturnValue(true);

      const result = await chatService.sendMessageWithWindow('test message', []);

      expect(mockSendMessage).toHaveBeenCalledWith({ content: 'test message', messages: [] });
      expect(result.userMessage.content).toBe('test message');
      expect(result.observable).toBeDefined();
    });

    it('should clear conversation when clearConversation option is true', async () => {
      const mockStartNewChat = jest.fn();
      const mockSendMessage = jest.fn().mockResolvedValue(undefined);
      const mockChatWindowInstance = {
        sendMessage: mockSendMessage,
        startNewChat: mockStartNewChat,
      };

      chatService.setChatWindowInstance(mockChatWindowInstance as any);
      mockCoreChatService.isWindowOpen = jest.fn().mockReturnValue(true);

      await chatService.sendMessageWithWindow('test', [], { clearConversation: true });

      expect(mockStartNewChat).toHaveBeenCalled();
    });

    it('should wait for window instance when not immediately available', async () => {
      const mockInstance = {
        sendMessage: jest.fn().mockResolvedValue(undefined),
        startNewChat: jest.fn(),
      };

      // Set up the mock to provide instance after a delay
      mockCoreChatService.openWindow = jest.fn().mockImplementation(async () => {
        setTimeout(() => {
          chatService.setChatWindowInstance(mockInstance as any);
        }, 10);
      });

      // Start sending message (it will wait for instance)
      const result = await chatService.sendMessageWithWindow('test', []);

      expect(result.userMessage.content).toBe('test');
      expect(result.observable).toBeDefined();
    });

    it('should fallback to direct service call when delegation fails', async () => {
      const mockSendMessage = jest.fn().mockRejectedValue(new Error('Delegation failed'));
      const mockChatWindowInstance = {
        sendMessage: mockSendMessage,
        startNewChat: jest.fn(),
      };

      chatService.setChatWindowInstance(mockChatWindowInstance as any);
      mockCoreChatService.isWindowOpen = jest.fn().mockReturnValue(true);

      // The sendMessageWithWindow will actually throw since delegation failed
      await expect(chatService.sendMessageWithWindow('test', [])).rejects.toThrow();
    });

    it('should return dummy observable when delegating to ChatWindow', async () => {
      const mockSendMessage = jest.fn().mockResolvedValue(undefined);
      const mockChatWindowInstance = {
        sendMessage: mockSendMessage,
        startNewChat: jest.fn(),
      };

      chatService.setChatWindowInstance(mockChatWindowInstance as any);
      mockCoreChatService.isWindowOpen = jest.fn().mockReturnValue(true);

      const result = await chatService.sendMessageWithWindow('test', []);

      // Observable should complete immediately
      let completed = false;
      result.observable.subscribe({
        complete: () => {
          completed = true;
        },
      });

      expect(completed).toBe(true);
    });

    it('should call newThread before openWindow when clearConversation is true', async () => {
      const callOrder: string[] = [];

      // Track newThread call
      const originalNewThread = mockCoreChatService.newThread;
      mockCoreChatService.newThread = jest.fn(() => {
        callOrder.push('newThread');
        originalNewThread();
      });

      const mockInstance = {
        sendMessage: jest.fn().mockResolvedValue(undefined),
        startNewChat: jest.fn(),
      };

      // Track openWindow call and set instance when window opens
      const originalOpenWindow = mockCoreChatService.openWindow;
      mockCoreChatService.openWindow = jest.fn(async () => {
        callOrder.push('openWindow');
        await originalOpenWindow();
        // Set instance after window opens
        chatService.setChatWindowInstance(mockInstance as any);
      });

      await chatService.sendMessageWithWindow('test', [], { clearConversation: true });

      // Verify newThread is called before openWindow
      expect(callOrder).toEqual(['newThread', 'openWindow']);
    });

    it('should call startNewChat on chatWindowInstance after window opens when clearConversation is true', async () => {
      const mockStartNewChat = jest.fn();
      const mockSendMessage = jest.fn().mockResolvedValue(undefined);

      const mockInstance = {
        sendMessage: mockSendMessage,
        startNewChat: mockStartNewChat,
      };

      // Set up mock to provide instance when window opens
      mockCoreChatService.openWindow = jest.fn(async () => {
        chatService.setChatWindowInstance(mockInstance as any);
      });

      await chatService.sendMessageWithWindow('test', [], { clearConversation: true });

      // Verify startNewChat was called on the window instance
      expect(mockStartNewChat).toHaveBeenCalled();
      // Verify sendMessage was also called after startNewChat
      expect(mockSendMessage).toHaveBeenCalledWith({ content: 'test', messages: [] });
    });
  });

  describe('extractDataSourceIdFromPageContext', () => {
    it('should extract data source ID from valid page context', () => {
      const contexts = [
        {
          // Context without page category - should be skipped
          id: 'some-id',
          categories: ['dynamic'],
          description: 'Some other context',
          value: { appId: 'other-app', dataset: { dataSource: { id: 'wrong-id' } } },
        },
        {
          // Valid page context with page category
          categories: ['page', 'static'],
          description: 'Explore application page context',
          value: {
            appId: 'explore',
            dataset: { dataSource: { id: 'correct-data-source-id' } },
          },
        },
      ];

      const result = (chatService as any).extractDataSourceIdFromPageContext(contexts);
      expect(result).toBe('correct-data-source-id');
    });

    it('should handle page context with stringified value', () => {
      const contexts = [
        {
          categories: ['page', 'static'],
          description: 'Investigation page context',
          value: JSON.stringify({
            appId: 'investigation-notebooks',
            dataset: { dataSource: { id: 'investigation-data-source' } },
          }),
        },
      ];

      const result = (chatService as any).extractDataSourceIdFromPageContext(contexts);
      expect(result).toBe('investigation-data-source');
    });

    it('should return undefined when no page context found', () => {
      const contexts = [
        {
          id: 'text-selection',
          categories: ['dynamic'],
          description: 'Selected text context',
          value: 'some text',
        },
        {
          id: 'document-expansion',
          categories: ['dynamic'],
          description: 'Expanded document',
          value: { documentData: 'test' },
        },
      ];

      const result = (chatService as any).extractDataSourceIdFromPageContext(contexts);
      expect(result).toBeUndefined();
    });

    it('should return undefined when page context lacks appId', () => {
      const contexts = [
        {
          categories: ['page', 'static'],
          description: 'Invalid page context',
          value: { dataset: { dataSource: { id: 'some-id' } } }, // Missing appId
        },
      ];

      const result = (chatService as any).extractDataSourceIdFromPageContext(contexts);
      expect(result).toBeUndefined();
    });

    it('should return undefined when page context lacks dataset.dataSource.id', () => {
      const contexts = [
        {
          categories: ['page', 'static'],
          description: 'Page context without data source',
          value: { appId: 'explore' }, // Missing dataset
        },
      ];

      const result = (chatService as any).extractDataSourceIdFromPageContext(contexts);
      expect(result).toBeUndefined();
    });

    it('should handle malformed JSON gracefully', () => {
      const contexts = [
        {
          categories: ['page', 'static'],
          description: 'Malformed context',
          value: 'invalid-json-{',
        },
      ];

      const result = (chatService as any).extractDataSourceIdFromPageContext(contexts);
      expect(result).toBeUndefined();
    });

    it('should skip contexts without page category and find first valid page context', () => {
      const contexts = [
        {
          id: 'context-with-id',
          categories: ['dynamic'],
          description: 'Context without page category',
          value: { appId: 'explore', dataset: { dataSource: { id: 'wrong-id' } } },
        },
        {
          categories: ['page', 'static'],
          description: 'First page context',
          value: { appId: 'explore', dataset: { dataSource: { id: 'first-id' } } },
        },
        {
          categories: ['page', 'static'],
          description: 'Second page context',
          value: { appId: 'investigation', dataset: { dataSource: { id: 'second-id' } } },
        },
      ];

      const result = (chatService as any).extractDataSourceIdFromPageContext(contexts);
      expect(result).toBe('first-id'); // Should return first valid page context
    });

    it('should handle empty contexts array', () => {
      const result = (chatService as any).extractDataSourceIdFromPageContext([]);
      expect(result).toBeUndefined();
    });
  });

  describe('restoreLatestConversation', () => {
    it('should restore the latest conversation with messages', async () => {
      const mockMessages = [
        { id: 'msg-1', role: 'user', content: 'Hello' },
        { id: 'msg-2', role: 'assistant', content: 'Hi there!' },
      ];

      const mockThreadId = 'thread-12345';

      // Mock the conversation history service
      chatService.conversationHistoryService.getConversations = jest.fn().mockResolvedValue({
        conversations: [
          {
            threadId: mockThreadId,
            title: 'Test Conversation',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        total: 1,
      });

      chatService.conversationHistoryService.getConversation = jest.fn().mockResolvedValue([
        {
          type: 'MESSAGES_SNAPSHOT',
          messages: mockMessages,
          timestamp: Date.now(),
        },
      ]);

      const result = await chatService.restoreLatestConversation();

      expect(result).not.toBeNull();
      expect(result?.threadId).toBe(mockThreadId);
      expect(result?.messages).toEqual(mockMessages);
      expect(mockCoreChatService.setThreadId).toHaveBeenCalledWith(mockThreadId);
    });

    it('should return null and generate new thread when no conversations exist', async () => {
      // Mock empty conversation list
      chatService.conversationHistoryService.getConversations = jest.fn().mockResolvedValue({
        conversations: [],
        total: 0,
      });

      const result = await chatService.restoreLatestConversation();

      expect(result).toBeNull();
      // Should generate a new thread
      expect(mockCoreChatService.newThread).toHaveBeenCalled();
    });

    it('should return null and generate new thread when conversation has no MESSAGES_SNAPSHOT event', async () => {
      const mockThreadId = 'thread-12345';

      chatService.conversationHistoryService.getConversations = jest.fn().mockResolvedValue({
        conversations: [
          {
            threadId: mockThreadId,
            title: 'Test Conversation',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        total: 1,
      });

      // Return events without MESSAGES_SNAPSHOT
      chatService.conversationHistoryService.getConversation = jest.fn().mockResolvedValue([
        {
          type: 'OTHER_EVENT',
          timestamp: Date.now(),
        },
      ]);

      const result = await chatService.restoreLatestConversation();

      expect(result).toBeNull();
      // Should generate a new thread
      expect(mockCoreChatService.newThread).toHaveBeenCalled();
    });

    it('should return null and generate new thread when getConversation returns null', async () => {
      const mockThreadId = 'thread-12345';

      chatService.conversationHistoryService.getConversations = jest.fn().mockResolvedValue({
        conversations: [
          {
            threadId: mockThreadId,
            title: 'Test Conversation',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        total: 1,
      });

      chatService.conversationHistoryService.getConversation = jest.fn().mockResolvedValue(null);

      const result = await chatService.restoreLatestConversation();

      expect(result).toBeNull();
      // Should generate a new thread
      expect(mockCoreChatService.newThread).toHaveBeenCalled();
    });

    it('should return null and skip restore when thread ID is already set', async () => {
      // Mock that thread ID is already set
      mockCoreChatService.getThreadId.mockReturnValue('existing-thread-id');

      // Mock conversation history (should not be called)
      chatService.conversationHistoryService.getConversations = jest.fn().mockResolvedValue({
        conversations: [
          {
            threadId: 'thread-12345',
            title: 'Test Conversation',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        total: 1,
      });

      const result = await chatService.restoreLatestConversation();

      expect(result).toBeNull();
      // Should not call getConversations since thread is already set
      expect(chatService.conversationHistoryService.getConversations).not.toHaveBeenCalled();
      // Should NOT generate a new thread - use existing one
      expect(mockCoreChatService.newThread).not.toHaveBeenCalled();
    });
  });

  describe('getWorkspaceAwareDataSourceId with page context priority', () => {
    let mockWorkspaces: any;

    beforeEach(() => {
      mockUiSettings = {
        get: jest.fn(),
      };
      mockWorkspaces = {
        currentWorkspaceId$: {
          getValue: jest.fn().mockReturnValue(null),
        },
      };

      // Set default return value for getDefaultDataSourceId mock
      const { getDefaultDataSourceId } = jest.requireMock('../../../data_source_management/public');
      getDefaultDataSourceId.mockResolvedValue('workspace-data-source-id');
    });

    it('should prioritize page context data source over workspace data source', async () => {
      // Set up page context with data source
      (global as any).window.assistantContextStore = {
        getAllContexts: jest.fn().mockReturnValue([
          {
            categories: ['page', 'static'],
            description: 'Explore page context',
            value: {
              appId: 'explore',
              dataset: { dataSource: { id: 'page-data-source-id' } },
            },
          },
        ]),
      };

      // Create service with uiSettings and workspaces
      const serviceWithSettings = new (ChatService as any)(
        mockUiSettings,
        mockCoreChatService,
        mockWorkspaces
      );

      const result = await serviceWithSettings.getWorkspaceAwareDataSourceId();

      expect(result).toBe('page-data-source-id');
    });

    it('should fallback to workspace data source when no page context', async () => {
      const { getDefaultDataSourceId } = jest.requireMock('../../../data_source_management/public');
      getDefaultDataSourceId.mockResolvedValue('workspace-fallback-id');

      // Set up context store without page context
      (global as any).window.assistantContextStore = {
        getAllContexts: jest.fn().mockReturnValue([
          {
            id: 'text-selection',
            categories: ['dynamic'],
            description: 'Selected text',
            value: 'some text',
          },
        ]),
      };

      const serviceWithSettings = new (ChatService as any)(
        mockUiSettings,
        mockCoreChatService,
        mockWorkspaces
      );

      const result = await serviceWithSettings.getWorkspaceAwareDataSourceId();

      expect(result).toBe('workspace-fallback-id');
    });

    it('should fallback to workspace data source when page context has invalid data', async () => {
      const { getDefaultDataSourceId } = jest.requireMock('../../../data_source_management/public');
      getDefaultDataSourceId.mockResolvedValue('workspace-fallback-id');

      // Set up page context without data source
      (global as any).window.assistantContextStore = {
        getAllContexts: jest.fn().mockReturnValue([
          {
            categories: ['page', 'static'],
            description: 'Invalid page context',
            value: { appId: 'explore' }, // Missing dataset
          },
        ]),
      };

      const serviceWithSettings = new (ChatService as any)(
        mockUiSettings,
        mockCoreChatService,
        mockWorkspaces
      );

      const result = await serviceWithSettings.getWorkspaceAwareDataSourceId();

      expect(result).toBe('workspace-fallback-id');
    });

    it('should return undefined when no context store available', async () => {
      // Remove context store
      delete (global as any).window.assistantContextStore;

      const serviceWithSettings = new (ChatService as any)(
        mockUiSettings,
        mockCoreChatService,
        mockWorkspaces
      );

      const result = await serviceWithSettings.getWorkspaceAwareDataSourceId();

      // Should still fallback to workspace data source even without context store
      expect(result).toBe('workspace-data-source-id');
    });

    it('should handle context store errors gracefully', async () => {
      // Set up context store that throws error
      (global as any).window.assistantContextStore = {
        getAllContexts: jest.fn().mockImplementation(() => {
          throw new Error('Context store error');
        }),
      };

      const serviceWithSettings = new (ChatService as any)(
        mockUiSettings,
        mockCoreChatService,
        mockWorkspaces
      );

      const result = await serviceWithSettings.getWorkspaceAwareDataSourceId();

      expect(result).toBeUndefined();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });
  });
});

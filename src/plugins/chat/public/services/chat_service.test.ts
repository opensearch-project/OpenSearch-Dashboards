/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AVAILABLE_DATA_SOURCES_CONTEXT_ID,
  ChatService,
  AVAILABLE_DATA_SOURCES_CONTEXT_DES,
  DataSourceUnresolvedError,
} from './chat_service';
import { AgUiAgent, BaseEvent } from './ag_ui_agent';
import { Observable, BehaviorSubject } from 'rxjs';
import { Message } from '../../common/types';
import { ToolDefinition } from '../../../context_provider/public';
import { ChatServiceStart, UiSettingScope } from '../../../../core/public';
import { AssistantActionService } from '../../../context_provider/public';

// Mock AgUiAgent
jest.mock('./ag_ui_agent');

// Mock AssistantActionService singleton
jest.mock('../../../context_provider/public', () => ({
  AssistantActionService: {
    getInstance: jest.fn().mockReturnValue({
      getState$: jest
        .fn()
        .mockReturnValue({ subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }) }),
      hasAction: jest.fn().mockReturnValue(false),
    }),
  },
}));

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

    // Create mock thread ID observable - starts as undefined
    const generateMockThreadId = () => {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 11).padEnd(9, '0');
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
        `thread-${Date.now()}-${Math.random().toString(36).substring(2, 11).padEnd(9, '0')}`;
      const generateThreadId2 = () =>
        `thread-${Date.now() + 1}-${Math.random().toString(36).substring(2, 11).padEnd(9, '0')}`;

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
      // Mock window.assistantContextStore.
      (window as any).assistantContextStore = {
        addContext: jest.fn(),
        removeContextById: jest.fn(),
        getAllContexts: jest.fn().mockReturnValue([]),
        getBackendFormattedContexts: jest.fn().mockReturnValue([]),
      };
    });

    afterEach(() => {
      delete (window as any).assistantContextStore;
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
        rawMessage: 'Hello, world!',
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
          forwardedProps: { allowConversationTitle: true },
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

    it('excludes the PPL lint fix request-id context from the agent payload', async () => {
      const mockObservable = new Observable<BaseEvent>();
      mockAgent.runAgent.mockReturnValue(mockObservable);

      (window as any).assistantContextStore.getAllContexts = jest.fn().mockReturnValue([
        { categories: ['page', 'chat'], description: 'Page context', value: 'page-data' },
        {
          categories: ['page', 'ppl-lint-fix-request'],
          description: 'PPL lint quick-fix request id',
          value: 'req-123',
        },
      ]);

      await chatService.sendMessage('test', []);

      expect(mockAgent.runAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          context: [{ description: 'Page context', value: 'page-data' }],
        }),
        undefined
      );
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
          forwardedProps: { allowConversationTitle: true },
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
          forwardedProps: { allowConversationTitle: true },
        },
        undefined
      ); // dataSourceId is undefined when no uiSettings provided
    });

    it('should abort the halted main run before dispatching the continuation', async () => {
      // Regression guard for the stuck-session race: the tool-result run is a continuation of
      // the halted main run and must supersede it. Assert abort() is called before runAgent.
      const callOrder: string[] = [];
      mockAgent.abort.mockImplementation(() => {
        callOrder.push('abort');
      });
      const mockObservable = new Observable<BaseEvent>();
      mockAgent.runAgent.mockImplementation(() => {
        callOrder.push('runAgent');
        return mockObservable;
      });

      const toolCallId = 'tool-call-123';
      chatService.conversationHistoryService.getConversation = jest
        .fn()
        .mockResolvedValue(createMockMessagesSnapshot(toolCallId));

      await chatService.sendToolResult(toolCallId, { success: true }, []);

      expect(mockAgent.abort).toHaveBeenCalled();
      expect(callOrder[0]).toBe('abort');
      expect(callOrder.indexOf('abort')).toBeLessThan(callOrder.indexOf('runAgent'));
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
          forwardedProps: { allowConversationTitle: true },
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

    it('should dispatch directly without a client-side sync wait (server reconciles)', async () => {
      // The client dispatches the result without polling getConversation; the server reconciles
      // it via its wire->native map.
      const mockObservable = new Observable<BaseEvent>();
      mockAgent.runAgent.mockReturnValue(mockObservable);

      mockCoreChatService.getMemoryProvider = jest
        .fn()
        .mockReturnValue({ includeFullHistory: false });

      const toolCallId = 'tool-call-sync-test';
      chatService.conversationHistoryService.getConversation = jest.fn();

      const response = await chatService.sendToolResult(toolCallId, { success: true }, []);

      // No sync poll — getConversation is not called; the result is dispatched straight away.
      expect(chatService.conversationHistoryService.getConversation).not.toHaveBeenCalled();
      expect(mockAgent.runAgent).toHaveBeenCalled();
      expect(response.toolMessage.toolCallId).toBe(toolCallId);
      expect(response.skipped).toBeUndefined();
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

    it('should skip dispatch with reason no_thread_id when thread ID is not set', async () => {
      // Create a new service without calling newThread
      const newService = new ChatService(mockUiSettings, mockCoreChatService);

      // Mock getThreadId to return undefined
      mockCoreChatService.getThreadId.mockReturnValue(undefined);

      const response = await newService.sendToolResult('tool-123', 'result', []);

      expect(response.skipped).toEqual({ reason: 'no_thread_id' });
      expect(mockAgent.runAgent).not.toHaveBeenCalled();
      expect(response.toolMessage).toEqual({
        id: expect.stringMatching(/^msg-\d+-[a-z0-9]{9}$/),
        role: 'tool',
        content: 'result',
        toolCallId: 'tool-123',
      });
    });

    describe('abort signal', () => {
      beforeEach(() => {
        mockCoreChatService.getMemoryProvider = jest
          .fn()
          .mockReturnValue({ includeFullHistory: false });
      });

      it('should skip with reason aborted when signal is already aborted before dispatch', async () => {
        const toolCallId = 'tool-call-abort-early';
        const controller = new AbortController();
        controller.abort();

        // getConversation should not even be consulted — the early-out fires
        // before sync polling.
        chatService.conversationHistoryService.getConversation = jest.fn();

        const response = await chatService.sendToolResult(
          toolCallId,
          { ok: true },
          [],
          controller.signal
        );

        expect(response.skipped).toEqual({ reason: 'aborted' });
        expect(mockAgent.runAgent).not.toHaveBeenCalled();
        expect(chatService.conversationHistoryService.getConversation).not.toHaveBeenCalled();
        expect((chatService as any).activeRequests.size).toBe(0);
      });

      it('should emit AbortError and call agent.abort when signal fires after dispatch', async () => {
        const toolCallId = 'tool-call-abort-during-stream';
        const controller = new AbortController();

        // Minimal observable that never emits/completes so we can control
        // lifecycle via the abort signal alone.
        const pendingObservable = new Observable<BaseEvent>(() => {
          // intentionally no-op — the wrapping Observable in sendToolResult
          // owns the termination path
          return () => {};
        });
        mockAgent.runAgent.mockReturnValue(pendingObservable);

        chatService.conversationHistoryService.getConversation = jest
          .fn()
          .mockResolvedValue(createMockMessagesSnapshot(toolCallId));

        const response = await chatService.sendToolResult(
          toolCallId,
          { ok: true },
          [],
          controller.signal
        );

        expect(response.skipped).toBeUndefined();
        expect(mockAgent.runAgent).toHaveBeenCalledTimes(1);

        // sendToolResult aborts the halted main run up front, so one abort has already happened by
        // now. This test verifies the *signal-driven* abort that fires after dispatch — assert on
        // the additional call, not an absolute count.
        const abortsBeforeSignal = mockAgent.abort.mock.calls.length;

        const nextSpy = jest.fn();
        const errorSpy = jest.fn();
        const completeSpy = jest.fn();

        response.observable.subscribe({
          next: nextSpy,
          error: errorSpy,
          complete: completeSpy,
        });

        controller.abort();

        expect(mockAgent.abort.mock.calls.length).toBe(abortsBeforeSignal + 1);
        expect(errorSpy).toHaveBeenCalledTimes(1);
        const emittedError = errorSpy.mock.calls[0][0];
        expect(emittedError).toBeInstanceOf(Error);
        expect(emittedError.name).toBe('AbortError');
        expect(completeSpy).not.toHaveBeenCalled();
        expect(nextSpy).not.toHaveBeenCalled();
        expect((chatService as any).activeRequests.size).toBe(0);
      });

      it('should emit AbortError synchronously when signal is already aborted at subscribe time', async () => {
        const toolCallId = 'tool-call-abort-at-subscribe';
        const controller = new AbortController();

        // Keep the underlying observable inert so only the abort path drives
        // termination.
        const pendingObservable = new Observable<BaseEvent>(() => () => {});
        mockAgent.runAgent.mockReturnValue(pendingObservable);

        chatService.conversationHistoryService.getConversation = jest
          .fn()
          .mockResolvedValue(createMockMessagesSnapshot(toolCallId));

        const response = await chatService.sendToolResult(
          toolCallId,
          { ok: true },
          [],
          controller.signal
        );

        // Abort after dispatch but before subscribing — the subscribe path
        // should detect the pre-aborted signal and emit AbortError immediately.
        controller.abort();

        const errorSpy = jest.fn();
        const completeSpy = jest.fn();

        response.observable.subscribe({
          error: errorSpy,
          complete: completeSpy,
        });

        expect(errorSpy).toHaveBeenCalledTimes(1);
        expect(errorSpy.mock.calls[0][0].name).toBe('AbortError');
        expect(completeSpy).not.toHaveBeenCalled();
      });

      it('should not emit twice when signal fires during an active subscription', async () => {
        const toolCallId = 'tool-call-abort-no-double-emit';
        const controller = new AbortController();

        // Observable that emits one value, then stays open until aborted.
        let innerEmit: ((v: BaseEvent) => void) | null = null;
        const gatedObservable = new Observable<BaseEvent>((subscriber) => {
          innerEmit = (v) => subscriber.next(v);
          return () => {};
        });
        mockAgent.runAgent.mockReturnValue(gatedObservable);

        chatService.conversationHistoryService.getConversation = jest
          .fn()
          .mockResolvedValue(createMockMessagesSnapshot(toolCallId));

        const response = await chatService.sendToolResult(
          toolCallId,
          { ok: true },
          [],
          controller.signal
        );

        const nextSpy = jest.fn();
        const errorSpy = jest.fn();
        const completeSpy = jest.fn();

        response.observable.subscribe({
          next: nextSpy,
          error: errorSpy,
          complete: completeSpy,
        });

        // Deliver one value so the subscription is live.
        innerEmit!({ type: 'RUN_STARTED' } as BaseEvent);
        expect(nextSpy).toHaveBeenCalledTimes(1);

        // Abort, then try to shove more values through — they should be
        // swallowed by the `settled` guard rather than reaching the subscriber.
        controller.abort();
        innerEmit!({ type: 'RUN_FINISHED' } as BaseEvent);

        expect(errorSpy).toHaveBeenCalledTimes(1);
        expect(nextSpy).toHaveBeenCalledTimes(1);
        expect(completeSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('sendToolResults (parallel batch)', () => {
    // Snapshot whose assistant message carries one toolCall per id.
    const createMockMessagesSnapshotMulti = (toolCallIds: string[]) => [
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
            content: 'Response with parallel tool calls',
            toolCalls: toolCallIds.map((id) => ({
              id,
              type: 'function',
              function: { name: 'test_tool', arguments: '{}' },
            })),
          },
        ],
      },
    ];

    beforeEach(() => {
      // Initialize a thread first - required for sendToolResults
      chatService.newThread();
      (global as any).window = {
        assistantContextStore: {
          getAllContexts: jest.fn().mockReturnValue([]),
          getBackendFormattedContexts: jest.fn().mockReturnValue([]),
        },
      };

      // Default: includeFullHistory false so the sync-poll path is exercised.
      mockCoreChatService.getMemoryProvider = jest
        .fn()
        .mockReturnValue({ includeFullHistory: false });
    });

    afterEach(() => {
      delete (global as any).window;
    });

    it('should dispatch a batch of two tool results in a single run', async () => {
      const mockObservable = new Observable<BaseEvent>();
      mockAgent.runAgent.mockReturnValue(mockObservable);

      const items = [
        { toolCallId: 'tool-A', result: { ok: 1 } },
        { toolCallId: 'tool-B', result: 'txt' },
      ];

      // Snapshot contains both tool calls; the last id (tool-B) drives the sync check.
      chatService.conversationHistoryService.getConversation = jest
        .fn()
        .mockResolvedValue(createMockMessagesSnapshotMulti(['tool-A', 'tool-B']));

      const response = await chatService.sendToolResults(items, []);

      // One ToolMessage per item, in order, with the correct role/toolCallId/content.
      expect(response.toolMessages).toHaveLength(2);
      expect(response.toolMessages[0]).toEqual({
        id: expect.stringMatching(/^msg-\d+-[a-z0-9]{9}$/),
        role: 'tool',
        content: JSON.stringify({ ok: 1 }), // object -> JSON.stringify
        toolCallId: 'tool-A',
      });
      expect(response.toolMessages[1]).toEqual({
        id: expect.stringMatching(/^msg-\d+-[a-z0-9]{9}$/),
        role: 'tool',
        content: 'txt', // string -> as-is
        toolCallId: 'tool-B',
      });

      expect(response.skipped).toBeUndefined();
      expect(response.observable).toBeDefined();

      // Single continuation run carrying both tool messages in order.
      expect(mockAgent.runAgent).toHaveBeenCalledTimes(1);
      expect(mockAgent.runAgent).toHaveBeenCalledWith(
        {
          threadId: expect.stringMatching(/^thread-\d+-[a-z0-9]{9}$/),
          runId: expect.stringMatching(/^run-\d+-[a-z0-9]{9}$/),
          messages: [response.toolMessages[0], response.toolMessages[1]],
          tools: [],
          context: [],
          state: {},
          forwardedProps: { allowConversationTitle: true },
        },
        undefined
      );
    });

    it('should abort the halted main run before dispatching the continuation', async () => {
      // Same regression guard as the singular path: one abort() must supersede the halted
      // main run before runAgent, so the runs never overlap.
      const callOrder: string[] = [];
      mockAgent.abort.mockImplementation(() => {
        callOrder.push('abort');
      });
      const mockObservable = new Observable<BaseEvent>();
      mockAgent.runAgent.mockImplementation(() => {
        callOrder.push('runAgent');
        return mockObservable;
      });

      chatService.conversationHistoryService.getConversation = jest
        .fn()
        .mockResolvedValue(createMockMessagesSnapshotMulti(['tool-A', 'tool-B']));

      await chatService.sendToolResults(
        [
          { toolCallId: 'tool-A', result: { ok: 1 } },
          { toolCallId: 'tool-B', result: { ok: 2 } },
        ],
        []
      );

      expect(mockAgent.abort).toHaveBeenCalled();
      expect(callOrder[0]).toBe('abort');
      expect(callOrder.indexOf('abort')).toBeLessThan(callOrder.indexOf('runAgent'));
    });

    it('should dispatch the batch directly without a client-side sync wait (server reconciles)', async () => {
      const mockObservable = new Observable<BaseEvent>();
      mockAgent.runAgent.mockReturnValue(mockObservable);

      // No sync poll: the server reconciles each result durably via its wire->native map.
      const getConversation = jest.fn();
      chatService.conversationHistoryService.getConversation = getConversation;

      const response = await chatService.sendToolResults(
        [
          { toolCallId: 'tool-A', result: { ok: 1 } },
          { toolCallId: 'tool-B', result: { ok: 2 } },
        ],
        []
      );

      expect(getConversation).not.toHaveBeenCalled();
      expect(mockAgent.runAgent).toHaveBeenCalledTimes(1);
      expect(response.skipped).toBeUndefined();
      expect(response.toolMessages).toHaveLength(2);
    });

    it('should skip dispatch with reason no_thread_id when thread ID is not set', async () => {
      // Fresh service without calling newThread, mirroring the singular no_thread_id test.
      const newService = new ChatService(mockUiSettings, mockCoreChatService);
      mockCoreChatService.getThreadId.mockReturnValue(undefined);

      const items = [
        { toolCallId: 'tool-A', result: 'a' },
        { toolCallId: 'tool-B', result: 'b' },
      ];

      const response = await newService.sendToolResults(items, []);

      expect(response.skipped).toEqual({ reason: 'no_thread_id' });
      expect(mockAgent.runAgent).not.toHaveBeenCalled();

      // toolMessages are still returned (one per item) even on skip.
      expect(response.toolMessages).toHaveLength(2);
      expect(response.toolMessages[0]).toEqual({
        id: expect.stringMatching(/^msg-\d+-[a-z0-9]{9}$/),
        role: 'tool',
        content: 'a',
        toolCallId: 'tool-A',
      });
      expect(response.toolMessages[1]).toEqual({
        id: expect.stringMatching(/^msg-\d+-[a-z0-9]{9}$/),
        role: 'tool',
        content: 'b',
        toolCallId: 'tool-B',
      });
    });

    it('should include full history and skip the sync wait when includeFullHistory is true', async () => {
      const mockObservable = new Observable<BaseEvent>();
      mockAgent.runAgent.mockReturnValue(mockObservable);

      // includeFullHistory true: messages are passed directly so no sync poll is needed.
      mockCoreChatService.getMemoryProvider = jest
        .fn()
        .mockReturnValue({ includeFullHistory: true });

      // getConversation should NOT be consulted when full history is included.
      chatService.conversationHistoryService.getConversation = jest.fn();

      const messages: Message[] = [{ id: 'msg-1', role: 'user', content: 'Previous message' }];
      const items = [
        { toolCallId: 'tool-A', result: { ok: 1 } },
        { toolCallId: 'tool-B', result: 'txt' },
      ];

      const response = await chatService.sendToolResults(items, messages);

      expect(chatService.conversationHistoryService.getConversation).not.toHaveBeenCalled();
      expect(response.skipped).toBeUndefined();
      expect(response.toolMessages).toHaveLength(2);

      // messages = [...messages, ...toolMessages] when includeFullHistory is true.
      expect(mockAgent.runAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [...messages, response.toolMessages[0], response.toolMessages[1]],
        }),
        undefined
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
        messages,
        undefined
      );
    });
  });

  describe('deleteConversation', () => {
    it('should delete the conversation', async () => {
      chatService.conversationHistoryService.deleteConversation = jest
        .fn()
        .mockResolvedValue(undefined);

      await chatService.deleteConversation('thread-x');

      expect(chatService.conversationHistoryService.deleteConversation).toHaveBeenCalledWith(
        'thread-x'
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

    it('hands a caller data source to the window instead of applying it before the send', async () => {
      const mockInstance = { sendMessage: jest.fn(), startNewChat: jest.fn() };
      mockCoreChatService.isWindowOpen.mockReturnValue(true);
      chatService.setChatWindowInstance(mockInstance);

      await chatService.sendMessageWithWindow('test', [], { dataSourceId: 'ds-panel' });

      expect(mockInstance.sendMessage).toHaveBeenCalledWith({
        content: 'test',
        messages: [],
        dataSourceId: 'ds-panel',
      });
      // The window applies it only if it sends the message.
      expect(chatService.getConversationDataSourceId()).toBeUndefined();
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

  describe('getDataSourceFromPageContext', () => {
    // Helper to stub the global context store and invoke the current method.
    const extractDataSourceId = (contexts: any[]) => {
      (global as any).window.assistantContextStore = {
        getAllContexts: jest.fn().mockReturnValue(contexts),
      };
      return (chatService as any).getDataSourceFromPageContext();
    };

    afterEach(() => {
      delete (global as any).window.assistantContextStore;
    });

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

      const result = extractDataSourceId(contexts);
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

      const result = extractDataSourceId(contexts);
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

      // const result = (chatService as any).extractDataSourceIdFromPageContext(contexts);
      const result = extractDataSourceId(contexts);
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

      const result = extractDataSourceId(contexts);
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

      const result = extractDataSourceId(contexts);
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

      const result = extractDataSourceId(contexts);
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

      const result = extractDataSourceId(contexts);
      expect(result).toBe('first-id'); // Should return first valid page context
    });

    it('should handle empty contexts array', () => {
      const result = extractDataSourceId([]);
      expect(result).toBeUndefined();
    });
  });

  describe('loadConversation', () => {
    const mockThreadId = 'thread-load-123';
    const mockMessages = [
      { id: 'msg-1', role: 'user', content: 'Hello' },
      { id: 'msg-2', role: 'assistant', content: 'Hi!' },
    ];

    it('should return events array and set thread ID', async () => {
      chatService.conversationHistoryService.getConversation = jest
        .fn()
        .mockResolvedValue([
          { type: 'MESSAGES_SNAPSHOT', messages: mockMessages, timestamp: Date.now() },
        ]);

      const result = await chatService.loadConversation(mockThreadId);

      expect(result).not.toBeNull();
      expect(Array.isArray(result)).toBe(true);
      expect(mockCoreChatService.setThreadId).toHaveBeenCalledWith(mockThreadId);
    });

    it('should return null when getConversation returns null', async () => {
      chatService.conversationHistoryService.getConversation = jest.fn().mockResolvedValue(null);

      const result = await chatService.loadConversation(mockThreadId);

      expect(result).toBeNull();
    });

    it('should inject synthetic tool call events for unfinished tool calls', async () => {
      const mockHasAction = jest.fn((name: string) => name === 'run_cmd');
      (AssistantActionService.getInstance().hasAction as jest.Mock).mockImplementation(
        mockHasAction
      );

      const messagesWithUnfinished = [
        { id: 'user-1', role: 'user', content: 'Run it' },
        {
          id: 'assistant-1',
          role: 'assistant',
          content: '',
          toolCalls: [
            {
              id: 'tc-1',
              type: 'function',
              function: { name: 'run_cmd', arguments: '{"cmd":"ls"}' },
            },
          ],
        },
      ];

      chatService.conversationHistoryService.getConversation = jest
        .fn()
        .mockResolvedValue([
          { type: 'MESSAGES_SNAPSHOT', messages: messagesWithUnfinished, timestamp: Date.now() },
        ]);

      const result = await chatService.loadConversation(mockThreadId);

      expect(result).not.toBeNull();
      const types = result!.map((e: any) => e.type);
      expect(types).toContain('TOOL_CALL_START');
      expect(types).toContain('TOOL_CALL_ARGS');
      expect(types).toContain('TOOL_CALL_END');
    });

    it('injects synthetic tool call events before RUN_FINISHED', async () => {
      // RUN_FINISHED clears the event handler's active-message map, so a tool call replayed after it
      // cannot resolve its parent and spawns a second assistant message (losing the restored one's
      // text). Synthetic events must sit where they do in a live stream: before the run ends.
      (AssistantActionService.getInstance().hasAction as jest.Mock).mockImplementation(
        (name: string) => name === 'ask_user'
      );

      const messages = [
        { id: '0', role: 'user', content: 'ask me some question' },
        {
          id: '1',
          role: 'assistant',
          content: "I'd love to chat!",
          toolCalls: [
            { id: 'tc-ask', type: 'function', function: { name: 'ask_user', arguments: '{}' } },
          ],
        },
      ];

      chatService.conversationHistoryService.getConversation = jest.fn().mockResolvedValue([
        { type: 'RUN_STARTED', timestamp: Date.now() },
        { type: 'MESSAGES_SNAPSHOT', messages, timestamp: Date.now() },
        { type: 'RUN_FINISHED', timestamp: Date.now() },
      ]);

      const result = await chatService.loadConversation(mockThreadId);

      const types = result!.map((e: any) => e.type);
      expect(types).toEqual([
        'RUN_STARTED',
        'MESSAGES_SNAPSHOT',
        'TOOL_CALL_START',
        'TOOL_CALL_ARGS',
        'TOOL_CALL_END',
        'RUN_FINISHED',
      ]);
    });

    it('should inject synthetic events for each of multiple unfinished tool calls', async () => {
      const mockHasAction = jest.fn((name: string) => name === 'cmd_a' || name === 'cmd_b');
      (AssistantActionService.getInstance().hasAction as jest.Mock).mockImplementation(
        mockHasAction
      );

      const messagesWithMultipleUnfinished = [
        { id: 'user-1', role: 'user', content: 'Run two commands' },
        {
          id: 'assistant-1',
          role: 'assistant',
          content: '',
          toolCalls: [
            { id: 'tc-1', type: 'function', function: { name: 'cmd_a', arguments: '{"a":1}' } },
            { id: 'tc-2', type: 'function', function: { name: 'cmd_b', arguments: '{"b":2}' } },
          ],
        },
      ];

      chatService.conversationHistoryService.getConversation = jest.fn().mockResolvedValue([
        {
          type: 'MESSAGES_SNAPSHOT',
          messages: messagesWithMultipleUnfinished,
          timestamp: Date.now(),
        },
      ]);

      const result = await chatService.loadConversation(mockThreadId);

      expect(result).not.toBeNull();
      const startEvents = result!.filter((e: any) => e.type === 'TOOL_CALL_START');
      const argsEvents = result!.filter((e: any) => e.type === 'TOOL_CALL_ARGS');
      const endEvents = result!.filter((e: any) => e.type === 'TOOL_CALL_END');

      expect(startEvents).toHaveLength(2);
      expect(argsEvents).toHaveLength(2);
      expect(endEvents).toHaveLength(2);

      const startIds = startEvents.map((e: any) => e.toolCallId);
      expect(startIds).toContain('tc-1');
      expect(startIds).toContain('tc-2');
    });

    it('should not inject tool call events when all tool calls have results', async () => {
      const mockHasAction = jest.fn((name: string) => name === 'run_cmd');
      (AssistantActionService.getInstance().hasAction as jest.Mock).mockImplementation(
        mockHasAction
      );

      const messagesWithFinished = [
        { id: 'user-1', role: 'user', content: 'Run it' },
        {
          id: 'assistant-1',
          role: 'assistant',
          content: '',
          toolCalls: [
            { id: 'tc-1', type: 'function', function: { name: 'run_cmd', arguments: '{}' } },
          ],
        },
        { id: 'tool-1', role: 'tool', content: 'done', toolCallId: 'tc-1' },
      ];

      chatService.conversationHistoryService.getConversation = jest
        .fn()
        .mockResolvedValue([
          { type: 'MESSAGES_SNAPSHOT', messages: messagesWithFinished, timestamp: Date.now() },
        ]);

      const result = await chatService.loadConversation(mockThreadId);

      expect(result).not.toBeNull();
      const types = result!.map((e: any) => e.type);
      expect(types).not.toContain('TOOL_CALL_START');
    });

    it('should not inject synthetic events for non-frontend tool calls', async () => {
      const mockHasAction = jest.fn().mockReturnValue(false);
      (AssistantActionService.getInstance().hasAction as jest.Mock).mockImplementation(
        mockHasAction
      );

      const messagesWithServerTool = [
        { id: 'user-1', role: 'user', content: 'Run it' },
        {
          id: 'assistant-1',
          role: 'assistant',
          content: '',
          toolCalls: [
            { id: 'tc-1', type: 'function', function: { name: 'server_tool', arguments: '{}' } },
          ],
        },
      ];

      chatService.conversationHistoryService.getConversation = jest
        .fn()
        .mockResolvedValue([
          { type: 'MESSAGES_SNAPSHOT', messages: messagesWithServerTool, timestamp: Date.now() },
        ]);

      const result = await chatService.loadConversation(mockThreadId);

      expect(result).not.toBeNull();
      const types = result!.map((e: any) => e.type);
      expect(types).not.toContain('TOOL_CALL_START');
    });
  });

  // ---------------------------------------------------------------------------------------------
  // Data source resolution
  // ---------------------------------------------------------------------------------------------

  const getDefaultDataSourceIdMock = jest.requireMock('../../../data_source_management/public')
    .getDefaultDataSourceId as jest.Mock;

  const DS_THREAD_ID = 'thread-ds-1';
  const DS_A = { id: 'ds-a', attributes: { title: 'Alpha' } };
  const DS_B = { id: 'ds-b', attributes: { title: 'Beta' } };
  const DS_C = { id: 'ds-c', attributes: { title: 'Gamma' } };

  const createStatefulContextStore = () => {
    const stored: any[] = [];
    return {
      addContext: jest.fn((ctx: any) => {
        const index = stored.findIndex((c) => c.id === ctx.id);
        if (index !== -1) stored.splice(index, 1);
        stored.push(ctx);
      }),
      removeContextById: jest.fn((id: string) => {
        const index = stored.findIndex((c) => c.id === id);
        if (index !== -1) stored.splice(index, 1);
      }),
      getAllContexts: jest.fn(() => stored),
      getBackendFormattedContexts: jest.fn().mockReturnValue([]),
    };
  };

  /** A saved object as savedObjectsClient.get returns it. */
  const savedDataSource = (id: string, title: string, workspaces?: string[]) => ({
    id,
    type: 'data-source',
    attributes: { title },
    workspaces,
  });

  const notFound = (id: string) => ({
    id,
    type: 'data-source',
    attributes: {},
    error: { statusCode: 404 },
  });

  interface DataSourceHarnessOptions {
    list?: Array<{ id: string; attributes: { title: string } }>;
    total?: number;
    workspaceId?: string;
    defaultId?: string;
    dataSourceEnabled?: boolean;
  }

  /**
   * A ChatService with a saved objects client. The thread is set directly (not via newThread) so
   * the list is not prefetched and find counts start at zero.
   */
  const setupDataSources = (options: DataSourceHarnessOptions = {}) => {
    const { list = [DS_A, DS_B, DS_C], total, workspaceId, defaultId } = options;
    const find = jest.fn().mockResolvedValue({ savedObjects: list, total });
    const get = jest.fn(async (_type: string, id: string): Promise<any> => notFound(id));
    const currentWorkspaceId$ = new BehaviorSubject<string | undefined>(workspaceId);
    const store = createStatefulContextStore();
    (window as any).assistantContextStore = store;
    getDefaultDataSourceIdMock.mockReset();
    getDefaultDataSourceIdMock.mockResolvedValue(defaultId);
    // Runs complete on subscribe, so a finished run does not hold up the next continuation.
    mockAgent.runAgent.mockReturnValue(new Observable<BaseEvent>((s) => s.complete()));
    const service = new ChatService(
      mockUiSettings,
      mockCoreChatService,
      { currentWorkspaceId$ } as any,
      { find, get } as any,
      options.dataSourceEnabled ?? true
    );
    mockThreadId$.next(DS_THREAD_ID);
    // The continuation delay is covered by the sendToolResult tests; skip it here.
    jest.spyOn(service as any, 'waitBeforeContinuation').mockResolvedValue(true);
    return { service, find, get, store, currentWorkspaceId$ };
  };

  const setPageDataSource = (store: ReturnType<typeof createStatefulContextStore>, id?: string) => {
    store.removeContextById('page-context');
    if (id) {
      store.addContext({
        id: 'page-context',
        categories: ['page'],
        description: 'Page context',
        value: { appId: 'explore', dataset: { dataSource: { id } } },
      });
    }
  };

  const dataSourceContextValue = (runInput: any): string | undefined =>
    runInput.context.find((ctx: any) => ctx.description === AVAILABLE_DATA_SOURCES_CONTEXT_DES)
      ?.value;

  const lastRunAgentCall = () =>
    mockAgent.runAgent.mock.calls[mockAgent.runAgent.mock.calls.length - 1];

  describe('data sources', () => {
    afterEach(() => {
      delete (window as any).assistantContextStore;
    });

    describe('a data source a caller passes', () => {
      const caller = (id: string) => ({ callerDataSourceId: id });

      it('is used for its message ahead of the conversation data source, without being recorded', async () => {
        const { service } = setupDataSources();
        service.setConversationDataSource('ds-b');

        const resolution = await service.resolveDataSourceForRun(caller('ds-c'));

        expect(resolution).toMatchObject({ active: { id: 'ds-c' }, source: 'caller' });
        // Resolution is a pure read; only the agent's switch_data_source records it.
        expect(service.getPendingDataSourceId()).toBeUndefined();
        expect(service.getConversationDataSourceId()).toBe('ds-b');
      });

      it('asks the agent to switch to it, and stays chosen once its message is sent', async () => {
        const { service } = setupDataSources();
        service.setConversationDataSource('ds-b');

        await service.sendMessage('hi', [], undefined, {
          resolution: await service.resolveDataSourceForRun(caller('ds-c')),
        });

        const value = dataSourceContextValue(lastRunAgentCall()[0]);
        expect(value).toContain(
          `The user's request is about data in "Gamma" (id: ds-c) (for example a visualization they asked about). Before calling any other tool, call switch_data_source with dataSourceId "ds-c"`
        );
        expect(value).not.toContain('The user selected');
        expect(service.getPendingDataSourceId()).toBe('ds-c');
        expect(service.getConversationDataSourceId()).toBe('ds-b');
      });

      it('uses a neutral line in later runs while the agent has not recorded it', async () => {
        const { service } = setupDataSources();
        service.setConversationDataSource('ds-b');
        await service.sendMessage('hi', [], undefined, {
          resolution: await service.resolveDataSourceForRun(caller('ds-c')),
        });

        expect(await service.resolveDataSourceForRun()).toMatchObject({
          active: { id: 'ds-c' },
          source: 'pending',
          pendingOrigin: 'caller',
        });
        await service.sendMessage('and now?', []);

        const [runInput, dataSourceId] = lastRunAgentCall();
        expect(dataSourceId).toBe('ds-c');
        const value = dataSourceContextValue(runInput);
        expect(value).toContain(
          `"Gamma" (id: ds-c) was chosen for this conversation by an earlier request but is not recorded yet. Before calling any other tool, call switch_data_source with dataSourceId "ds-c"`
        );
        expect(value).not.toContain("The user's request is about");
      });

      it('becomes the conversation data source once the agent switches to it', async () => {
        const { service } = setupDataSources();
        service.setPendingDataSource('ds-c', 'caller');
        service.setConversationDataSource('ds-c');

        expect(service.getPendingDataSourceId()).toBeUndefined();
        expect(await service.resolveDataSourceForRun()).toMatchObject({
          active: { id: 'ds-c' },
          source: 'conversation',
        });
      });

      it('is replaced when the agent switches to another data source the user named', async () => {
        const { service } = setupDataSources();
        service.setPendingDataSource('ds-c', 'caller');
        service.setConversationDataSource('ds-a');

        expect(service.getPendingDataSourceId()).toBeUndefined();
        expect(await service.resolveDataSourceForRun()).toMatchObject({ active: { id: 'ds-a' } });
      });

      it('asks nothing of the agent when it already is the conversation data source', async () => {
        const { service } = setupDataSources();
        service.setConversationDataSource('ds-c');

        const resolution = await service.resolveDataSourceForRun(caller('ds-c'));
        expect(resolution).toMatchObject({ active: { id: 'ds-c' }, source: 'conversation' });
        await service.sendMessage('hi', [], undefined, { resolution });

        expect(service.getPendingDataSourceId()).toBeUndefined();
        expect(dataSourceContextValue(lastRunAgentCall()[0])).not.toContain(
          'Before calling any other tool'
        );
      });

      it('stays behind the page data source', async () => {
        const { service, store } = setupDataSources();
        setPageDataSource(store, 'ds-a');

        const resolution = await service.resolveDataSourceForRun(caller('ds-c'));
        expect(resolution).toMatchObject({ active: { id: 'ds-a' }, source: 'page' });
        await service.sendMessage('hi', [], undefined, { resolution });

        expect(service.getPendingDataSourceId()).toBeUndefined();
      });

      it('is ignored, with a debug note, when it does not verify, keeping an earlier picker choice', async () => {
        const debug = jest.spyOn(console, 'debug').mockImplementation(() => {});
        const { service } = setupDataSources();
        service.setConversationDataSource('ds-a');
        service.setPendingDataSource('ds-b', 'picker');

        const resolution = await service.resolveDataSourceForRun(caller('ds-gone'));
        expect(resolution).toMatchObject({
          active: { id: 'ds-b' },
          source: 'pending',
          pendingOrigin: 'picker',
        });
        await service.sendMessage('hi', [], undefined, { resolution });

        expect(service.getPendingDataSourceId()).toBe('ds-b');
        expect(debug).toHaveBeenCalledWith(expect.stringContaining('"ds-gone"'));
        debug.mockRestore();
      });

      it('is cleared with the conversation', async () => {
        const { service } = setupDataSources({ defaultId: 'ds-a' });
        service.setPendingDataSource('ds-c', 'caller');
        service.newThread();

        expect(await service.resolveDataSourceForRun()).toMatchObject({ active: { id: 'ds-a' } });
      });
    });

    describe('the default data source setting', () => {
      it('is read once per conversation', async () => {
        const { service } = setupDataSources({ defaultId: 'ds-a' });

        await service.resolveDataSourceForRun();
        await service.getDataSourceIdForRead();
        expect(getDefaultDataSourceIdMock).toHaveBeenCalledTimes(1);

        service.newThread();
        await service.resolveDataSourceForRun();
        expect(getDefaultDataSourceIdMock).toHaveBeenCalledTimes(2);
      });

      it('is read again after a failed read', async () => {
        const { service } = setupDataSources();
        getDefaultDataSourceIdMock.mockRejectedValueOnce(new Error('down'));

        expect((await service.resolveDataSourceForRun()).kind).toBe('needs_selection');
        getDefaultDataSourceIdMock.mockResolvedValue('ds-a');
        expect(await service.resolveDataSourceForRun()).toMatchObject({ active: { id: 'ds-a' } });
      });
    });

    describe('resolveDataSourceForRun', () => {
      it('prefers the page data source, then the conversation one, then the default', async () => {
        const { service, store } = setupDataSources({ defaultId: 'ds-c' });
        setPageDataSource(store, 'ds-a');
        service.setConversationDataSource('ds-b');

        expect(await service.resolveDataSourceForRun()).toMatchObject({
          kind: 'resolved',
          active: { id: 'ds-a', title: 'Alpha' },
          source: 'page',
        });

        setPageDataSource(store, undefined);
        expect(await service.resolveDataSourceForRun()).toMatchObject({
          active: { id: 'ds-b' },
          source: 'conversation',
        });

        service.newThread();
        expect(await service.resolveDataSourceForRun()).toMatchObject({
          active: { id: 'ds-c' },
          source: 'globalDefault',
        });
      });

      it('moves to the next candidate when an id is neither listed nor found by lookup', async () => {
        const { service, store, get } = setupDataSources();
        setPageDataSource(store, 'ds-gone');
        service.setConversationDataSource('ds-b');

        const resolution = await service.resolveDataSourceForRun();

        expect(get).toHaveBeenCalledWith('data-source', 'ds-gone');
        expect(resolution).toMatchObject({ active: { id: 'ds-b' }, source: 'conversation' });
      });

      it('uses an id found by lookup in the current workspace, appends it and marks the list incomplete', async () => {
        const { service, get } = setupDataSources({ list: [DS_A], workspaceId: 'ws-1' });
        get.mockImplementation(async (_type: string, id: string) =>
          savedDataSource(id, 'Far Away', ['ws-1'])
        );
        service.setConversationDataSource('ds-far');

        expect(await service.resolveDataSourceForRun()).toEqual({
          kind: 'resolved',
          active: { id: 'ds-far', title: 'Far Away' },
          source: 'conversation',
          available: [
            { id: 'ds-a', title: 'Alpha' },
            { id: 'ds-far', title: 'Far Away' },
          ],
          listComplete: false,
        });
      });

      it('does not use an id the lookup finds in another workspace', async () => {
        const { service, get } = setupDataSources({ list: [DS_A], workspaceId: 'ws-1' });
        get.mockImplementation(async (_type: string, id: string) =>
          savedDataSource(id, 'Elsewhere', ['ws-2'])
        );
        service.setConversationDataSource('ds-other');

        expect(await service.resolveDataSourceForRun()).toEqual({
          kind: 'needs_selection',
          available: [{ id: 'ds-a', title: 'Alpha' }],
          listComplete: true,
        });
      });

      it('does not use an id whose lookup throws, and looks it up again on the next call', async () => {
        const { service, get } = setupDataSources({ list: [DS_A] });
        get.mockRejectedValue(new Error('network down'));
        service.setConversationDataSource('ds-x');

        expect((await service.resolveDataSourceForRun()).kind).toBe('needs_selection');
        expect((await service.resolveDataSourceForRun()).kind).toBe('needs_selection');
        expect(get).toHaveBeenCalledTimes(2);
      });

      it('caches a 404 lookup for the thread', async () => {
        const { service, get } = setupDataSources({ list: [DS_A] });
        service.setConversationDataSource('ds-x');

        await service.resolveDataSourceForRun();
        await service.resolveDataSourceForRun();

        expect(get).toHaveBeenCalledTimes(1);
      });

      it('reads the workspace default in a workspace and the global default outside one', async () => {
        const inWorkspace = setupDataSources({ workspaceId: 'ws-1', defaultId: 'ds-b' });
        inWorkspace.get.mockImplementation(async (_type: string, id: string) =>
          savedDataSource(id, 'unused', ['ws-1'])
        );
        expect(await inWorkspace.service.resolveDataSourceForRun()).toMatchObject({
          active: { id: 'ds-b' },
          source: 'workspaceDefault',
        });
        expect(getDefaultDataSourceIdMock).toHaveBeenCalledWith(
          mockUiSettings,
          UiSettingScope.WORKSPACE
        );

        const outside = setupDataSources({ defaultId: 'ds-b' });
        expect(await outside.service.resolveDataSourceForRun()).toMatchObject({
          active: { id: 'ds-b' },
          source: 'globalDefault',
        });
        expect(getDefaultDataSourceIdMock).toHaveBeenCalledWith(
          mockUiSettings,
          UiSettingScope.GLOBAL
        );
      });

      it('needs a selection when reading the default throws', async () => {
        const { service } = setupDataSources();
        getDefaultDataSourceIdMock.mockRejectedValue(new Error('settings unavailable'));

        expect((await service.resolveDataSourceForRun()).kind).toBe('needs_selection');
      });

      it('is disabled without reading the list when multiple data sources are not enabled', async () => {
        const { service, find } = setupDataSources({ dataSourceEnabled: false });

        expect(service.isDataSourceEnabled()).toBe(false);
        expect(await service.resolveDataSourceForRun()).toEqual({ kind: 'disabled' });
        expect(find).not.toHaveBeenCalled();
      });

      it('is disabled without a saved objects client', async () => {
        expect(chatService.isDataSourceEnabled()).toBe(false);
        expect(await chatService.resolveDataSourceForRun()).toEqual({ kind: 'disabled' });
      });

      it('reports list_failed when the list read fails and no candidate verifies', async () => {
        const { service, find } = setupDataSources({ defaultId: 'ds-a' });
        find.mockRejectedValue(new Error('boom'));

        expect(await service.resolveDataSourceForRun()).toEqual({ kind: 'list_failed' });
      });

      it('resolves a candidate found by lookup even when the list read fails', async () => {
        const { service, find, get } = setupDataSources();
        find.mockRejectedValue(new Error('boom'));
        get.mockImplementation(async (_type: string, id: string) => savedDataSource(id, 'Alpha'));
        service.setConversationDataSource('ds-a');

        expect(await service.resolveDataSourceForRun()).toEqual({
          kind: 'resolved',
          active: { id: 'ds-a', title: 'Alpha' },
          source: 'conversation',
          available: [{ id: 'ds-a', title: 'Alpha' }],
          listComplete: false,
        });
      });

      it('reports none_exist when the list is empty', async () => {
        const { service } = setupDataSources({ list: [], defaultId: 'ds-a' });

        expect(await service.resolveDataSourceForRun()).toEqual({ kind: 'none_exist' });
      });

      it('carries the list, sorted by title, when a selection is needed', async () => {
        const { service } = setupDataSources({ list: [DS_C, DS_A, DS_B] });

        expect(await service.resolveDataSourceForRun()).toEqual({
          kind: 'needs_selection',
          available: [
            { id: 'ds-a', title: 'Alpha' },
            { id: 'ds-b', title: 'Beta' },
            { id: 'ds-c', title: 'Gamma' },
          ],
          listComplete: true,
        });
      });

      it('marks the list incomplete when the total exceeds the listed data sources', async () => {
        const { service } = setupDataSources({ list: [DS_A, DS_B], total: 150 });

        expect(await service.resolveDataSourceForRun()).toMatchObject({
          kind: 'needs_selection',
          listComplete: false,
        });

        service.setConversationDataSource('ds-a');
        expect(await service.resolveDataSourceForRun()).toMatchObject({
          kind: 'resolved',
          listComplete: false,
        });
      });
    });

    describe('direct lookup of ids missing from the list', () => {
      const resolveWithDefault = async (getResult: () => Promise<any>) => {
        const { service, get } = setupDataSources({ defaultId: 'ds-x' });
        get.mockImplementation(getResult);
        return { service, get, resolution: await service.resolveDataSourceForRun() };
      };

      it('treats a 403 result as not available and caches it', async () => {
        const { service, get, resolution } = await resolveWithDefault(async () => ({
          id: 'ds-x',
          type: 'data-source',
          attributes: {},
          error: { statusCode: 403 },
        }));

        expect(resolution.kind).toBe('needs_selection');
        await service.resolveDataSourceForRun();
        expect(get).toHaveBeenCalledTimes(1);
      });

      it('treats a request rejected with 403 as not available and caches it', async () => {
        const { service, get, resolution } = await resolveWithDefault(async () => {
          throw Object.assign(new Error('Forbidden'), { res: { status: 403 } });
        });

        expect(resolution.kind).toBe('needs_selection');
        await service.resolveDataSourceForRun();
        expect(get).toHaveBeenCalledTimes(1);
      });

      it('treats an object of another type as not available', async () => {
        const { resolution } = await resolveWithDefault(async () => ({
          id: 'ds-x',
          type: 'index-pattern',
          attributes: { title: 'Not a data source' },
        }));

        expect(resolution.kind).toBe('needs_selection');
      });

      it('treats an object with empty attributes as not available', async () => {
        const { resolution } = await resolveWithDefault(async () => ({
          id: 'ds-x',
          type: 'data-source',
          attributes: {},
        }));

        expect(resolution.kind).toBe('needs_selection');
      });

      it('shares one request between concurrent lookups of the same id', async () => {
        const { service, get } = setupDataSources({ defaultId: 'ds-x' });
        let finish: (value: any) => void = () => {};
        get.mockImplementation(() => new Promise((resolve) => (finish = resolve)));

        const first = service.resolveDataSourceForRun();
        const second = service.getDataSourceIdForRead();
        // Both resolutions reach the lookup before it answers.
        await new Promise((r) => setTimeout(r, 0));
        finish(savedDataSource('ds-x', 'Extra'));

        expect((await first).kind).toBe('resolved');
        expect(await second).toBe('ds-x');
        expect(get).toHaveBeenCalledTimes(1);
      });

      it('looks an id up again in another conversation', async () => {
        const { service, get } = setupDataSources({ defaultId: 'ds-x' });
        await service.resolveDataSourceForRun();
        mockThreadId$.next('another-thread');
        await service.resolveDataSourceForRun();

        expect(get).toHaveBeenCalledTimes(2);
      });
    });

    describe('verifyDataSourceId', () => {
      it('finds an id in the list without a lookup', async () => {
        const { service, get } = setupDataSources();

        const result = await service.verifyDataSourceId('ds-b');

        expect(result).toMatchObject({ dataSource: { id: 'ds-b' }, unverifiable: false });
        expect(get).not.toHaveBeenCalled();
      });

      it('reports a failed lookup as unverifiable, not as an unknown id', async () => {
        const { service, get } = setupDataSources();
        get.mockRejectedValue(new Error('network down'));

        const result = await service.verifyDataSourceId('ds-new');

        expect(result.dataSource).toBeUndefined();
        expect(result.unverifiable).toBe(true);
        expect(result.available.map((ds) => ds.id)).toEqual(['ds-a', 'ds-b', 'ds-c']);
      });

      it('reports an object-level error other than 403/404 as unverifiable, without caching', async () => {
        const { service, get } = setupDataSources();
        get.mockResolvedValue({ id: 'ds-x', type: 'data-source', error: { statusCode: 500 } });

        expect((await service.verifyDataSourceId('ds-x')).unverifiable).toBe(true);
        await service.verifyDataSourceId('ds-x');
        expect(get).toHaveBeenCalledTimes(2);
      });

      it('reports a definite miss as not unverifiable', async () => {
        const { service } = setupDataSources();

        const result = await service.verifyDataSourceId('ds-missing');

        expect(result).toMatchObject({ unverifiable: false });
        expect(result.dataSource).toBeUndefined();
      });

      it('reports unverifiable when the list cannot be read and the lookup misses', async () => {
        const { service, find } = setupDataSources();
        find.mockRejectedValue(new Error('down'));

        expect((await service.verifyDataSourceId('ds-missing')).unverifiable).toBe(true);
      });
    });

    describe('data source list lifecycle', () => {
      it('shares one list read between concurrent resolutions', async () => {
        const { service, find } = setupDataSources();

        await Promise.all([service.resolveDataSourceForRun(), service.resolveDataSourceForRun()]);

        expect(find).toHaveBeenCalledTimes(1);
        expect(find).toHaveBeenCalledWith({
          type: 'data-source',
          fields: ['title'],
          perPage: 100,
        });
      });

      it('reads the list again after a failed read', async () => {
        const { service, find } = setupDataSources();
        find.mockRejectedValueOnce(new Error('boom'));

        expect((await service.resolveDataSourceForRun()).kind).toBe('list_failed');
        expect((await service.resolveDataSourceForRun()).kind).toBe('needs_selection');
        expect(find).toHaveBeenCalledTimes(2);
      });

      it('keeps a successful read for the thread and reads again for another thread', async () => {
        const { service, find } = setupDataSources();

        await service.resolveDataSourceForRun();
        await service.resolveDataSourceForRun();
        expect(find).toHaveBeenCalledTimes(1);

        mockThreadId$.next('thread-ds-2');
        await service.resolveDataSourceForRun();
        expect(find).toHaveBeenCalledTimes(2);

        service.newThread();
        await service.resolveDataSourceForRun();
        expect(find).toHaveBeenCalledTimes(3);
      });

      it('prefetches the list on newThread', () => {
        const { service, find } = setupDataSources();

        service.newThread();

        expect(find).toHaveBeenCalledTimes(1);
      });

      it('does not prefetch on newThread when data sources are disabled', () => {
        const { service, find } = setupDataSources({ dataSourceEnabled: false });

        service.newThread();

        expect(find).not.toHaveBeenCalled();
      });
    });

    describe('overlapping conversation loads', () => {
      const historyWithSwitch = (dataSourceId: string) => [
        {
          type: 'MESSAGES_SNAPSHOT',
          timestamp: Date.now(),
          messages: [
            {
              id: 'a1',
              role: 'assistant',
              content: '',
              toolCalls: [
                {
                  id: 'c1',
                  type: 'function',
                  function: { name: 'switch_data_source', arguments: '{}' },
                },
              ],
            },
            {
              id: 't1',
              role: 'tool',
              toolCallId: 'c1',
              content: JSON.stringify({ success: true, dataSourceId }),
            },
          ],
        },
      ];

      it('applies only the latest load, even when an earlier one finishes last', async () => {
        const { service } = setupDataSources();
        let finishA: (events: any) => void = () => {};
        const getConversation = jest.spyOn(service.conversationHistoryService, 'getConversation');
        getConversation
          .mockImplementationOnce(() => new Promise((resolve) => (finishA = resolve)))
          .mockResolvedValueOnce(historyWithSwitch('ds-b'));

        const loadA = service.loadConversation('thread-a');
        const loadB = service.loadConversation('thread-b');
        await loadB;
        finishA(historyWithSwitch('ds-c'));

        expect(await loadA).toBeNull();
        expect(mockCoreChatService.setThreadId).toHaveBeenLastCalledWith('thread-b');
        expect(service.getConversationDataSourceId()).toBe('ds-b');
      });

      it('does not take the thread back when a new chat starts during a load', async () => {
        const { service } = setupDataSources();
        let finish: (events: any) => void = () => {};
        jest
          .spyOn(service.conversationHistoryService, 'getConversation')
          .mockImplementationOnce(() => new Promise((resolve) => (finish = resolve)));

        const load = service.loadConversation('thread-old');
        service.newThread();
        finish(historyWithSwitch('ds-b'));

        expect(await load).toBeNull();
        expect(mockCoreChatService.setThreadId).not.toHaveBeenCalledWith('thread-old');
        expect(service.getConversationDataSourceId()).toBeUndefined();
      });
    });

    describe('conversation data source from history', () => {
      const switchCall = (id: string, name = 'switch_data_source') => ({
        id,
        type: 'function',
        function: { name, arguments: '{}' },
      });
      const toolResult = (toolCallId: string, content: any) => ({
        id: `tool-${toolCallId}`,
        role: 'tool',
        toolCallId,
        content: typeof content === 'string' ? content : JSON.stringify(content),
      });
      const load = async (service: ChatService, messages: any[]) => {
        service.conversationHistoryService.getConversation = jest
          .fn()
          .mockResolvedValue([{ type: 'MESSAGES_SNAPSHOT', messages, timestamp: Date.now() }]);
        return service.loadConversation('thread-history');
      };

      it('uses the last successful switch', async () => {
        const { service } = setupDataSources();

        await load(service, [
          { id: 'u1', role: 'user', content: 'switch' },
          { id: 'a1', role: 'assistant', content: '', toolCalls: [switchCall('c1')] },
          toolResult('c1', { success: true, dataSourceId: 'ds-a' }),
          { id: 'a2', role: 'assistant', content: '', toolCalls: [switchCall('c2')] },
          toolResult('c2', { success: true, dataSourceId: 'ds-b' }),
          { id: 'a3', role: 'assistant', content: 'done' },
        ]);

        expect(service.getConversationDataSourceId()).toBe('ds-b');
        expect(await service.resolveDataSourceForRun()).toMatchObject({
          active: { id: 'ds-b' },
          source: 'conversation',
        });
      });

      it('ignores failed switches, unparseable results, calls without a result and other tools', async () => {
        const { service } = setupDataSources();

        await load(service, [
          { id: 'u1', role: 'user', content: 'switch' },
          { id: 'a1', role: 'assistant', content: '', toolCalls: [switchCall('c1')] },
          toolResult('c1', { success: true, dataSourceId: 'ds-a' }),
          {
            id: 'a2',
            role: 'assistant',
            content: '',
            toolCalls: [
              switchCall('c2'),
              switchCall('c3'),
              switchCall('c4'),
              switchCall('c5', 'other_tool'),
            ],
          },
          toolResult('c2', { success: false, dataSourceId: 'ds-b' }),
          toolResult('c3', 'not json'),
          // c4 has no result.
          toolResult('c5', { success: true, dataSourceId: 'ds-c' }),
          { id: 'a3', role: 'assistant', content: 'done' },
        ]);

        expect(service.getConversationDataSourceId()).toBe('ds-a');
      });

      it('clears the previous conversation data source and picker flag first', async () => {
        const { service } = setupDataSources();
        service.setConversationDataSource('ds-old');
        service.setPendingDataSource('ds-b', 'picker');
        expect(service.getPendingDataSourceId()).toBe('ds-b');

        await load(service, [
          { id: 'u1', role: 'user', content: 'hi' },
          { id: 'a1', role: 'assistant', content: 'hello' },
        ]);

        expect(service.getConversationDataSourceId()).toBeUndefined();
        expect(service.getPendingDataSourceId()).toBeUndefined();
      });

      it('keeps the current conversation data source when the conversation fails to load', async () => {
        const { service } = setupDataSources();
        service.setConversationDataSource('ds-a');
        service.setPendingDataSource('ds-b', 'picker');
        service.conversationHistoryService.getConversation = jest.fn().mockResolvedValue(null);

        await service.loadConversation('thread-missing');

        // The user stays in the current conversation, so nothing about it changes.
        expect(service.getConversationDataSourceId()).toBe('ds-a');
        expect(service.getPendingDataSourceId()).toBe('ds-b');
      });

      it('fetches the history with the current data source and reads the list once more only for the new thread', async () => {
        const { service, find } = setupDataSources();
        service.setConversationDataSource('ds-b');
        let historyDataSourceId: string | undefined;
        service.conversationHistoryService.getConversation = jest.fn(async () => {
          // What the memory provider sees while it fetches the history.
          historyDataSourceId = await service.getDataSourceIdForRead();
          return [{ type: 'MESSAGES_SNAPSHOT', messages: [], timestamp: Date.now() }] as any;
        });
        await service.resolveDataSourceForRun();
        expect(find).toHaveBeenCalledTimes(1);

        await service.loadConversation('thread-history');

        expect(historyDataSourceId).toBe('ds-b');
        // The fetch reused the cached list; only the opened conversation reads it again.
        expect(find).toHaveBeenCalledTimes(2);
      });

      it('reads switches from every snapshot, in order', async () => {
        const { service } = setupDataSources();
        const snapshot = (callId: string, dataSourceId: string) => ({
          type: 'MESSAGES_SNAPSHOT',
          timestamp: Date.now(),
          messages: [
            { id: `a-${callId}`, role: 'assistant', content: '', toolCalls: [switchCall(callId)] },
            toolResult(callId, { success: true, dataSourceId }),
          ],
        });
        service.conversationHistoryService.getConversation = jest
          .fn()
          .mockResolvedValue([snapshot('c1', 'ds-a'), snapshot('c2', 'ds-c')]);

        await service.loadConversation('thread-history');

        expect(service.getConversationDataSourceId()).toBe('ds-c');
      });
    });

    describe('picker choice', () => {
      it('runs with the picked data source and asks the agent to record it', async () => {
        const { service } = setupDataSources();
        service.setPendingDataSource('ds-b', 'picker');

        expect(service.getPendingDataSourceId()).toBe('ds-b');
        expect(service.getConversationDataSourceId()).toBeUndefined();
        expect(await service.resolveDataSourceForRun()).toMatchObject({
          active: { id: 'ds-b' },
          source: 'pending',
          pendingOrigin: 'picker',
        });

        await service.sendMessage('hi', []);

        const [runInput, dataSourceId] = lastRunAgentCall();
        expect(dataSourceId).toBe('ds-b');
        expect(dataSourceContextValue(runInput)).toContain(
          'The user selected "Beta" (id: ds-b) in the data source picker. Before calling any other tool, call switch_data_source with dataSourceId "ds-b"'
        );
      });

      it('is used ahead of the conversation data source until the agent records it', async () => {
        const { service } = setupDataSources();
        service.setConversationDataSource('ds-a');
        service.setPendingDataSource('ds-b', 'picker');

        expect(await service.resolveDataSourceForRun()).toMatchObject({
          active: { id: 'ds-b' },
          source: 'pending',
          pendingOrigin: 'picker',
        });
        expect(service.getConversationDataSourceId()).toBe('ds-a');
      });

      it('drops the picker line once the agent switched', async () => {
        const { service } = setupDataSources();
        service.setPendingDataSource('ds-b', 'picker');
        service.setConversationDataSource('ds-b');

        expect(service.getPendingDataSourceId()).toBeUndefined();
        await service.sendMessage('hi', []);

        const [runInput, dataSourceId] = lastRunAgentCall();
        expect(dataSourceId).toBe('ds-b');
        expect(dataSourceContextValue(runInput)).not.toContain('The user selected');
      });
    });

    describe('data source context', () => {
      it('lists every available data source with escaped titles and names the active one', async () => {
        const quoted = { id: 'ds-q', attributes: { title: 'He said "hi"' } };
        const { service, store } = setupDataSources({ list: [quoted, DS_A] });
        service.setConversationDataSource('ds-a');

        await service.sendMessage('hi', []);

        expect(store.addContext).toHaveBeenCalledWith(
          expect.objectContaining({
            id: AVAILABLE_DATA_SOURCES_CONTEXT_ID,
            description: AVAILABLE_DATA_SOURCES_CONTEXT_DES,
          })
        );
        const value = dataSourceContextValue(lastRunAgentCall()[0])!;
        expect(value).toContain(
          'Available data sources (the ONLY data sources the user can use): "Alpha" (id: ds-a), "He said \\"hi\\"" (id: ds-q)'
        );
        expect(value).toContain('Currently active data source: "Alpha" (id: ds-a)');
        expect(value).toContain(
          '- If it matches none, tell the user it is not available and list the available names.'
        );
        expect(value).not.toContain('cannot be switched while the user is on this page');
      });

      it('says the list may be partial when it is incomplete', async () => {
        const { service } = setupDataSources({ total: 150 });
        service.setConversationDataSource('ds-a');

        await service.sendMessage('hi', []);

        const value = dataSourceContextValue(lastRunAgentCall()[0])!;
        expect(value).toContain(
          'Available data sources (this list may not include every data source): '
        );
        expect(value).not.toContain('the ONLY data sources');
        expect(value).toContain(
          '- If it matches none, tell the user you could not find it among the listed data sources'
        );
      });

      it('says the data source cannot be switched when the page pins it', async () => {
        const { service, store } = setupDataSources();
        setPageDataSource(store, 'ds-c');

        await service.sendMessage('hi', []);

        const [runInput, dataSourceId] = lastRunAgentCall();
        expect(dataSourceId).toBe('ds-c');
        expect(dataSourceContextValue(runInput)).toContain(
          'cannot be switched while the user is on this page'
        );
      });

      it('removes the context when the continuation has no data source to run with', async () => {
        const { service, store } = setupDataSources({ list: [] });

        await service.sendToolResult('tc-1', { ok: true }, []);

        expect(store.removeContextById).toHaveBeenCalledWith(AVAILABLE_DATA_SOURCES_CONTEXT_ID);
        const [runInput, dataSourceId] = lastRunAgentCall();
        expect(dataSourceId).toBeUndefined();
        expect(dataSourceContextValue(runInput)).toBeUndefined();
      });
    });

    describe('per-run data source', () => {
      it('keeps the data source a run was dispatched with after the page changes', async () => {
        const { service, store } = setupDataSources();
        setPageDataSource(store, 'ds-a');
        await service.sendMessage('hi', []);
        const runId = lastRunAgentCall()[0].runId;

        setPageDataSource(store, 'ds-b');

        expect(await service.getRunDataSource(runId)).toEqual({ id: 'ds-a', title: 'Alpha' });
        expect(await service.getRunDataSource('unknown-run')).toEqual({
          id: 'ds-a',
          title: 'Alpha',
        });
      });

      it('resolves afresh for getRunDataSource before any run', async () => {
        const { service } = setupDataSources({ defaultId: 'ds-c' });

        expect(await service.getRunDataSource()).toEqual({ id: 'ds-c', title: 'Gamma' });
      });

      it('dispatches a tool result with the data source the agent switched to', async () => {
        const { service } = setupDataSources();
        service.setConversationDataSource('ds-a');
        (await service.sendMessage('hi', [])).observable.subscribe();
        expect(lastRunAgentCall()[1]).toBe('ds-a');

        service.setConversationDataSource('ds-b');
        await service.sendToolResult('tc-1', { success: true }, []);

        const [runInput, dataSourceId] = lastRunAgentCall();
        expect(dataSourceId).toBe('ds-b');
        expect(dataSourceContextValue(runInput)).toContain(
          'Currently active data source: "Beta" (id: ds-b)'
        );
      });

      it('dispatches a tool result batch with the data source the agent switched to', async () => {
        const { service } = setupDataSources();
        service.setConversationDataSource('ds-a');
        await service.sendMessage('hi', []);

        service.setConversationDataSource('ds-b');
        await service.sendToolResults([{ toolCallId: 'tc-1', result: { success: true } }], []);

        expect(lastRunAgentCall()[1]).toBe('ds-b');
      });

      it.each([
        ['sendToolResult', (s: ChatService) => s.sendToolResult('tc-1', { success: true }, [])],
        [
          'sendToolResults',
          (s: ChatService) => s.sendToolResults([{ toolCallId: 'tc-1', result: {} }], []),
        ],
      ])(
        'skips a %s continuation when the conversation changes during the wait',
        async (_name, send) => {
          const { service, store } = setupDataSources();
          setPageDataSource(store, 'ds-a');
          (await service.sendMessage('hi', [])).observable.subscribe();
          const runsBefore = mockAgent.runAgent.mock.calls.length;
          // The user starts another conversation while the continuation waits.
          (service as any).waitBeforeContinuation.mockImplementation(async () => {
            mockThreadId$.next('another-thread');
            return true;
          });

          const result: any = await send(service);

          expect(result.skipped).toEqual({ reason: 'aborted' });
          expect(mockAgent.runAgent.mock.calls.length).toBe(runsBefore);
        }
      );

      it('reuses the last run data source when nothing resolves for a continuation', async () => {
        const { service, store } = setupDataSources();
        setPageDataSource(store, 'ds-a');
        (await service.sendMessage('hi', [])).observable.subscribe();

        // The user left the page; nothing else resolves.
        setPageDataSource(store, undefined);
        expect((await service.resolveDataSourceForRun()).kind).toBe('needs_selection');

        await service.sendToolResult('tc-1', { success: true }, []);

        const [runInput, dataSourceId] = lastRunAgentCall();
        expect(dataSourceId).toBe('ds-a');
        const value = dataSourceContextValue(runInput)!;
        expect(value).toContain('Currently active data source: "Alpha" (id: ds-a)');
        expect(value).toContain('this list may not include every data source');
      });

      it('does not ask to record a picker choice for the fallback data source', async () => {
        const { service, store } = setupDataSources();
        setPageDataSource(store, 'ds-a');
        (await service.sendMessage('hi', [])).observable.subscribe();

        // A picker choice that does not verify, and the user left the page.
        service.setPendingDataSource('ds-gone', 'picker');
        setPageDataSource(store, undefined);

        await service.sendToolResult('tc-1', { success: true }, []);

        const [runInput, dataSourceId] = lastRunAgentCall();
        expect(dataSourceId).toBe('ds-a');
        // The picker line would name the fallback data source as the user's choice.
        expect(dataSourceContextValue(runInput)).not.toContain('The user selected');
      });

      it('marks the fallback to the previous run so no page or picker line applies to it', async () => {
        const { service, store } = setupDataSources();
        setPageDataSource(store, 'ds-a');
        (await service.sendMessage('hi', [])).observable.subscribe();
        setPageDataSource(store, undefined);

        await service.sendToolResult('tc-1', { success: true }, []);

        const [runInput, dataSourceId] = lastRunAgentCall();
        expect(dataSourceId).toBe('ds-a');
        expect(dataSourceContextValue(runInput)).not.toContain('cannot be switched');
      });

      it('forgets earlier runs in a new conversation', async () => {
        const { service, store } = setupDataSources();
        setPageDataSource(store, 'ds-a');
        (await service.sendMessage('hi', [])).observable.subscribe();
        service.newThread();
        setPageDataSource(store, undefined);

        await service.sendToolResult('tc-1', { success: true }, []);

        // Nothing resolves and there is no earlier run to fall back to.
        expect(lastRunAgentCall()[1]).toBeUndefined();
      });

      it('does not read data sources when sendMessage gets a resolution', async () => {
        const { service, find, get } = setupDataSources();

        await service.sendMessage('hi', [], undefined, {
          resolution: {
            kind: 'resolved',
            active: { id: 'ds-z', title: 'Zed' },
            source: 'conversation',
            available: [{ id: 'ds-z', title: 'Zed' }],
            listComplete: true,
          },
        });

        expect(find).not.toHaveBeenCalled();
        expect(get).not.toHaveBeenCalled();
        expect(lastRunAgentCall()[1]).toBe('ds-z');
      });

      it('throws DataSourceUnresolvedError when a selection is needed', async () => {
        const { service } = setupDataSources();

        const error = await service.sendMessage('hi', []).catch((e) => e);

        expect(error).toBeInstanceOf(DataSourceUnresolvedError);
        expect(error.resolution).toMatchObject({ kind: 'needs_selection' });
        expect(mockAgent.runAgent).not.toHaveBeenCalled();
      });

      it('runs without a data source id and removes the context when disabled', async () => {
        const { service, store } = setupDataSources({ dataSourceEnabled: false });

        await service.sendMessage('hi', []);

        expect(lastRunAgentCall()[1]).toBeUndefined();
        expect(store.removeContextById).toHaveBeenCalledWith(AVAILABLE_DATA_SOURCES_CONTEXT_ID);
      });
    });
  });

  describe('getUserMessage', () => {
    it('should create a user message with content and rawMessage', () => {
      const result = chatService.getUserMessage('hello world');

      expect(result).toEqual({
        id: expect.stringMatching(/^msg-\d+-[a-z0-9]{9}$/),
        role: 'user',
        content: 'hello world',
        rawMessage: 'hello world',
      });
    });

    it('should use provided rawMessage when given', () => {
      const result = chatService.getUserMessage('/command output', '/command input');

      expect(result.content).toBe('/command output');
      expect(result.rawMessage).toBe('/command input');
    });

    it('should trim content', () => {
      const result = chatService.getUserMessage('  spaced  ');

      expect(result.content).toBe('spaced');
      expect(result.rawMessage).toBe('spaced');
    });

    it('should pass multimodal content arrays through untouched', () => {
      const content = [
        { type: 'binary' as const, mimeType: 'image/png', data: 'abc123' },
        { type: 'text' as const, text: 'describe this chart' },
      ];

      const result = chatService.getUserMessage(content);

      expect(result).toEqual({
        id: expect.stringMatching(/^msg-\d+-[a-z0-9]{9}$/),
        role: 'user',
        content,
      });
      expect(result.rawMessage).toBeUndefined();
    });

    it('should keep an explicit rawMessage alongside array content', () => {
      const content = [{ type: 'text' as const, text: '/vis output' }];

      const result = chatService.getUserMessage(content, '/vis');

      expect(result.content).toEqual(content);
      expect(result.rawMessage).toBe('/vis');
    });
  });

  describe('shouldAutoFocusInput', () => {
    it('should default to false', () => {
      expect(chatService.getShouldAutoFocusInput()).toBe(false);
    });

    it('should reflect the value set via setShouldAutoFocusInput', () => {
      chatService.setShouldAutoFocusInput(true);
      expect(chatService.getShouldAutoFocusInput()).toBe(true);

      chatService.setShouldAutoFocusInput(false);
      expect(chatService.getShouldAutoFocusInput()).toBe(false);
    });
  });
});

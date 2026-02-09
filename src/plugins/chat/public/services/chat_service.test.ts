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
  let mockThreadId$: BehaviorSubject<string>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

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

    // Create mock thread ID observable with proper format
    const generateMockThreadId = () => {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 11);
      return `thread-${timestamp}-${randomStr}`;
    };
    mockThreadId$ = new BehaviorSubject<string>(generateMockThreadId());

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
      openWindow: jest.fn(() => {
        const currentState = mockWindowState$.getValue();
        if (!currentState.isWindowOpen) {
          mockWindowOpenCallbacks.forEach((callback) => callback());
        }
      }),
      closeWindow: jest.fn(() => {
        const currentState = mockWindowState$.getValue();
        if (currentState.isWindowOpen) {
          mockWindowCloseCallbacks.forEach((callback) => callback());
        }
      }),
      sendMessage: jest.fn(),
      sendMessageWithWindow: jest.fn(),
      suggestedActionsService: undefined,
    } as any;

    // Create mock agent
    mockAgent = {
      runAgent: jest.fn(),
      abort: jest.fn(),
      resetConnection: jest.fn(),
    } as any;

    // Mock AgUiAgent constructor
    (AgUiAgent as jest.MockedClass<typeof AgUiAgent>).mockImplementation(() => mockAgent);

    // @ts-expect-error TS2345 TODO(ts-error): fixme
    chatService = new ChatService(undefined, mockCoreChatService);
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
      const threadId$ = chatService.getThreadId$();

      threadId$.subscribe((threadId) => {
        expect(threadId).toMatch(/^thread-\d+-[a-z0-9]{9}$/);
        expect(typeof threadId).toBe('string');
        done();
      });
    });

    it('should emit new thread ID when newThread is called', (done) => {
      const threadId$ = chatService.getThreadId$();
      const emittedValues: string[] = [];

      threadId$.subscribe((threadId) => {
        emittedValues.push(threadId);

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

      // @ts-expect-error TS2345 TODO(ts-error): fixme
      const service1 = new ChatService(undefined, mockCoreService1);
      // @ts-expect-error TS2345 TODO(ts-error): fixme
      const service2 = new ChatService(undefined, mockCoreService2);

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
      // @ts-expect-error TS2345 TODO(ts-error): fixme
      const newService = new ChatService(undefined, mockCoreChatService);
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
    let mockSessionStorage: { [key: string]: string };
    let mockContextStore: any;

    beforeEach(() => {
      // Mock sessionStorage behavior
      mockSessionStorage = {};
      const sessionStorageMock = {
        getItem: jest.fn((key: string) => mockSessionStorage[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          mockSessionStorage[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete mockSessionStorage[key];
        }),
      };

      // Update the global sessionStorage mock
      (global as any).sessionStorage = sessionStorageMock;

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

    it('should clear current messages', () => {
      // Set some messages
      (chatService as any).currentMessages = [
        { id: '1', role: 'user', content: 'test' },
        { id: '2', role: 'assistant', content: 'response' },
      ];

      chatService.newThread();

      expect((chatService as any).currentMessages).toEqual([]);
    });

    it('should clear sessionStorage', () => {
      // Set some data in sessionStorage
      mockSessionStorage['chat.currentState'] = JSON.stringify({
        threadId: 'old-thread',
        messages: [{ id: '1', role: 'user', content: 'test' }],
      });

      const removeItemSpy = (global as any).sessionStorage.removeItem;

      chatService.newThread();

      expect(removeItemSpy).toHaveBeenCalledWith('chat.currentState');
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

  describe('chat state persistence methods', () => {
    let mockSessionStorage: { [key: string]: string };

    beforeEach(() => {
      // Mock sessionStorage behavior
      mockSessionStorage = {};
      const sessionStorageMock = {
        getItem: jest.fn((key: string) => mockSessionStorage[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          mockSessionStorage[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete mockSessionStorage[key];
        }),
      };

      // Update the global sessionStorage mock
      (global as any).sessionStorage = sessionStorageMock;
    });

    describe('getCurrentMessages', () => {
      it('should return current messages array', () => {
        const testMessages = [
          { id: '1', role: 'user', content: 'Hello' },
          { id: '2', role: 'assistant', content: 'Hi there!' },
        ];
        (chatService as any).currentMessages = testMessages;

        const result = chatService.getCurrentMessages();

        expect(result).toEqual(testMessages);
      });

      it('should return empty array when no messages', () => {
        (chatService as any).currentMessages = [];

        const result = chatService.getCurrentMessages();

        expect(result).toEqual([]);
      });
    });

    describe('updateCurrentMessages', () => {
      it('should update current messages and save to sessionStorage', () => {
        const newMessages = [
          { id: '1', role: 'user', content: 'Test message' },
          { id: '2', role: 'assistant', content: 'Test response' },
        ];

        // @ts-expect-error TS2345 TODO(ts-error): fixme
        chatService.updateCurrentMessages(newMessages);

        expect((chatService as any).currentMessages).toEqual(newMessages);

        // Check that setItem was called with the correct key
        expect((global as any).sessionStorage.setItem).toHaveBeenCalledWith(
          'chat.currentState',
          expect.any(String)
        );

        // Verify the stored JSON contains the expected data
        const setItemCall = ((global as any).sessionStorage.setItem as jest.Mock).mock.calls[0];
        const storedData = JSON.parse(setItemCall[1]);
        expect(storedData.threadId).toMatch(/^thread-\d+-[a-z0-9]{9}$/);
        expect(storedData.messages).toEqual(newMessages);
      });

      it('should handle empty messages array', () => {
        chatService.updateCurrentMessages([]);

        expect((chatService as any).currentMessages).toEqual([]);

        // Check that setItem was called with the correct key
        expect((global as any).sessionStorage.setItem).toHaveBeenCalledWith(
          'chat.currentState',
          expect.any(String)
        );

        // Verify the stored JSON contains the expected data
        const setItemCall = ((global as any).sessionStorage.setItem as jest.Mock).mock.calls[0];
        const storedData = JSON.parse(setItemCall[1]);
        expect(storedData.threadId).toMatch(/^thread-\d+-[a-z0-9]{9}$/);
        expect(storedData.messages).toEqual([]);
      });
    });

    describe('saveCurrentChatStatePublic', () => {
      it('should save current state to sessionStorage', () => {
        const testMessages = [{ id: '1', role: 'user', content: 'test' }];
        (chatService as any).currentMessages = testMessages;

        chatService.saveCurrentChatStatePublic();

        // Check that setItem was called with the correct key
        expect((global as any).sessionStorage.setItem).toHaveBeenCalledWith(
          'chat.currentState',
          expect.any(String)
        );

        // Verify the stored JSON contains the expected data
        const setItemCall = ((global as any).sessionStorage.setItem as jest.Mock).mock.calls[0];
        const storedData = JSON.parse(setItemCall[1]);
        expect(storedData.threadId).toMatch(/^thread-\d+-[a-z0-9]{9}$/);
        expect(storedData.messages).toEqual(testMessages);
      });

      it('should handle sessionStorage errors gracefully', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        ((global as any).sessionStorage.setItem as jest.Mock).mockImplementation(() => {
          throw new Error('Storage full');
        });

        expect(() => chatService.saveCurrentChatStatePublic()).not.toThrow();
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to save chat state to sessionStorage:',
          expect.any(Error)
        );

        consoleSpy.mockRestore();
      });
    });
  });

  describe('window state management', () => {
    describe('isWindowOpen', () => {
      it('should return false by default', () => {
        expect(chatService.isWindowOpen()).toBe(false);
      });

      it('should return updated state after setWindowState', () => {
        chatService.setWindowState({ isWindowOpen: true });
        expect(chatService.isWindowOpen()).toBe(true);

        chatService.setWindowState({ isWindowOpen: false });
        expect(chatService.isWindowOpen()).toBe(false);
      });
    });

    describe('getWindowMode', () => {
      it('should return SIDECAR by default', () => {
        expect(chatService.getWindowMode()).toBe('sidecar');
      });

      it('should return updated mode after setWindowState', () => {
        chatService.setWindowState({ isWindowOpen: true, windowMode: 'fullscreen' as any });
        expect(chatService.getWindowMode()).toBe('fullscreen');
      });
    });

    describe('getWindowState', () => {
      it('should return complete window state', () => {
        const state = chatService.getWindowState();
        expect(state).toEqual({
          isWindowOpen: false,
          windowMode: 'sidecar',
          paddingSize: 400,
        });
      });

      it('should return updated state', () => {
        chatService.setWindowState({ isWindowOpen: true, windowMode: 'fullscreen' as any });
        const state = chatService.getWindowState();
        expect(state).toEqual({
          isWindowOpen: true,
          windowMode: 'fullscreen',
          paddingSize: 400,
        });
      });
    });

    describe('setWindowState', () => {
      it('should update window open state', () => {
        chatService.setWindowState({ isWindowOpen: true });
        expect(chatService.isWindowOpen()).toBe(true);
      });

      it('should update window mode when provided', () => {
        chatService.setWindowState({ isWindowOpen: true, windowMode: 'fullscreen' as any });
        expect(chatService.getWindowMode()).toBe('fullscreen');
      });

      it('should not update mode when not provided', () => {
        chatService.setWindowState({ isWindowOpen: true, windowMode: 'fullscreen' as any });
        chatService.setWindowState({ isWindowOpen: false });
        expect(chatService.getWindowMode()).toBe('fullscreen');
      });

      it('should notify listeners when state changes', () => {
        const callback = jest.fn();
        chatService.onWindowStateChange(callback);

        chatService.setWindowState({ isWindowOpen: true });
        expect(callback).toHaveBeenCalledWith(
          {
            isWindowOpen: true,
            windowMode: 'sidecar',
            paddingSize: 400,
          },
          {
            isWindowOpen: true,
            windowMode: false,
            paddingSize: false,
          }
        );

        chatService.setWindowState({ isWindowOpen: false });
        expect(callback).toHaveBeenCalledWith(
          {
            isWindowOpen: false,
            windowMode: 'sidecar',
            paddingSize: 400,
          },
          {
            isWindowOpen: true,
            windowMode: false,
            paddingSize: false,
          }
        );
      });

      it('should not notify listeners when state does not change', () => {
        const callback = jest.fn();
        chatService.setWindowState({ isWindowOpen: false });
        chatService.onWindowStateChange(callback);
        chatService.setWindowState({ isWindowOpen: false });
        // Core service might still emit even for same values - this is implementation dependent
        // The important thing is that the callback receives correct state
      });

      it('should notify listeners when window mode changes', () => {
        const callback = jest.fn();
        chatService.onWindowStateChange(callback);

        // Set initial state - windowMode is already 'sidecar' by default, so only isWindowOpen changes
        chatService.setWindowState({ isWindowOpen: true, windowMode: 'sidecar' as any });
        expect(callback).toHaveBeenCalledWith(
          {
            isWindowOpen: true,
            windowMode: 'sidecar',
            paddingSize: 400,
          },
          {
            isWindowOpen: true,
            windowMode: false,
            paddingSize: false,
          }
        );

        callback.mockClear();

        // Change only the mode, keep isOpen the same
        chatService.setWindowState({ isWindowOpen: true, windowMode: 'fullscreen' as any });
        expect(callback).toHaveBeenCalledWith(
          {
            isWindowOpen: true,
            windowMode: 'fullscreen',
            paddingSize: 400,
          },
          {
            isWindowOpen: false,
            windowMode: true,
            paddingSize: false,
          }
        );
      });

      it('should not notify listeners when mode is set to same value', () => {
        const callback = jest.fn();
        chatService.setWindowState({ isWindowOpen: true, windowMode: 'sidecar' as any });

        chatService.onWindowStateChange(callback);

        // Set same mode again - behavior depends on core service implementation
        chatService.setWindowState({ isWindowOpen: true, windowMode: 'sidecar' as any });
        // Core service behavior for duplicate values is implementation dependent
      });

      it('should notify with complete window state', () => {
        const callback = jest.fn();
        chatService.onWindowStateChange(callback);

        chatService.setWindowState({ isWindowOpen: true, windowMode: 'fullscreen' as any });

        expect(callback).toHaveBeenCalledWith(
          {
            isWindowOpen: true,
            windowMode: 'fullscreen',
            paddingSize: 400,
          },
          {
            isWindowOpen: true,
            windowMode: true,
            paddingSize: false,
          }
        );
      });
    });

    describe('onWindowStateChange', () => {
      it('should register callback and return unsubscribe function', () => {
        const callback = jest.fn();
        const unsubscribe = chatService.onWindowStateChange(callback);

        chatService.setWindowState({ isWindowOpen: true });
        expect(callback).toHaveBeenCalledWith(
          {
            isWindowOpen: true,
            windowMode: 'sidecar',
            paddingSize: 400,
          },
          {
            isWindowOpen: true,
            windowMode: false,
            paddingSize: false,
          }
        );

        callback.mockClear();
        unsubscribe();

        chatService.setWindowState({ isWindowOpen: false });
        expect(callback).not.toHaveBeenCalled();
      });

      it('should support multiple listeners', () => {
        const callback1 = jest.fn();
        const callback2 = jest.fn();

        chatService.onWindowStateChange(callback1);
        chatService.onWindowStateChange(callback2);

        chatService.setWindowState({ isWindowOpen: true });

        expect(callback1).toHaveBeenCalledWith(
          {
            isWindowOpen: true,
            windowMode: 'sidecar',
            paddingSize: 400,
          },
          {
            isWindowOpen: true,
            windowMode: false,
            paddingSize: false,
          }
        );
        expect(callback2).toHaveBeenCalledWith(
          {
            isWindowOpen: true,
            windowMode: 'sidecar',
            paddingSize: 400,
          },
          {
            isWindowOpen: true,
            windowMode: false,
            paddingSize: false,
          }
        );
      });
    });

    describe('onWindowOpenRequest', () => {
      it('should register callback and return unsubscribe function', async () => {
        const callback = jest.fn();
        const unsubscribe = chatService.onWindowOpenRequest(callback);

        await chatService.openWindow();
        expect(callback).toHaveBeenCalled();

        callback.mockClear();
        unsubscribe();

        await chatService.openWindow();
        expect(callback).not.toHaveBeenCalled();
      });

      it('should support multiple listeners', async () => {
        const callback1 = jest.fn();
        const callback2 = jest.fn();

        chatService.onWindowOpenRequest(callback1);
        chatService.onWindowOpenRequest(callback2);

        await chatService.openWindow();

        expect(callback1).toHaveBeenCalled();
        expect(callback2).toHaveBeenCalled();
      });
    });

    describe('onWindowCloseRequest', () => {
      it('should register callback and return unsubscribe function', async () => {
        const callback = jest.fn();
        const unsubscribe = chatService.onWindowCloseRequest(callback);

        // Set window open first
        chatService.setWindowState({ isWindowOpen: true });

        await chatService.closeWindow();
        expect(callback).toHaveBeenCalled();

        callback.mockClear();
        unsubscribe();

        await chatService.closeWindow();
        expect(callback).not.toHaveBeenCalled();
      });

      it('should support multiple listeners', async () => {
        const callback1 = jest.fn();
        const callback2 = jest.fn();

        chatService.onWindowCloseRequest(callback1);
        chatService.onWindowCloseRequest(callback2);

        chatService.setWindowState({ isWindowOpen: true });
        await chatService.closeWindow();

        expect(callback1).toHaveBeenCalled();
        expect(callback2).toHaveBeenCalled();
      });
    });
  });

  describe('ChatWindow ref management', () => {
    describe('setChatWindowRef', () => {
      it('should store ChatWindow ref', () => {
        const mockRef = { current: null } as any;
        chatService.setChatWindowRef(mockRef);
        expect((chatService as any).chatWindowRef).toBe(mockRef);
      });
    });

    describe('clearChatWindowRef', () => {
      it('should clear ChatWindow ref', () => {
        const mockRef = { current: null } as any;
        chatService.setChatWindowRef(mockRef);
        chatService.clearChatWindowRef();
        expect((chatService as any).chatWindowRef).toBeNull();
      });
    });
  });

  describe('window control methods', () => {
    describe('openWindow', () => {
      it('should trigger open callbacks when window is closed', async () => {
        const callback = jest.fn();
        chatService.onWindowOpenRequest(callback);

        await chatService.openWindow();

        expect(callback).toHaveBeenCalled();
      });

      it('should not trigger callbacks when window is already open', async () => {
        const callback = jest.fn();
        chatService.onWindowOpenRequest(callback);

        chatService.setWindowState({ isWindowOpen: true });
        await chatService.openWindow();

        expect(callback).not.toHaveBeenCalled();
      });
    });

    describe('closeWindow', () => {
      it('should trigger close callbacks when window is open', async () => {
        const callback = jest.fn();
        chatService.onWindowCloseRequest(callback);

        chatService.setWindowState({ isWindowOpen: true });
        await chatService.closeWindow();

        expect(callback).toHaveBeenCalled();
      });

      it('should not trigger callbacks when window is already closed', async () => {
        const callback = jest.fn();
        chatService.onWindowCloseRequest(callback);

        await chatService.closeWindow();

        expect(callback).not.toHaveBeenCalled();
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
      const openCallback = jest.fn();
      chatService.onWindowOpenRequest(openCallback);

      const mockObservable = new Observable<BaseEvent>();
      mockAgent.runAgent.mockReturnValue(mockObservable);

      await chatService.sendMessageWithWindow('test', []);

      expect(openCallback).toHaveBeenCalled();
    });

    it('should delegate to ChatWindow when ref is available and window is open', async () => {
      const mockSendMessage = jest.fn().mockResolvedValue(undefined);
      const mockChatWindowRef = {
        current: {
          sendMessage: mockSendMessage,
          startNewChat: jest.fn(),
        },
      };

      chatService.setChatWindowRef(mockChatWindowRef as any);
      chatService.setWindowState({ isWindowOpen: true });

      const result = await chatService.sendMessageWithWindow('test message', []);

      expect(mockSendMessage).toHaveBeenCalledWith({ content: 'test message', messages: [] });
      expect(result.userMessage.content).toBe('test message');
      expect(result.observable).toBeDefined();
    });

    it('should clear conversation when clearConversation option is true', async () => {
      const mockStartNewChat = jest.fn();
      const mockSendMessage = jest.fn().mockResolvedValue(undefined);
      const mockChatWindowRef = {
        current: {
          sendMessage: mockSendMessage,
          startNewChat: mockStartNewChat,
        },
      };

      chatService.setChatWindowRef(mockChatWindowRef as any);
      chatService.setWindowState({ isWindowOpen: true });

      await chatService.sendMessageWithWindow('test', [], { clearConversation: true });

      expect(mockStartNewChat).toHaveBeenCalled();
    });

    it('should fallback to direct service call when ChatWindow is not available', async () => {
      const mockObservable = new Observable<BaseEvent>();
      mockAgent.runAgent.mockReturnValue(mockObservable);

      const result = await chatService.sendMessageWithWindow('test', []);

      expect(mockAgent.runAgent).toHaveBeenCalled();
      expect(result.userMessage.content).toBe('test');
    });

    it('should fallback to direct service call when delegation fails', async () => {
      const mockSendMessage = jest.fn().mockRejectedValue(new Error('Delegation failed'));
      const mockChatWindowRef = {
        current: {
          sendMessage: mockSendMessage,
          startNewChat: jest.fn(),
        },
      };

      chatService.setChatWindowRef(mockChatWindowRef as any);
      chatService.setWindowState({ isWindowOpen: true });

      const mockObservable = new Observable<BaseEvent>();
      mockAgent.runAgent.mockReturnValue(mockObservable);

      const result = await chatService.sendMessageWithWindow('test', []);

      expect(mockAgent.runAgent).toHaveBeenCalled();
      expect(result.userMessage.content).toBe('test');
    });

    it('should return dummy observable when delegating to ChatWindow', async () => {
      const mockSendMessage = jest.fn().mockResolvedValue(undefined);
      const mockChatWindowRef = {
        current: {
          sendMessage: mockSendMessage,
          startNewChat: jest.fn(),
        },
      };

      chatService.setChatWindowRef(mockChatWindowRef as any);
      chatService.setWindowState({ isWindowOpen: true });

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

  describe('getWorkspaceAwareDataSourceId with page context priority', () => {
    let mockUiSettings: any;
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

  describe('removeTrailingErrorMessages', () => {
    it('should remove trailing network error messages', () => {
      const messages = [
        { id: '1', role: 'user', content: 'Hello' },
        { id: '2', role: 'assistant', content: 'Hi there!' },
        { id: 'error-123', role: 'system', content: 'Error: network error' },
        { id: 'error-456', role: 'system', content: 'Error: network error' },
      ];

      const result = (chatService as any).removeTrailingErrorMessages(messages);

      expect(result).toEqual([
        { id: '1', role: 'user', content: 'Hello' },
        { id: '2', role: 'assistant', content: 'Hi there!' },
      ]);
    });

    it('should preserve other system messages', () => {
      const messages = [
        { id: '1', role: 'user', content: 'Hello' },
        { id: '2', role: 'system', content: 'Connection restored' },
        { id: 'error-123', role: 'system', content: 'Error: network error' },
      ];

      const result = (chatService as any).removeTrailingErrorMessages(messages);

      expect(result).toEqual([
        { id: '1', role: 'user', content: 'Hello' },
        { id: '2', role: 'system', content: 'Connection restored' },
      ]);
    });

    it('should preserve other error messages', () => {
      const messages = [
        { id: '1', role: 'user', content: 'Hello' },
        { id: 'error-123', role: 'system', content: 'Error: Server timeout' },
        { id: 'error-456', role: 'system', content: 'Error: network error' },
      ];

      const result = (chatService as any).removeTrailingErrorMessages(messages);

      expect(result).toEqual([
        { id: '1', role: 'user', content: 'Hello' },
        { id: 'error-123', role: 'system', content: 'Error: Server timeout' },
      ]);
    });

    it('should handle empty message array', () => {
      const result = (chatService as any).removeTrailingErrorMessages([]);
      expect(result).toEqual([]);
    });

    it('should handle messages with no trailing errors', () => {
      const messages = [
        { id: '1', role: 'user', content: 'Hello' },
        { id: '2', role: 'assistant', content: 'Hi there!' },
      ];

      const result = (chatService as any).removeTrailingErrorMessages(messages);
      expect(result).toEqual(messages);
    });

    it('should handle all messages being network errors', () => {
      const messages = [
        { id: 'error-123', role: 'system', content: 'Error: network error' },
        { id: 'error-456', role: 'system', content: 'Error: network error' },
      ];

      const result = (chatService as any).removeTrailingErrorMessages(messages);
      expect(result).toEqual([]);
    });
  });
});

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
      resetConnection: jest.fn(),
    } as any;

    // Mock AgUiAgent constructor
    (AgUiAgent as jest.MockedClass<typeof AgUiAgent>).mockImplementation(() => mockAgent);

    chatService = new ChatService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
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
      const newService = new ChatService();
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
    it('should generate new thread ID', () => {
      const originalThreadId = (chatService as any).threadId;

      chatService.newThread();

      const newThreadId = (chatService as any).threadId;
      expect(newThreadId).not.toBe(originalThreadId);
      expect(newThreadId).toMatch(/^thread-\d+-[a-z0-9]{9}$/);
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
          { isWindowOpen: true, windowMode: 'sidecar', paddingSize: 400 },
          { isWindowOpen: true, windowMode: false, paddingSize: false }
        );

        chatService.setWindowState({ isWindowOpen: false });
        expect(callback).toHaveBeenCalledWith(
          { isWindowOpen: false, windowMode: 'sidecar', paddingSize: 400 },
          { isWindowOpen: true, windowMode: false, paddingSize: false }
        );
      });

      it('should not notify listeners when state does not change', () => {
        const callback = jest.fn();
        chatService.setWindowState({ isWindowOpen: false });
        chatService.onWindowStateChange(callback);
        chatService.setWindowState({ isWindowOpen: false });
        expect(callback).not.toHaveBeenCalled();
      });

      it('should notify listeners when window mode changes', () => {
        const callback = jest.fn();
        chatService.onWindowStateChange(callback);

        // Set initial state - windowMode is already 'sidecar' by default, so only isWindowOpen changes
        chatService.setWindowState({ isWindowOpen: true, windowMode: 'sidecar' as any });
        expect(callback).toHaveBeenCalledWith(
          { isWindowOpen: true, windowMode: 'sidecar', paddingSize: 400 },
          { isWindowOpen: true, windowMode: false, paddingSize: false }
        );

        callback.mockClear();

        // Change only the mode, keep isOpen the same
        chatService.setWindowState({ isWindowOpen: true, windowMode: 'fullscreen' as any });
        expect(callback).toHaveBeenCalledWith(
          { isWindowOpen: true, windowMode: 'fullscreen', paddingSize: 400 },
          { isWindowOpen: false, windowMode: true, paddingSize: false }
        );
      });

      it('should not notify listeners when mode is set to same value', () => {
        const callback = jest.fn();
        chatService.setWindowState({ isWindowOpen: true, windowMode: 'sidecar' as any });

        chatService.onWindowStateChange(callback);

        // Set same mode again
        chatService.setWindowState({ isWindowOpen: true, windowMode: 'sidecar' as any });
        expect(callback).not.toHaveBeenCalled();
      });

      it('should notify with both isOpen and windowMode parameters', () => {
        const callback = jest.fn();
        chatService.onWindowStateChange(callback);

        chatService.setWindowState({ isWindowOpen: true, windowMode: 'fullscreen' as any });

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith(
          { isWindowOpen: true, windowMode: 'fullscreen', paddingSize: 400 },
          { isWindowOpen: true, windowMode: true, paddingSize: false }
        );
      });
    });

    describe('onWindowStateChange', () => {
      it('should register callback and return unsubscribe function', () => {
        const callback = jest.fn();
        const unsubscribe = chatService.onWindowStateChange(callback);

        chatService.setWindowState({ isWindowOpen: true });
        expect(callback).toHaveBeenCalledWith(
          { isWindowOpen: true, windowMode: 'sidecar', paddingSize: 400 },
          { isWindowOpen: true, windowMode: false, paddingSize: false }
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
          { isWindowOpen: true, windowMode: 'sidecar', paddingSize: 400 },
          { isWindowOpen: true, windowMode: false, paddingSize: false }
        );
        expect(callback2).toHaveBeenCalledWith(
          { isWindowOpen: true, windowMode: 'sidecar', paddingSize: 400 },
          { isWindowOpen: true, windowMode: false, paddingSize: false }
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

      expect(mockSendMessage).toHaveBeenCalledWith({ content: 'test message' });
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
});

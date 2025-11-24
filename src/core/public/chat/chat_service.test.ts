/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { ChatService } from './chat_service';
import { ChatImplementationFunctions, ChatWindowState, UserMessage } from './types';

describe('ChatService', () => {
  let service: ChatService;
  let mockImplementation: ChatImplementationFunctions;
  let mockThreadId$: BehaviorSubject<string>;
  let mockWindowState$: BehaviorSubject<ChatWindowState>;

  beforeEach(() => {
    service = new ChatService();
    mockThreadId$ = new BehaviorSubject<string>('test-thread-id');
    mockWindowState$ = new BehaviorSubject<ChatWindowState>({
      isWindowOpen: false,
      windowMode: 'sidecar',
      paddingSize: 400,
    });

    // Create complete mock implementation
    mockImplementation = {
      sendMessage: jest.fn().mockResolvedValue({
        observable: null,
        userMessage: { id: '1', role: 'user', content: 'test' },
      }),
      sendMessageWithWindow: jest.fn().mockResolvedValue({
        observable: null,
        userMessage: { id: '1', role: 'user', content: 'test' },
      }),
      getThreadId: jest.fn().mockReturnValue('test-thread-id'),
      getThreadId$: jest.fn().mockReturnValue(mockThreadId$.asObservable()),
      isWindowOpen: jest.fn().mockReturnValue(false),
      openWindow: jest.fn().mockResolvedValue(undefined),
      closeWindow: jest.fn().mockResolvedValue(undefined),
      getWindowState: jest.fn().mockReturnValue({
        isWindowOpen: false,
        windowMode: 'sidecar',
        paddingSize: 400,
      }),
      getWindowState$: jest.fn().mockReturnValue(mockWindowState$.asObservable()),
      onWindowOpen: jest.fn().mockReturnValue(() => {}),
      onWindowClose: jest.fn().mockReturnValue(() => {}),
    };
  });

  describe('setup', () => {
    it('returns valid setup contract', () => {
      const setupContract = service.setup();

      expect(setupContract).toEqual({
        setImplementation: expect.any(Function),
        setFallbackImplementation: expect.any(Function),
        setSuggestedActionsService: expect.any(Function),
        suggestedActionsService: undefined,
      });
    });

    it('setImplementation stores the implementation functions', () => {
      const setupContract = service.setup();

      expect(() => setupContract.setImplementation(mockImplementation)).not.toThrow();
    });
  });

  describe('start', () => {
    describe('availability logic', () => {
      it('should be unavailable when no implementation is registered', () => {
        const startContract = service.start();
        expect(startContract.isAvailable()).toBe(false);
      });

      it('should be available after implementation is registered', () => {
        const setupContract = service.setup();
        setupContract.setImplementation(mockImplementation);
        const startContract = service.start();
        expect(startContract.isAvailable()).toBe(true);
      });
    });

    describe('service interface', () => {
      let startContract: any;

      beforeEach(() => {
        startContract = service.start();
      });

      it('provides all required interface methods', () => {
        expect(startContract).toEqual({
          isAvailable: expect.any(Function),
          isWindowOpen: expect.any(Function),
          getThreadId$: expect.any(Function),
          getThreadId: expect.any(Function),
          openWindow: expect.any(Function),
          closeWindow: expect.any(Function),
          sendMessage: expect.any(Function),
          sendMessageWithWindow: expect.any(Function),
          getWindowState: expect.any(Function),
          getWindowState$: expect.any(Function),
          onWindowOpen: expect.any(Function),
          onWindowClose: expect.any(Function),
          suggestedActionsService: undefined,
        });
      });

      describe('window state management', () => {
        beforeEach(() => {
          // Set up implementation for these tests
          const setupContract = service.setup();
          setupContract.setImplementation(mockImplementation);
          startContract = service.start();
        });

        it('should delegate to implementation for window state', () => {
          expect(startContract.isWindowOpen()).toBe(false);
          expect(mockImplementation.isWindowOpen).toHaveBeenCalled();
        });

        it('should delegate window open/close to implementation', async () => {
          await startContract.openWindow();
          expect(mockImplementation.openWindow).toHaveBeenCalled();

          await startContract.closeWindow();
          expect(mockImplementation.closeWindow).toHaveBeenCalled();
        });

        it('should provide window state via implementation', () => {
          const state = startContract.getWindowState();
          expect(mockImplementation.getWindowState).toHaveBeenCalled();
          expect(state).toEqual({
            isWindowOpen: false,
            windowMode: 'sidecar',
            paddingSize: 400,
          });
        });

        it('should provide window state observable via implementation', (done) => {
          const state$ = startContract.getWindowState$();
          expect(mockImplementation.getWindowState$).toHaveBeenCalled();

          state$
            .subscribe((state: any) => {
              expect(state).toEqual({
                isWindowOpen: false,
                windowMode: 'sidecar',
                paddingSize: 400,
              });
              done();
            })
            .unsubscribe();
        });

        it('should delegate window callbacks to implementation', () => {
          const openCallback = jest.fn();
          const closeCallback = jest.fn();

          startContract.onWindowOpen(openCallback);
          startContract.onWindowClose(closeCallback);

          expect(mockImplementation.onWindowOpen).toHaveBeenCalledWith(openCallback);
          expect(mockImplementation.onWindowClose).toHaveBeenCalledWith(closeCallback);
        });
      });

      describe('thread ID management', () => {
        beforeEach(() => {
          // Set up implementation for these tests
          const setupContract = service.setup();
          setupContract.setImplementation(mockImplementation);
          startContract = service.start();
        });

        it('should delegate thread ID to implementation', () => {
          const threadId = startContract.getThreadId();
          expect(mockImplementation.getThreadId).toHaveBeenCalled();
          expect(threadId).toBe('test-thread-id');
        });

        it('should provide thread ID observable via implementation', (done) => {
          const threadId$ = startContract.getThreadId$();
          expect(mockImplementation.getThreadId$).toHaveBeenCalled();

          threadId$
            .subscribe((threadId: string) => {
              expect(threadId).toBe('test-thread-id');
              done();
            })
            .unsubscribe();
        });
      });

      describe('message handling', () => {
        it('should return undefined when no implementation or fallback is set', async () => {
          // Use fresh service without implementation or fallback
          const freshService = new ChatService();
          const freshStartContract = freshService.start();

          // Should return undefined when no implementation or fallback provided
          const result1 = await freshStartContract.sendMessage('test message', []);
          expect(result1).toBeUndefined();

          const result2 = await freshStartContract.sendMessageWithWindow('test message', []);
          expect(result2).toBeUndefined();
        });

        it('should delegate to implementation when set', async () => {
          const setupContract = service.setup();
          setupContract.setImplementation(mockImplementation);
          const serviceWithImpl = service.start();

          const testMessages: UserMessage[] = [
            { id: '1', role: 'user', content: 'previous message' },
          ];

          await serviceWithImpl.sendMessage('test message', testMessages);
          expect(mockImplementation.sendMessage).toHaveBeenCalledWith('test message', testMessages);

          await serviceWithImpl.sendMessageWithWindow('test message with window', testMessages, {
            clearConversation: true,
          });
          expect(mockImplementation.sendMessageWithWindow).toHaveBeenCalledWith(
            'test message with window',
            testMessages,
            {
              clearConversation: true,
            }
          );
        });
      });
    });

    describe('delegation without implementation or fallback', () => {
      it('should return undefined/default values when no implementation or fallback provided', () => {
        const startContract = service.start();

        // All methods should return undefined or default values when neither implementation nor fallback is available
        expect(startContract.getThreadId()).toBeUndefined();
        expect(startContract.getWindowState()).toBeUndefined();
        expect(startContract.isWindowOpen()).toBeUndefined();

        // onWindow methods return functions (unsubscribe callbacks), not undefined
        expect(typeof startContract.onWindowOpen(() => {})).toBe('function');
        expect(typeof startContract.onWindowClose(() => {})).toBe('function');

        // Observable methods should return undefined
        expect(startContract.getThreadId$()).toBeUndefined();
        expect(startContract.getWindowState$()).toBeUndefined();
      });

      it('should return undefined for async operations when no fallback', async () => {
        const startContract = service.start();

        // Message and window operations should return undefined
        const result1 = await startContract.sendMessage('test', []);
        expect(result1).toBeUndefined();

        const result2 = await startContract.sendMessageWithWindow('test', []);
        expect(result2).toBeUndefined();

        const result3 = await startContract.openWindow();
        expect(result3).toBeUndefined();

        const result4 = await startContract.closeWindow();
        expect(result4).toBeUndefined();
      });
    });

    describe('delegation with fallback implementation', () => {
      let fallbackImplementation: ChatImplementationFunctions;

      beforeEach(() => {
        // Create a fallback implementation (simulating plugin-provided fallback)
        fallbackImplementation = {
          sendMessage: jest.fn().mockResolvedValue({
            observable: null,
            userMessage: { id: 'fallback-id', role: 'user', content: 'fallback-content' },
          }),
          sendMessageWithWindow: jest.fn().mockResolvedValue({
            observable: null,
            userMessage: { id: 'fallback-id', role: 'user', content: 'fallback-content' },
          }),
          getThreadId: jest.fn().mockReturnValue('fallback-thread-id'),
          getThreadId$: jest.fn().mockReturnValue(mockThreadId$.asObservable()),
          isWindowOpen: jest.fn().mockReturnValue(false),
          openWindow: jest.fn().mockResolvedValue(undefined),
          closeWindow: jest.fn().mockResolvedValue(undefined),
          getWindowState: jest.fn().mockReturnValue({
            isWindowOpen: false,
            windowMode: 'sidecar',
            paddingSize: 400,
          }),
          getWindowState$: jest.fn().mockReturnValue(mockWindowState$.asObservable()),
          onWindowOpen: jest.fn().mockReturnValue(() => {}),
          onWindowClose: jest.fn().mockReturnValue(() => {}),
        };
      });

      it('should delegate to fallback when no main implementation', () => {
        const setupContract = service.setup();
        setupContract.setFallbackImplementation(fallbackImplementation);
        const startContract = service.start();

        // Should delegate to fallback implementation
        expect(startContract.getThreadId()).toBe('fallback-thread-id');
        expect(fallbackImplementation.getThreadId).toHaveBeenCalled();

        expect(startContract.isWindowOpen()).toBe(false);
        expect(fallbackImplementation.isWindowOpen).toHaveBeenCalled();
      });

      it('should prefer main implementation over fallback', () => {
        const setupContract = service.setup();
        setupContract.setFallbackImplementation(fallbackImplementation);
        setupContract.setImplementation(mockImplementation);
        const startContract = service.start();

        // Should use main implementation, not fallback
        expect(startContract.getThreadId()).toBe('test-thread-id');
        expect(mockImplementation.getThreadId).toHaveBeenCalled();
        expect(fallbackImplementation.getThreadId).not.toHaveBeenCalled();
      });
    });
  });

  describe('stop', () => {
    it('should not throw when called', () => {
      expect(() => service.stop()).not.toThrow();
    });
  });
});

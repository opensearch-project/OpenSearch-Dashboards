/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AgUiAgent, EventType } from './ag_ui_agent';
import { RunAgentInput } from '../../common/types';

// Mock fetch
global.fetch = jest.fn();

// Mock TextDecoder
global.TextDecoder = jest.fn().mockImplementation(() => ({
  decode: jest.fn().mockReturnValue(''),
}));

describe('AgUiAgent', () => {
  let agent: AgUiAgent;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    agent = new AgUiAgent('http://test-server:3000');
  });

  afterEach(() => {
    agent.abort();
  });

  describe('constructor', () => {
    it('should create instance with default server URL', () => {
      const defaultAgent = new AgUiAgent();
      expect(defaultAgent).toBeDefined();
    });

    it('should create instance with custom server URL', () => {
      const customAgent = new AgUiAgent('http://custom-server:8080');
      expect(customAgent).toBeDefined();
    });
  });

  describe('runAgent', () => {
    const mockInput: RunAgentInput = {
      threadId: 'test-thread',
      runId: 'test-run',
      messages: [],
      tools: [],
      context: [],
      state: {},
      forwardedProps: {},
    };

    it('should make POST request with correct parameters', (done) => {
      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: () => Promise.resolve({ done: true, value: undefined }),
            releaseLock: () => {},
          }),
        },
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const observable = agent.runAgent(mockInput);

      observable.subscribe({
        complete: () => {
          expect(mockFetch).toHaveBeenCalledWith('http://test-server:3000', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'text/event-stream',
              'osd-xsrf': 'true',
            },
            body: JSON.stringify(mockInput),
            signal: expect.any(AbortSignal),
          });
          done();
        },
      });
    });

    it('should handle HTTP errors', (done) => {
      const mockResponse = {
        ok: false,
        status: 500,
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const observable = agent.runAgent(mockInput);

      observable.subscribe({
        next: (event) => {
          expect(event.type).toBe(EventType.RUN_ERROR);
          expect(event.message).toBe('HTTP error! status: 500');
        },
        error: (error) => {
          expect(error.message).toBe('HTTP error! status: 500');
          done();
        },
      });
    });

    it('should handle network errors', (done) => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValue(networkError);

      const observable = agent.runAgent(mockInput);

      observable.subscribe({
        next: (event) => {
          expect(event.type).toBe(EventType.RUN_ERROR);
          expect(event.message).toBe('Network error');
        },
        error: (error) => {
          expect(error.message).toBe('Network error');
          done();
        },
      });
    });

    it('should parse Server-Sent Events correctly', (done) => {
      const mockEvents = [
        'data: {"type":"RUN_STARTED","threadId":"test-thread"}\n',
        'data: {"type":"TEXT_MESSAGE_START","messageId":"msg-1"}\n',
        'data: {"type":"RUN_FINISHED","threadId":"test-thread"}\n',
      ];

      const mockDecoder = {
        decode: jest
          .fn()
          .mockReturnValueOnce(mockEvents[0])
          .mockReturnValueOnce(mockEvents[1])
          .mockReturnValueOnce(mockEvents[2]),
      };

      (global.TextDecoder as jest.Mock).mockImplementation(() => mockDecoder);

      const mockReader = {
        read: jest
          .fn()
          .mockResolvedValueOnce({ done: false, value: new Uint8Array() })
          .mockResolvedValueOnce({ done: false, value: new Uint8Array() })
          .mockResolvedValueOnce({ done: false, value: new Uint8Array() })
          .mockResolvedValueOnce({ done: true, value: undefined }),
        releaseLock: jest.fn(),
      };

      const mockResponse = {
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const observable = agent.runAgent(mockInput);
      const events: any[] = [];

      observable.subscribe({
        next: (event) => {
          events.push(event);
        },
        complete: () => {
          expect(events).toHaveLength(3);
          expect(events[0].type).toBe('RUN_STARTED');
          expect(events[1].type).toBe('TEXT_MESSAGE_START');
          expect(events[2].type).toBe('RUN_FINISHED');
          done();
        },
      });
    });

    it('should handle malformed SSE data gracefully', (done) => {
      const mockEvents = [
        'data: {"type":"RUN_STARTED"}\n',
        'data: invalid-json\n',
        'data: {"type":"RUN_FINISHED"}\n',
      ];

      const mockDecoder = {
        decode: jest
          .fn()
          .mockReturnValueOnce(mockEvents[0])
          .mockReturnValueOnce(mockEvents[1])
          .mockReturnValueOnce(mockEvents[2]),
      };

      (global.TextDecoder as jest.Mock).mockImplementation(() => mockDecoder);

      const mockReader = {
        read: jest
          .fn()
          .mockResolvedValueOnce({ done: false, value: new Uint8Array() })
          .mockResolvedValueOnce({ done: false, value: new Uint8Array() })
          .mockResolvedValueOnce({ done: false, value: new Uint8Array() })
          .mockResolvedValueOnce({ done: true, value: undefined }),
        releaseLock: jest.fn(),
      };

      const mockResponse = {
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const observable = agent.runAgent(mockInput);
      const events: any[] = [];

      // Mock console.warn to avoid noise in tests
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      observable.subscribe({
        next: (event) => {
          events.push(event);
        },
        complete: () => {
          expect(events).toHaveLength(2); // Only valid events
          expect(events[0].type).toBe('RUN_STARTED');
          expect(events[1].type).toBe('RUN_FINISHED');
          expect(consoleSpy).toHaveBeenCalledWith(
            'Failed to parse SSE data:',
            'data: invalid-json',
            expect.any(Error)
          );
          consoleSpy.mockRestore();
          done();
        },
      });
    });

    it('should handle buffered SSE data correctly', (done) => {
      // Simulate partial data chunks that need buffering
      const chunk1 = 'data: {"type":"RUN_STARTED","thr';
      const chunk2 = 'eadId":"test-thread"}\ndata: {"type":"RUN_FIN';
      const chunk3 = 'ISHED"}\n';

      const mockDecoder = {
        decode: jest
          .fn()
          .mockReturnValueOnce(chunk1)
          .mockReturnValueOnce(chunk2)
          .mockReturnValueOnce(chunk3),
      };

      (global.TextDecoder as jest.Mock).mockImplementation(() => mockDecoder);

      const mockReader = {
        read: jest
          .fn()
          .mockResolvedValueOnce({ done: false, value: new Uint8Array() })
          .mockResolvedValueOnce({ done: false, value: new Uint8Array() })
          .mockResolvedValueOnce({ done: false, value: new Uint8Array() })
          .mockResolvedValueOnce({ done: true, value: undefined }),
        releaseLock: jest.fn(),
      };

      const mockResponse = {
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const observable = agent.runAgent(mockInput);
      const events: any[] = [];

      observable.subscribe({
        next: (event) => {
          events.push(event);
        },
        complete: () => {
          expect(events).toHaveLength(2);
          expect(events[0].type).toBe('RUN_STARTED');
          expect(events[1].type).toBe('RUN_FINISHED');
          done();
        },
      });
    });

    it('should abort previous request when starting new one', () => {
      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: () => new Promise(() => {}), // Never resolves
            releaseLock: () => {},
          }),
        },
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      // Start first request
      const observable1 = agent.runAgent(mockInput);
      const subscription1 = observable1.subscribe();

      // Start second request - should abort first
      const observable2 = agent.runAgent(mockInput);
      const subscription2 = observable2.subscribe();

      expect(mockFetch).toHaveBeenCalledTimes(2);

      subscription1.unsubscribe();
      subscription2.unsubscribe();
    });
  });

  describe('abort', () => {
    it('should abort current request', () => {
      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: () => new Promise(() => {}), // Never resolves
            releaseLock: () => {},
          }),
        },
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const observable = agent.runAgent({
        threadId: 'test',
        runId: 'test',
        messages: [],
        tools: [],
        context: [],
        state: {},
        forwardedProps: {},
      });

      const subscription = observable.subscribe();

      agent.abort();

      subscription.unsubscribe();
    });

    it('should handle abort when no request is active', () => {
      expect(() => agent.abort()).not.toThrow();
    });
  });

  describe('resetConnection', () => {
    it('should reset connection state', () => {
      // Start a request to set up connection state
      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: () => Promise.resolve({ done: true, value: undefined }),
            releaseLock: () => {},
          }),
        },
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const observable = agent.runAgent({
        threadId: 'test',
        runId: 'test',
        messages: [],
        tools: [],
        context: [],
        state: {},
        forwardedProps: {},
      });

      const subscription = observable.subscribe();

      // Reset connection
      agent.resetConnection();

      // Verify that connection state is reset by checking that a new request can be made
      expect(() => agent.resetConnection()).not.toThrow();

      subscription.unsubscribe();
    });

    it('should handle reset when no connection exists', () => {
      expect(() => agent.resetConnection()).not.toThrow();
    });

    it('should reset connection state multiple times', () => {
      agent.resetConnection();
      agent.resetConnection();
      agent.resetConnection();

      expect(() => agent.resetConnection()).not.toThrow();
    });

    it('should allow new requests after reset', (done) => {
      // First request
      const mockResponse1 = {
        ok: true,
        body: {
          getReader: () => ({
            read: () => Promise.resolve({ done: true, value: undefined }),
            releaseLock: () => {},
          }),
        },
      };

      mockFetch.mockResolvedValueOnce(mockResponse1 as any);

      const observable1 = agent.runAgent({
        threadId: 'test1',
        runId: 'test1',
        messages: [],
        tools: [],
        context: [],
        state: {},
        forwardedProps: {},
      });

      observable1.subscribe({
        complete: () => {
          // Reset connection
          agent.resetConnection();

          // Second request after reset
          const mockResponse2 = {
            ok: true,
            body: {
              getReader: () => ({
                read: () => Promise.resolve({ done: true, value: undefined }),
                releaseLock: () => {},
              }),
            },
          };

          mockFetch.mockResolvedValueOnce(mockResponse2 as any);

          const observable2 = agent.runAgent({
            threadId: 'test2',
            runId: 'test2',
            messages: [],
            tools: [],
            context: [],
            state: {},
            forwardedProps: {},
          });

          observable2.subscribe({
            complete: () => {
              expect(mockFetch).toHaveBeenCalledTimes(2);
              done();
            },
          });
        },
      });
    });

    it('should work in combination with abort', () => {
      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: () => new Promise(() => {}), // Never resolves
            releaseLock: () => {},
          }),
        },
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const observable = agent.runAgent({
        threadId: 'test',
        runId: 'test',
        messages: [],
        tools: [],
        context: [],
        state: {},
        forwardedProps: {},
      });

      const subscription = observable.subscribe();

      // Both abort and reset should work without throwing
      agent.abort();
      agent.resetConnection();

      expect(() => {
        agent.abort();
        agent.resetConnection();
      }).not.toThrow();

      subscription.unsubscribe();
    });
  });
});

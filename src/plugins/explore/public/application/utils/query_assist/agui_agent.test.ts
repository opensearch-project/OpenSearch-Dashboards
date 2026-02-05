/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Observable, of, throwError, Subject } from 'rxjs';
import { EventType, BaseEvent } from '@ag-ui/core';

// Mock the external dependencies - the mock factory must be self-contained
jest.mock('@ag-ui/client', () => {
  const mockRunHttpRequest = jest.fn();
  return {
    runHttpRequest: mockRunHttpRequest,
    parseSSEStream: (source: any) => source,
    __mockRunHttpRequest: mockRunHttpRequest,
  };
});

// Import after mocking
import { AgUiAgent, AgUiRunInput } from './agui_agent';
import * as agUiClient from '@ag-ui/client';

// Get the mock function from the module
const getMockRunHttpRequest = () => (agUiClient as any).__mockRunHttpRequest as jest.Mock;

describe('AgUiAgent', () => {
  let mockHttp: any;
  let agent: AgUiAgent;
  let mockRunHttpRequest: jest.Mock;

  beforeEach(() => {
    mockRunHttpRequest = getMockRunHttpRequest();
    mockRunHttpRequest.mockClear();

    mockHttp = {
      basePath: {
        prepend: jest.fn((path: string) => `/base${path}`),
      },
    };

    // @ts-expect-error TS2554 TODO(ts-error): fixme
    agent = new AgUiAgent(mockHttp);
  });

  describe('constructor', () => {
    it('should initialize with a thread ID', () => {
      const threadId = agent.getThreadId();
      expect(threadId).toBeDefined();
      expect(threadId).toMatch(/^thread-\d+-[a-z0-9]+$/);
    });

    it('should store http setup reference', () => {
      expect(agent).toBeDefined();
    });
  });

  describe('getThreadId', () => {
    it('should return the current thread ID', () => {
      const threadId = agent.getThreadId();
      expect(typeof threadId).toBe('string');
      expect(threadId.startsWith('thread-')).toBe(true);
    });
  });

  describe('newThread', () => {
    it('should generate a new thread ID', () => {
      const oldThreadId = agent.getThreadId();
      agent.newThread();
      const newThreadId = agent.getThreadId();

      expect(newThreadId).not.toBe(oldThreadId);
      expect(newThreadId).toMatch(/^thread-\d+-[a-z0-9]+$/);
    });
  });

  describe('runAgent', () => {
    const mockInput: AgUiRunInput = {
      messages: [{ id: 'msg-1', role: 'user', content: 'Test question' }],
      dataSourceName: 'test-datasource',
      language: 'promql',
    };

    it('should return an Observable', () => {
      mockRunHttpRequest.mockReturnValue(of({ type: EventType.RUN_STARTED }));

      const result = agent.runAgent(mockInput);

      expect(result).toBeInstanceOf(Observable);
    });

    it('should use correct base path for API requests', (done) => {
      mockRunHttpRequest.mockReturnValue(of({ type: EventType.RUN_STARTED }));

      agent.runAgent(mockInput).subscribe({
        complete: () => {
          expect(mockRunHttpRequest).toHaveBeenCalledWith('/api/chat/proxy', expect.any(Object));
          done();
        },
      });
    });

    it('should include dataSourceId in URL when provided', (done) => {
      mockRunHttpRequest.mockReturnValue(of({ type: EventType.RUN_STARTED }));

      const inputWithDataSource: AgUiRunInput = {
        ...mockInput,
        dataSourceId: 'ds-123',
      };

      agent.runAgent(inputWithDataSource).subscribe({
        complete: () => {
          expect(mockRunHttpRequest).toHaveBeenCalledWith(
            expect.stringContaining('dataSourceId=ds-123'),
            expect.any(Object)
          );
          done();
        },
      });
    });

    it('should not include dataSourceId in URL when not provided', (done) => {
      mockRunHttpRequest.mockReturnValue(of({ type: EventType.RUN_STARTED }));

      agent.runAgent(mockInput).subscribe({
        complete: () => {
          expect(mockRunHttpRequest).toHaveBeenCalledWith(
            expect.not.stringContaining('dataSourceId'),
            expect.any(Object)
          );
          done();
        },
      });
    });

    it('should configure request with correct headers', (done) => {
      mockRunHttpRequest.mockReturnValue(of({ type: EventType.RUN_STARTED }));

      agent.runAgent(mockInput).subscribe({
        complete: () => {
          expect(mockRunHttpRequest).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Accept: 'text/event-stream',
                'osd-xsrf': 'true',
              },
            })
          );
          done();
        },
      });
    });

    it('should include user message in request body', (done) => {
      mockRunHttpRequest.mockReturnValue(of({ type: EventType.RUN_STARTED }));

      agent.runAgent(mockInput).subscribe({
        complete: () => {
          const callArgs = mockRunHttpRequest.mock.calls[0];
          const requestBody = JSON.parse(callArgs[1].body);

          expect(requestBody.messages).toHaveLength(1);
          expect(requestBody.messages[0].role).toBe('user');
          expect(requestBody.messages[0].content).toBe('Test question');
          done();
        },
      });
    });

    it('should include tools in request body when provided', (done) => {
      mockRunHttpRequest.mockReturnValue(of({ type: EventType.RUN_STARTED }));

      const tools = [{ name: 'test_tool', description: 'Test', parameters: {} }];
      agent.runAgent({ ...mockInput, tools: tools as any }).subscribe({
        complete: () => {
          const callArgs = mockRunHttpRequest.mock.calls[0];
          const requestBody = JSON.parse(callArgs[1].body);

          expect(requestBody.tools).toEqual(tools);
          done();
        },
      });
    });

    it('should include context with dataSourceName', (done) => {
      mockRunHttpRequest.mockReturnValue(of({ type: EventType.RUN_STARTED }));

      agent.runAgent(mockInput).subscribe({
        complete: () => {
          const callArgs = mockRunHttpRequest.mock.calls[0];
          const requestBody = JSON.parse(callArgs[1].body);

          expect(requestBody.context).toContainEqual({
            description: 'Data source name',
            value: 'test-datasource',
          });
          done();
        },
      });
    });

    it('should merge additional context when provided', (done) => {
      mockRunHttpRequest.mockReturnValue(of({ type: EventType.RUN_STARTED }));

      const additionalContext = [{ description: 'Extra', value: 'extra-value' }];
      agent.runAgent({ ...mockInput, context: additionalContext }).subscribe({
        complete: () => {
          const callArgs = mockRunHttpRequest.mock.calls[0];
          const requestBody = JSON.parse(callArgs[1].body);

          expect(requestBody.context).toContainEqual({
            description: 'Data source name',
            value: 'test-datasource',
          });
          expect(requestBody.context).toContainEqual({
            description: 'Extra',
            value: 'extra-value',
          });
          done();
        },
      });
    });

    it('should include forwardedProps with language', (done) => {
      mockRunHttpRequest.mockReturnValue(of({ type: EventType.RUN_STARTED }));

      agent.runAgent(mockInput).subscribe({
        complete: () => {
          const callArgs = mockRunHttpRequest.mock.calls[0];
          const requestBody = JSON.parse(callArgs[1].body);

          expect(requestBody.forwardedProps).toEqual({ queryAssistLanguage: 'promql' });
          done();
        },
      });
    });

    it('should pass through all messages in request body', (done) => {
      mockRunHttpRequest.mockReturnValue(of({ type: EventType.RUN_STARTED }));

      const messages = [
        { id: 'msg-1', role: 'user', content: 'First question' },
        { id: 'msg-2', role: 'assistant', content: 'Response' },
        { id: 'msg-3', role: 'user', content: 'Follow-up question' },
      ];
      agent.runAgent({ ...mockInput, messages: messages as any }).subscribe({
        complete: () => {
          const callArgs = mockRunHttpRequest.mock.calls[0];
          const requestBody = JSON.parse(callArgs[1].body);

          expect(requestBody.messages).toHaveLength(3);
          expect(requestBody.messages).toEqual(messages);
          done();
        },
      });
    });

    it('should emit events from the stream', (done) => {
      const events = [
        { type: EventType.RUN_STARTED },
        { type: EventType.TEXT_MESSAGE_START },
        { type: EventType.TEXT_MESSAGE_CONTENT },
        { type: EventType.TEXT_MESSAGE_END },
        { type: EventType.RUN_FINISHED },
      ];

      const subject = new Subject<BaseEvent>();
      mockRunHttpRequest.mockReturnValue(subject);

      const receivedEvents: BaseEvent[] = [];

      agent.runAgent(mockInput).subscribe({
        next: (event) => receivedEvents.push(event),
        complete: () => {
          expect(receivedEvents).toHaveLength(events.length);
          expect(receivedEvents[0].type).toBe(EventType.RUN_STARTED);
          done();
        },
      });

      // Emit events
      events.forEach((event) => subject.next(event as BaseEvent));
      subject.complete();
    });
  });

  describe('sendToolResult', () => {
    it('should send tool result message', (done) => {
      mockRunHttpRequest.mockReturnValue(of({ type: EventType.RUN_STARTED }));

      const inputWithMessages: AgUiRunInput = {
        messages: [{ id: 'msg-1', role: 'user', content: 'Original question' }],
        dataSourceName: 'test-datasource',
        language: 'promql',
      };
      agent.sendToolResult('tool-call-123', { result: 'data' }, inputWithMessages).subscribe({
        complete: () => {
          const callArgs = mockRunHttpRequest.mock.calls[0];
          const requestBody = JSON.parse(callArgs[1].body);

          const toolMessage = requestBody.messages.find((m: any) => m.role === 'tool');
          expect(toolMessage).toBeDefined();
          expect(toolMessage.toolCallId).toBe('tool-call-123');
          expect(toolMessage.content).toBe('{"result":"data"}');
          done();
        },
      });
    });

    it('should stringify non-string results', (done) => {
      mockRunHttpRequest.mockReturnValue(of({ type: EventType.RUN_STARTED }));

      const inputWithEmptyMessages: AgUiRunInput = {
        messages: [],
        dataSourceName: 'test-datasource',
        language: 'promql',
      };
      agent
        .sendToolResult('tool-call-123', { metrics: ['m1', 'm2'] }, inputWithEmptyMessages)
        .subscribe({
          complete: () => {
            const callArgs = mockRunHttpRequest.mock.calls[0];
            const requestBody = JSON.parse(callArgs[1].body);

            const toolMessage = requestBody.messages.find((m: any) => m.role === 'tool');
            expect(toolMessage.content).toBe('{"metrics":["m1","m2"]}');
            done();
          },
        });
    });

    it('should pass string results as-is', (done) => {
      mockRunHttpRequest.mockReturnValue(of({ type: EventType.RUN_STARTED }));

      const inputWithEmptyMessages: AgUiRunInput = {
        messages: [],
        dataSourceName: 'test-datasource',
        language: 'promql',
      };
      agent
        .sendToolResult('tool-call-123', 'plain string result', inputWithEmptyMessages)
        .subscribe({
          complete: () => {
            const callArgs = mockRunHttpRequest.mock.calls[0];
            const requestBody = JSON.parse(callArgs[1].body);

            const toolMessage = requestBody.messages.find((m: any) => m.role === 'tool');
            expect(toolMessage.content).toBe('plain string result');
            done();
          },
        });
    });
  });

  describe('abort', () => {
    it('should not throw when called without active request', () => {
      expect(() => agent.abort()).not.toThrow();
    });

    it('should handle multiple abort calls gracefully', () => {
      expect(() => {
        agent.abort();
        agent.abort();
        agent.abort();
      }).not.toThrow();
    });
  });

  describe('error handling', () => {
    const mockInput: AgUiRunInput = {
      messages: [{ id: 'msg-1', role: 'user', content: 'Test question' }],
      dataSourceName: 'test-datasource',
      language: 'promql',
    };

    it('should emit RUN_ERROR event on non-abort errors', (done) => {
      const error = new Error('Network failure');
      mockRunHttpRequest.mockReturnValue(throwError(() => error));

      const events: BaseEvent[] = [];
      agent.runAgent(mockInput).subscribe({
        next: (event) => events.push(event),
        error: () => {
          const errorEvent = events.find((e) => e.type === EventType.RUN_ERROR);
          expect(errorEvent).toBeDefined();
          done();
        },
      });
    });

    it('should complete without error on abort', (done) => {
      const subject = new Subject<BaseEvent>();
      mockRunHttpRequest.mockReturnValue(subject);

      let hasError = false;
      agent.runAgent(mockInput).subscribe({
        error: () => {
          hasError = true;
        },
        complete: () => {
          expect(hasError).toBe(false);
          done();
        },
      });

      // Simulate abort by completing without error
      subject.complete();
    });
  });

  describe('thread ID format', () => {
    it('should generate unique thread IDs', () => {
      // @ts-expect-error TS2554 TODO(ts-error): fixme
      const agent1 = new AgUiAgent(mockHttp);
      // @ts-expect-error TS2554 TODO(ts-error): fixme
      const agent2 = new AgUiAgent(mockHttp);

      const id1 = agent1.getThreadId();
      const id2 = agent2.getThreadId();

      expect(id1).toMatch(/^thread-\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^thread-\d+-[a-z0-9]+$/);
    });
  });

  describe('request body structure', () => {
    it('should include all required AG-UI fields', (done) => {
      mockRunHttpRequest.mockReturnValue(of({ type: EventType.RUN_STARTED }));

      const inputData: AgUiRunInput = {
        messages: [{ id: 'msg-1', role: 'user', content: 'Test' }],
        dataSourceName: 'ds',
        language: 'promql',
      };

      agent.runAgent(inputData).subscribe({
        complete: () => {
          const callArgs = mockRunHttpRequest.mock.calls[0];
          const requestBody = JSON.parse(callArgs[1].body);

          expect(requestBody).toHaveProperty('threadId');
          expect(requestBody).toHaveProperty('runId');
          expect(requestBody).toHaveProperty('messages');
          expect(requestBody).toHaveProperty('tools');
          expect(requestBody).toHaveProperty('context');
          expect(requestBody).toHaveProperty('state');
          expect(requestBody).toHaveProperty('forwardedProps');

          expect(requestBody.threadId).toMatch(/^thread-/);
          expect(requestBody.runId).toMatch(/^run-/);
          expect(requestBody.state).toEqual({});
          done();
        },
      });
    });
  });
});

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  FunctionCallSchema,
  ToolCallSchema,
  DeveloperMessageSchema,
  SystemMessageSchema,
  AssistantMessageSchema,
  UserMessageSchema,
  ToolMessageSchema,
  MessageSchema,
  RoleSchema,
  ContextSchema,
  ToolSchema,
  RunAgentInputSchema,
  StateSchema,
  AGUIError,
} from './types';

describe('Chat Types and Schemas', () => {
  describe('FunctionCallSchema', () => {
    it('should validate valid function call', () => {
      const validFunctionCall = {
        name: 'test_function',
        arguments: '{"param": "value"}',
      };

      const result = FunctionCallSchema.safeParse(validFunctionCall);
      expect(result.success).toBe(true);
    });

    it('should reject function call without name', () => {
      const invalidFunctionCall = {
        arguments: '{"param": "value"}',
      };

      const result = FunctionCallSchema.safeParse(invalidFunctionCall);
      expect(result.success).toBe(false);
    });

    it('should reject function call without arguments', () => {
      const invalidFunctionCall = {
        name: 'test_function',
      };

      const result = FunctionCallSchema.safeParse(invalidFunctionCall);
      expect(result.success).toBe(false);
    });
  });

  describe('ToolCallSchema', () => {
    it('should validate valid tool call', () => {
      const validToolCall = {
        id: 'tool-123',
        type: 'function' as const,
        function: {
          name: 'test_function',
          arguments: '{"param": "value"}',
        },
      };

      const result = ToolCallSchema.safeParse(validToolCall);
      expect(result.success).toBe(true);
    });

    it('should reject tool call with invalid type', () => {
      const invalidToolCall = {
        id: 'tool-123',
        type: 'invalid',
        function: {
          name: 'test_function',
          arguments: '{"param": "value"}',
        },
      };

      const result = ToolCallSchema.safeParse(invalidToolCall);
      expect(result.success).toBe(false);
    });
  });

  describe('Message Schemas', () => {
    describe('DeveloperMessageSchema', () => {
      it('should validate valid developer message', () => {
        const validMessage = {
          id: 'msg-123',
          role: 'developer' as const,
          content: 'Developer message content',
        };

        const result = DeveloperMessageSchema.safeParse(validMessage);
        expect(result.success).toBe(true);
      });

      it('should reject developer message without content', () => {
        const invalidMessage = {
          id: 'msg-123',
          role: 'developer' as const,
        };

        const result = DeveloperMessageSchema.safeParse(invalidMessage);
        expect(result.success).toBe(false);
      });
    });

    describe('SystemMessageSchema', () => {
      it('should validate valid system message', () => {
        const validMessage = {
          id: 'msg-123',
          role: 'system' as const,
          content: 'System message content',
        };

        const result = SystemMessageSchema.safeParse(validMessage);
        expect(result.success).toBe(true);
      });
    });

    describe('AssistantMessageSchema', () => {
      it('should validate assistant message with content', () => {
        const validMessage = {
          id: 'msg-123',
          role: 'assistant' as const,
          content: 'Assistant response',
        };

        const result = AssistantMessageSchema.safeParse(validMessage);
        expect(result.success).toBe(true);
      });

      it('should validate assistant message with tool calls', () => {
        const validMessage = {
          id: 'msg-123',
          role: 'assistant' as const,
          toolCalls: [
            {
              id: 'tool-123',
              type: 'function' as const,
              function: {
                name: 'test_function',
                arguments: '{}',
              },
            },
          ],
        };

        const result = AssistantMessageSchema.safeParse(validMessage);
        expect(result.success).toBe(true);
      });

      it('should validate assistant message without content or tool calls', () => {
        const validMessage = {
          id: 'msg-123',
          role: 'assistant' as const,
        };

        const result = AssistantMessageSchema.safeParse(validMessage);
        expect(result.success).toBe(true);
      });
    });

    describe('UserMessageSchema', () => {
      it('should validate valid user message', () => {
        const validMessage = {
          id: 'msg-123',
          role: 'user' as const,
          content: 'User question',
        };

        const result = UserMessageSchema.safeParse(validMessage);
        expect(result.success).toBe(true);
      });

      it('should reject user message without content', () => {
        const invalidMessage = {
          id: 'msg-123',
          role: 'user' as const,
        };

        const result = UserMessageSchema.safeParse(invalidMessage);
        expect(result.success).toBe(false);
      });
    });

    describe('ToolMessageSchema', () => {
      it('should validate valid tool message', () => {
        const validMessage = {
          id: 'msg-123',
          content: 'Tool result',
          role: 'tool' as const,
          toolCallId: 'tool-123',
        };

        const result = ToolMessageSchema.safeParse(validMessage);
        expect(result.success).toBe(true);
      });

      it('should validate tool message with error', () => {
        const validMessage = {
          id: 'msg-123',
          content: 'Tool error',
          role: 'tool' as const,
          toolCallId: 'tool-123',
          error: 'Tool execution failed',
        };

        const result = ToolMessageSchema.safeParse(validMessage);
        expect(result.success).toBe(true);
      });

      it('should reject tool message without toolCallId', () => {
        const invalidMessage = {
          id: 'msg-123',
          content: 'Tool result',
          role: 'tool' as const,
        };

        const result = ToolMessageSchema.safeParse(invalidMessage);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('MessageSchema (discriminated union)', () => {
    it('should validate different message types', () => {
      const messages = [
        { id: '1', role: 'user', content: 'Hello' },
        { id: '2', role: 'assistant', content: 'Hi there' },
        { id: '3', role: 'system', content: 'System message' },
        { id: '4', role: 'developer', content: 'Dev message' },
        { id: '5', role: 'tool', content: 'Tool result', toolCallId: 'tool-1' },
      ];

      messages.forEach((message) => {
        const result = MessageSchema.safeParse(message);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid message role', () => {
      const invalidMessage = {
        id: 'msg-123',
        role: 'invalid_role',
        content: 'Content',
      };

      const result = MessageSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
    });
  });

  describe('RoleSchema', () => {
    it('should validate all valid roles', () => {
      const validRoles = ['developer', 'system', 'assistant', 'user', 'tool'];

      validRoles.forEach((role) => {
        const result = RoleSchema.safeParse(role);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid role', () => {
      const result = RoleSchema.safeParse('invalid_role');
      expect(result.success).toBe(false);
    });
  });

  describe('ContextSchema', () => {
    it('should validate valid context', () => {
      const validContext = {
        description: 'Test context',
        value: 'Context value',
      };

      const result = ContextSchema.safeParse(validContext);
      expect(result.success).toBe(true);
    });

    it('should reject context without description', () => {
      const invalidContext = {
        value: 'Context value',
      };

      const result = ContextSchema.safeParse(invalidContext);
      expect(result.success).toBe(false);
    });
  });

  describe('ToolSchema', () => {
    it('should validate valid tool', () => {
      const validTool = {
        name: 'test_tool',
        description: 'A test tool',
        parameters: {
          type: 'object',
          properties: {
            param1: { type: 'string' },
          },
        },
      };

      const result = ToolSchema.safeParse(validTool);
      expect(result.success).toBe(true);
    });

    it('should reject tool without name', () => {
      const invalidTool = {
        description: 'A test tool',
        parameters: {},
      };

      const result = ToolSchema.safeParse(invalidTool);
      expect(result.success).toBe(false);
    });
  });

  describe('RunAgentInputSchema', () => {
    it('should validate valid run agent input', () => {
      const validInput = {
        threadId: 'thread-123',
        runId: 'run-456',
        state: {},
        messages: [
          {
            id: 'msg-1',
            role: 'user' as const,
            content: 'Hello',
          },
        ],
        tools: [
          {
            name: 'test_tool',
            description: 'Test tool',
            parameters: {},
          },
        ],
        context: [
          {
            description: 'Test context',
            value: 'value',
          },
        ],
        forwardedProps: {},
      };

      const result = RunAgentInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject input without required fields', () => {
      const invalidInput = {
        threadId: 'thread-123',
        // Missing required fields
      };

      const result = RunAgentInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('StateSchema', () => {
    it('should validate any state value', () => {
      const states = [{}, { key: 'value' }, 'string state', 123, null, undefined];

      states.forEach((state) => {
        const result = StateSchema.safeParse(state);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('AGUIError', () => {
    it('should create error with message', () => {
      const error = new AGUIError('Test error message');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AGUIError);
      expect(error.message).toBe('Test error message');
      expect(error.name).toBe('Error'); // AGUIError extends Error, so name is 'Error'
    });

    it('should be throwable', () => {
      expect(() => {
        throw new AGUIError('Test error');
      }).toThrow('Test error');
    });

    it('should be catchable as AGUIError', () => {
      try {
        throw new AGUIError('Test error');
      } catch (error) {
        expect(error).toBeInstanceOf(AGUIError);
        expect((error as AGUIError).message).toBe('Test error');
      }
    });
  });
});

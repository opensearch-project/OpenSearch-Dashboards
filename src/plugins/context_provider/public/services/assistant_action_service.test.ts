/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AssistantActionService } from './assistant_action_service';
import { AssistantAction } from '../hooks/use_assistant_action';

describe('AssistantActionService', () => {
  let service: AssistantActionService;

  beforeEach(() => {
    // Reset singleton instance before each test
    (AssistantActionService as any).instance = null;
    service = AssistantActionService.getInstance();
  });

  afterEach(() => {
    const state = service.getCurrentState();
    state.actions.clear();
    state.toolCallStates.clear();
  });

  describe('singleton pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = AssistantActionService.getInstance();
      const instance2 = AssistantActionService.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBe(service);
    });

    it('should maintain state across getInstance calls', () => {
      const action: AssistantAction = {
        name: 'test-action',
        description: 'Test action',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
        handler: jest.fn(),
      };

      service.registerAction(action);

      const newInstance = AssistantActionService.getInstance();
      const actions = newInstance.getCurrentState().actions;

      expect(actions.has('test-action')).toBe(true);
    });
  });

  describe('registerAction', () => {
    it('should register a new action', () => {
      const action: AssistantAction = {
        name: 'test-action',
        description: 'Test action',
        parameters: {
          type: 'object',
          properties: { param1: { type: 'string' } },
          required: ['param1'],
        },
        handler: jest.fn(),
      };

      service.registerAction(action);
      const state = service.getCurrentState();

      expect(state.actions.has('test-action')).toBe(true);
      expect(state.actions.get('test-action')).toBe(action);
    });

    it('should update tool definitions when registering action', () => {
      const action: AssistantAction = {
        name: 'test-action',
        description: 'Test action',
        parameters: {
          type: 'object',
          properties: { param1: { type: 'string' } },
          required: ['param1'],
        },
        handler: jest.fn(),
      };

      service.registerAction(action);
      const toolDefinitions = service.getToolDefinitions();

      expect(toolDefinitions).toHaveLength(1);
      expect(toolDefinitions[0]).toEqual({
        name: 'test-action',
        description: 'Test action',
        parameters: {
          type: 'object',
          properties: { param1: { type: 'string' } },
          required: ['param1'],
        },
      });
    });

    it('should replace existing action with same name', () => {
      const action1: AssistantAction = {
        name: 'test-action',
        description: 'First action',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
        handler: jest.fn(),
      };

      const action2: AssistantAction = {
        name: 'test-action',
        description: 'Second action',
        parameters: {
          type: 'object',
          properties: { param1: { type: 'string' } },
          required: ['param1'],
        },
        handler: jest.fn(),
      };

      service.registerAction(action1);
      service.registerAction(action2);

      const state = service.getCurrentState();
      expect(state.actions.size).toBe(1);
      expect(state.actions.get('test-action')).toBe(action2);
    });

    it('should not trigger state update if action has not changed', () => {
      const action: AssistantAction = {
        name: 'test-action',
        description: 'Test action',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
        handler: jest.fn(),
      };

      const subscriber = jest.fn();
      service.getState$().subscribe(subscriber);

      service.registerAction(action);
      const callCount1 = subscriber.mock.calls.length;

      // Register the same action again (no changes)
      service.registerAction({ ...action, handler: jest.fn() }); // Different handler but same metadata
      const callCount2 = subscriber.mock.calls.length;

      expect(callCount2).toBe(callCount1); // Should not update because metadata is the same
    });

    it('should exclude disabled actions from tool definitions', () => {
      const enabledAction: AssistantAction = {
        name: 'enabled-action',
        description: 'Enabled action',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
        available: 'enabled',
        handler: jest.fn(),
      };

      const disabledAction: AssistantAction = {
        name: 'disabled-action',
        description: 'Disabled action',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
        available: 'disabled',
        handler: jest.fn(),
      };

      service.registerAction(enabledAction);
      service.registerAction(disabledAction);

      const toolDefinitions = service.getToolDefinitions();
      expect(toolDefinitions).toHaveLength(1);
      expect(toolDefinitions[0].name).toBe('enabled-action');
    });
  });

  describe('unregisterAction', () => {
    it('should remove action by name', () => {
      const action: AssistantAction = {
        name: 'test-action',
        description: 'Test action',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
        handler: jest.fn(),
      };

      service.registerAction(action);
      expect(service.getCurrentState().actions.has('test-action')).toBe(true);

      service.unregisterAction('test-action');
      expect(service.getCurrentState().actions.has('test-action')).toBe(false);
    });

    it('should update tool definitions when unregistering action', () => {
      const action: AssistantAction = {
        name: 'test-action',
        description: 'Test action',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
        handler: jest.fn(),
      };

      service.registerAction(action);
      expect(service.getToolDefinitions()).toHaveLength(1);

      service.unregisterAction('test-action');
      expect(service.getToolDefinitions()).toHaveLength(0);
    });

    it('should not throw when unregistering non-existent action', () => {
      expect(() => service.unregisterAction('non-existent')).not.toThrow();
    });

    it('should not trigger state update when unregistering non-existent action', () => {
      const subscriber = jest.fn();
      service.getState$().subscribe(subscriber);
      const initialCallCount = subscriber.mock.calls.length;

      service.unregisterAction('non-existent');
      expect(subscriber.mock.calls.length).toBe(initialCallCount);
    });
  });

  describe('executeAction', () => {
    it('should execute action handler with provided arguments', async () => {
      const mockHandler = jest.fn().mockResolvedValue('test-result');
      const action: AssistantAction = {
        name: 'test-action',
        description: 'Test action',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
        handler: mockHandler,
      };

      service.registerAction(action);

      const args = { param1: 'value1' };
      const result = await service.executeAction('test-action', args);

      expect(mockHandler).toHaveBeenCalledWith(args);
      expect(result).toBe('test-result');
    });

    it('should throw error when action does not exist', async () => {
      await expect(service.executeAction('non-existent', {})).rejects.toThrow(
        'Action non-existent not found'
      );
    });

    it('should throw error when action has no handler', async () => {
      const action: AssistantAction = {
        name: 'test-action',
        description: 'Test action',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
        // No handler provided
      };

      service.registerAction(action);

      await expect(service.executeAction('test-action', {})).rejects.toThrow(
        'Action test-action has no handler'
      );
    });

    it('should propagate handler errors', async () => {
      const mockHandler = jest.fn().mockRejectedValue(new Error('Handler error'));
      const action: AssistantAction = {
        name: 'test-action',
        description: 'Test action',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
        handler: mockHandler,
      };

      service.registerAction(action);

      await expect(service.executeAction('test-action', {})).rejects.toThrow('Handler error');
    });
  });

  describe('updateToolCallState', () => {
    it('should create new tool call state', () => {
      service.updateToolCallState('call-1', {
        name: 'test-action',
        status: 'executing',
        args: { param1: 'value1' },
      });

      const state = service.getCurrentState();
      const toolCallState = state.toolCallStates.get('call-1');

      expect(toolCallState).toEqual({
        id: 'call-1',
        name: 'test-action',
        status: 'executing',
        args: { param1: 'value1' },
        timestamp: expect.any(Number),
      });
    });

    it('should update existing tool call state', () => {
      service.updateToolCallState('call-1', {
        name: 'test-action',
        status: 'pending',
      });

      service.updateToolCallState('call-1', {
        status: 'complete',
        result: 'success',
      });

      const state = service.getCurrentState();
      const toolCallState = state.toolCallStates.get('call-1');

      expect(toolCallState).toEqual({
        id: 'call-1',
        name: 'test-action',
        status: 'complete',
        result: 'success',
        timestamp: expect.any(Number),
      });
    });

    it('should notify subscribers when tool call state is updated', () => {
      const subscriber = jest.fn();
      service.getState$().subscribe(subscriber);
      const initialCallCount = subscriber.mock.calls.length;

      service.updateToolCallState('call-1', {
        name: 'test-action',
        status: 'executing',
      });

      expect(subscriber.mock.calls.length).toBe(initialCallCount + 1);
    });
  });

  describe('getActionRenderer', () => {
    it('should return render function for existing action', () => {
      const mockRender = jest.fn();
      const action: AssistantAction = {
        name: 'test-action',
        description: 'Test action',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
        render: mockRender,
      };

      service.registerAction(action);
      const renderer = service.getActionRenderer('test-action');

      expect(renderer).toBe(mockRender);
    });

    it('should return undefined for non-existent action', () => {
      const renderer = service.getActionRenderer('non-existent');
      expect(renderer).toBeUndefined();
    });

    it('should return undefined for action without render function', () => {
      const action: AssistantAction = {
        name: 'test-action',
        description: 'Test action',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
        handler: jest.fn(),
        // No render function
      };

      service.registerAction(action);
      const renderer = service.getActionRenderer('test-action');

      expect(renderer).toBeUndefined();
    });
  });

  describe('getState$ observable', () => {
    it('should emit current state to new subscribers', () => {
      const action: AssistantAction = {
        name: 'test-action',
        description: 'Test action',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
        handler: jest.fn(),
      };

      service.registerAction(action);

      const subscriber = jest.fn();
      service.getState$().subscribe(subscriber);

      expect(subscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          actions: expect.any(Map),
          toolCallStates: expect.any(Map),
          toolDefinitions: expect.any(Array),
        })
      );

      const state = subscriber.mock.calls[0][0];
      expect(state.actions.has('test-action')).toBe(true);
    });

    it('should emit updates when state changes', () => {
      const subscriber = jest.fn();
      service.getState$().subscribe(subscriber);
      const initialCallCount = subscriber.mock.calls.length;

      const action: AssistantAction = {
        name: 'test-action',
        description: 'Test action',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
        handler: jest.fn(),
      };

      service.registerAction(action);

      expect(subscriber.mock.calls.length).toBe(initialCallCount + 1);
    });
  });

  describe('getRegisteredActions', () => {
    it('should return array of registered action names', () => {
      const action1: AssistantAction = {
        name: 'action-1',
        description: 'Action 1',
        parameters: { type: 'object', properties: {}, required: [] },
        handler: jest.fn(),
      };

      const action2: AssistantAction = {
        name: 'action-2',
        description: 'Action 2',
        parameters: { type: 'object', properties: {}, required: [] },
        handler: jest.fn(),
      };

      service.registerAction(action1);
      service.registerAction(action2);

      const actionNames = service.getRegisteredActions();
      expect(actionNames).toEqual(['action-1', 'action-2']);
    });

    it('should return empty array when no actions registered', () => {
      const actionNames = service.getRegisteredActions();
      expect(actionNames).toEqual([]);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle actions with undefined parameters', () => {
      const action: AssistantAction = {
        name: 'test-action',
        description: 'Test action',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
        handler: jest.fn(),
      };

      expect(() => service.registerAction(action)).not.toThrow();
    });

    it('should handle multiple subscribers to state observable', () => {
      const subscriber1 = jest.fn();
      const subscriber2 = jest.fn();

      service.getState$().subscribe(subscriber1);
      service.getState$().subscribe(subscriber2);

      const action: AssistantAction = {
        name: 'test-action',
        description: 'Test action',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
        handler: jest.fn(),
      };

      service.registerAction(action);

      expect(subscriber1).toHaveBeenCalledTimes(2); // Initial + update
      expect(subscriber2).toHaveBeenCalledTimes(2); // Initial + update
    });

    it('should handle tool call state with error', () => {
      const error = new Error('Test error');
      service.updateToolCallState('call-1', {
        name: 'test-action',
        status: 'failed',
        error,
      });

      const state = service.getCurrentState();
      const toolCallState = state.toolCallStates.get('call-1');

      expect(toolCallState?.error).toBe(error);
      expect(toolCallState?.status).toBe('failed');
    });
  });
});

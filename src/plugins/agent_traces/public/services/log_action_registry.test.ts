/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LogActionRegistryService } from './log_action_registry';
import { LogActionDefinition, LogActionContext } from '../types/log_actions';

describe('LogActionRegistryService', () => {
  let registry: LogActionRegistryService;

  const mockContext: LogActionContext = {
    document: { message: 'test message', level: 'error' },
    query: 'test query',
    indexPattern: 'logs-*',
  };

  const createMockAction = (
    id: string,
    order: number = 10,
    isCompatible: (context: LogActionContext) => boolean = () => true
  ): LogActionDefinition => ({
    id,
    displayName: `Action ${id}`,
    iconType: 'gear',
    order,
    isCompatible,
    component: () => null,
  });

  beforeEach(() => {
    registry = new LogActionRegistryService();
  });

  afterEach(() => {
    registry.clear();
  });

  describe('registerAction', () => {
    it('should register a new action', () => {
      const action = createMockAction('action-1');

      registry.registerAction(action);

      expect(registry.getAction('action-1')).toBe(action);
    });

    it('should throw error when registering action with duplicate ID', () => {
      const action1 = createMockAction('action-1');
      const action2 = createMockAction('action-1');

      registry.registerAction(action1);

      expect(() => registry.registerAction(action2)).toThrow(
        'Action with id "action-1" is already registered'
      );
    });

    it('should register multiple actions with different IDs', () => {
      const action1 = createMockAction('action-1');
      const action2 = createMockAction('action-2');
      const action3 = createMockAction('action-3');

      registry.registerAction(action1);
      registry.registerAction(action2);
      registry.registerAction(action3);

      expect(registry.getAllActions()).toHaveLength(3);
      expect(registry.getAction('action-1')).toBe(action1);
      expect(registry.getAction('action-2')).toBe(action2);
      expect(registry.getAction('action-3')).toBe(action3);
    });
  });

  describe('unregisterAction', () => {
    it('should unregister an existing action', () => {
      const action = createMockAction('action-1');

      registry.registerAction(action);
      expect(registry.getAction('action-1')).toBe(action);

      registry.unregisterAction('action-1');
      expect(registry.getAction('action-1')).toBeUndefined();
    });

    it('should not throw error when unregistering non-existent action', () => {
      expect(() => registry.unregisterAction('non-existent')).not.toThrow();
    });

    it('should only unregister the specified action', () => {
      const action1 = createMockAction('action-1');
      const action2 = createMockAction('action-2');

      registry.registerAction(action1);
      registry.registerAction(action2);

      registry.unregisterAction('action-1');

      expect(registry.getAction('action-1')).toBeUndefined();
      expect(registry.getAction('action-2')).toBe(action2);
    });
  });

  describe('getCompatibleActions', () => {
    it('should return empty array when no actions are registered', () => {
      const compatibleActions = registry.getCompatibleActions(mockContext);

      expect(compatibleActions).toEqual([]);
    });

    it('should return only compatible actions', () => {
      const compatibleAction = createMockAction('compatible', 10, () => true);
      const incompatibleAction = createMockAction('incompatible', 20, () => false);

      registry.registerAction(compatibleAction);
      registry.registerAction(incompatibleAction);

      const compatibleActions = registry.getCompatibleActions(mockContext);

      expect(compatibleActions).toHaveLength(1);
      expect(compatibleActions[0]).toBe(compatibleAction);
    });

    it('should sort compatible actions by order property', () => {
      const action1 = createMockAction('action-1', 30);
      const action2 = createMockAction('action-2', 10);
      const action3 = createMockAction('action-3', 20);

      registry.registerAction(action1);
      registry.registerAction(action2);
      registry.registerAction(action3);

      const compatibleActions = registry.getCompatibleActions(mockContext);

      expect(compatibleActions).toHaveLength(3);
      expect(compatibleActions[0].id).toBe('action-2'); // order: 10
      expect(compatibleActions[1].id).toBe('action-3'); // order: 20
      expect(compatibleActions[2].id).toBe('action-1'); // order: 30
    });

    it('should pass correct context to isCompatible function', () => {
      const isCompatibleSpy = jest.fn(() => true);
      const action = createMockAction('action-1', 10, isCompatibleSpy);

      registry.registerAction(action);
      registry.getCompatibleActions(mockContext);

      expect(isCompatibleSpy).toHaveBeenCalledWith(mockContext);
    });

    it('should handle errors in isCompatible gracefully', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const errorThrowingAction = createMockAction('error-action', 10, () => {
        throw new Error('Compatibility check failed');
      });
      const validAction = createMockAction('valid-action', 20);

      registry.registerAction(errorThrowingAction);
      registry.registerAction(validAction);

      const compatibleActions = registry.getCompatibleActions(mockContext);

      expect(compatibleActions).toHaveLength(1);
      expect(compatibleActions[0].id).toBe('valid-action');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Error checking compatibility for action "error-action":',
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });

    it('should return all compatible actions when multiple actions are compatible', () => {
      const action1 = createMockAction('action-1', 10, () => true);
      const action2 = createMockAction('action-2', 20, () => true);
      const action3 = createMockAction('action-3', 30, () => true);

      registry.registerAction(action1);
      registry.registerAction(action2);
      registry.registerAction(action3);

      const compatibleActions = registry.getCompatibleActions(mockContext);

      expect(compatibleActions).toHaveLength(3);
    });
  });

  describe('getAction', () => {
    it('should return action by ID', () => {
      const action = createMockAction('action-1');

      registry.registerAction(action);

      expect(registry.getAction('action-1')).toBe(action);
    });

    it('should return undefined for non-existent action', () => {
      expect(registry.getAction('non-existent')).toBeUndefined();
    });

    it('should return correct action when multiple actions are registered', () => {
      const action1 = createMockAction('action-1');
      const action2 = createMockAction('action-2');
      const action3 = createMockAction('action-3');

      registry.registerAction(action1);
      registry.registerAction(action2);
      registry.registerAction(action3);

      expect(registry.getAction('action-2')).toBe(action2);
    });
  });

  describe('getAllActions', () => {
    it('should return empty array when no actions are registered', () => {
      expect(registry.getAllActions()).toEqual([]);
    });

    it('should return all registered actions', () => {
      const action1 = createMockAction('action-1');
      const action2 = createMockAction('action-2');
      const action3 = createMockAction('action-3');

      registry.registerAction(action1);
      registry.registerAction(action2);
      registry.registerAction(action3);

      const allActions = registry.getAllActions();

      expect(allActions).toHaveLength(3);
      expect(allActions).toContain(action1);
      expect(allActions).toContain(action2);
      expect(allActions).toContain(action3);
    });

    it('should return a new array (not reference to internal map)', () => {
      const action = createMockAction('action-1');

      registry.registerAction(action);

      const allActions1 = registry.getAllActions();
      const allActions2 = registry.getAllActions();

      expect(allActions1).not.toBe(allActions2);
      expect(allActions1).toEqual(allActions2);
    });
  });

  describe('clear', () => {
    it('should remove all registered actions', () => {
      const action1 = createMockAction('action-1');
      const action2 = createMockAction('action-2');
      const action3 = createMockAction('action-3');

      registry.registerAction(action1);
      registry.registerAction(action2);
      registry.registerAction(action3);

      expect(registry.getAllActions()).toHaveLength(3);

      registry.clear();

      expect(registry.getAllActions()).toHaveLength(0);
      expect(registry.getAction('action-1')).toBeUndefined();
      expect(registry.getAction('action-2')).toBeUndefined();
      expect(registry.getAction('action-3')).toBeUndefined();
    });

    it('should not throw error when clearing empty registry', () => {
      expect(() => registry.clear()).not.toThrow();
    });

    it('should allow registering actions after clearing', () => {
      const action1 = createMockAction('action-1');
      const action2 = createMockAction('action-2');

      registry.registerAction(action1);
      registry.clear();
      registry.registerAction(action2);

      expect(registry.getAllActions()).toHaveLength(1);
      expect(registry.getAction('action-2')).toBe(action2);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complex registration and retrieval workflow', () => {
      const action1 = createMockAction('action-1', 30, (ctx) => ctx.document.level === 'error');
      const action2 = createMockAction('action-2', 10, () => true);
      const action3 = createMockAction('action-3', 20, (ctx) => ctx.document.level === 'info');

      registry.registerAction(action1);
      registry.registerAction(action2);
      registry.registerAction(action3);

      const compatibleActions = registry.getCompatibleActions(mockContext);

      // Only action1 (error) and action2 (always true) should be compatible
      expect(compatibleActions).toHaveLength(2);
      // Should be sorted by order
      expect(compatibleActions[0].id).toBe('action-2'); // order: 10
      expect(compatibleActions[1].id).toBe('action-1'); // order: 30
    });

    it('should maintain independent state across multiple contexts', () => {
      const action = createMockAction('action-1', 10, (ctx) => ctx.document.level === 'error');

      registry.registerAction(action);

      const errorContext: LogActionContext = {
        document: { level: 'error' },
      };

      const infoContext: LogActionContext = {
        document: { level: 'info' },
      };

      expect(registry.getCompatibleActions(errorContext)).toHaveLength(1);
      expect(registry.getCompatibleActions(infoContext)).toHaveLength(0);
    });
  });
});

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  QueryPanelActionsRegistryService,
  QueryPanelActionConfig,
  QueryPanelActionDependencies,
} from './query_panel_actions_registry_service';
import { QueryExecutionStatus } from '../../application/utils/state_management/types';

describe('QueryPanelActionsRegistryService', () => {
  let service: QueryPanelActionsRegistryService;

  beforeEach(() => {
    service = new QueryPanelActionsRegistryService();
  });

  describe('constructor', () => {
    it('should create a new service instance with empty registry', () => {
      expect(service).toBeInstanceOf(QueryPanelActionsRegistryService);
      expect(service.isEmpty()).toBe(true);
      expect(service.getSortedActions()).toEqual([]);
    });
  });

  describe('setup', () => {
    it('should return an object with register method', () => {
      const setup = service.setup();

      expect(setup).toHaveProperty('register');
      expect(typeof setup.register).toBe('function');
    });

    describe('register method', () => {
      it('should register a single action config', () => {
        const setup = service.setup();
        const mockAction: QueryPanelActionConfig = {
          id: 'test-action',
          order: 1,
          getLabel: () => 'Test Action',
          onClick: jest.fn(),
        };

        setup.register(mockAction);

        expect(service.isEmpty()).toBe(false);
        const actions = service.getSortedActions();
        expect(actions).toHaveLength(1);
        expect(actions[0]).toEqual(mockAction);
      });

      it('should register multiple action configs from array', () => {
        const setup = service.setup();
        const mockActions: QueryPanelActionConfig[] = [
          {
            id: 'action-1',
            order: 2,
            getLabel: () => 'Action 1',
            onClick: jest.fn(),
          },
          {
            id: 'action-2',
            order: 1,
            getLabel: () => 'Action 2',
            onClick: jest.fn(),
          },
        ];

        setup.register(mockActions);

        expect(service.isEmpty()).toBe(false);
        const actions = service.getSortedActions();
        expect(actions).toHaveLength(2);
        expect(actions[0].id).toBe('action-2'); // Lower order comes first
        expect(actions[1].id).toBe('action-1');
      });
    });
  });

  describe('getSortedActions', () => {
    it('should return empty array when no actions are registered', () => {
      const actions = service.getSortedActions();
      expect(actions).toEqual([]);
    });

    it('should return actions sorted by order (ascending)', () => {
      const setup = service.setup();
      const actions: QueryPanelActionConfig[] = [
        {
          id: 'action-high-order',
          order: 10,
          getLabel: () => 'High Order Action',
          onClick: jest.fn(),
        },
        {
          id: 'action-low-order',
          order: 1,
          getLabel: () => 'Low Order Action',
          onClick: jest.fn(),
        },
        {
          id: 'action-medium-order',
          order: 5,
          getLabel: () => 'Medium Order Action',
          onClick: jest.fn(),
        },
      ];

      setup.register(actions);

      const sortedActions = service.getSortedActions();
      expect(sortedActions).toHaveLength(3);
      expect(sortedActions[0].id).toBe('action-low-order');
      expect(sortedActions[1].id).toBe('action-medium-order');
      expect(sortedActions[2].id).toBe('action-high-order');
    });

    it('should not modify the internal registry when returning sorted actions', () => {
      const setup = service.setup();
      const mockAction: QueryPanelActionConfig = {
        id: 'test-action',
        order: 1,
        getLabel: () => 'Test Action',
        onClick: jest.fn(),
      };

      setup.register(mockAction);

      const actions1 = service.getSortedActions();
      const actions2 = service.getSortedActions();

      expect(actions1).not.toBe(actions2); // Different array instances
      expect(actions1).toEqual(actions2); // Same content
    });
  });

  describe('isEmpty', () => {
    it('should return true when no actions are registered', () => {
      expect(service.isEmpty()).toBe(true);
    });

    it('should return false when actions are registered', () => {
      const setup = service.setup();
      const mockAction: QueryPanelActionConfig = {
        id: 'test-action',
        order: 1,
        getLabel: () => 'Test Action',
        onClick: jest.fn(),
      };

      setup.register(mockAction);

      expect(service.isEmpty()).toBe(false);
    });
  });

  describe('action config validation', () => {
    it('should handle action with all optional properties', () => {
      const setup = service.setup();
      const mockDeps: QueryPanelActionDependencies = {
        query: { query: 'SELECT * FROM table', language: 'sql' },
        resultStatus: { status: QueryExecutionStatus.LOADING },
      };

      const fullAction: QueryPanelActionConfig = {
        id: 'full-action',
        order: 1,
        getIsEnabled: (deps) => deps.resultStatus.status === QueryExecutionStatus.READY,
        getLabel: (deps) => `Label for ${deps.query.language}`,
        getIcon: () => 'icon-test',
        onClick: jest.fn(),
      };

      setup.register(fullAction);

      const actions = service.getSortedActions();
      expect(actions[0]).toEqual(fullAction);

      // Test the optional functions
      expect(fullAction.getIsEnabled!(mockDeps)).toBe(false);
      expect(fullAction.getLabel(mockDeps)).toBe('Label for sql');
      expect(fullAction.getIcon!(mockDeps)).toBe('icon-test');
    });

    it('should call onClick callback when action is clicked', () => {
      const setup = service.setup();
      const mockOnClick = jest.fn();
      const mockDeps: QueryPanelActionDependencies = {
        query: { query: 'source="haha"', language: 'ppl' },
        resultStatus: { status: QueryExecutionStatus.READY },
      };

      const action: QueryPanelActionConfig = {
        id: 'clickable-action',
        order: 1,
        getLabel: () => 'Clickable Action',
        onClick: mockOnClick,
      };

      setup.register(action);
      const actions = service.getSortedActions();

      actions[0].onClick(mockDeps);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
      expect(mockOnClick).toHaveBeenCalledWith(mockDeps);
    });
  });
});

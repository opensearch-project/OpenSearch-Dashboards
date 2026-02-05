/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  QueryPanelActionsRegistryService,
  QueryPanelActionConfig,
  QueryPanelActionDependencies,
  ButtonActionConfig,
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
          actionType: 'button',
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
            actionType: 'button',
            id: 'action-1',
            order: 2,
            getLabel: () => 'Action 1',
            onClick: jest.fn(),
          },
          {
            actionType: 'button',
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
          actionType: 'button',
          id: 'action-high-order',
          order: 10,
          getLabel: () => 'High Order Action',
          onClick: jest.fn(),
        },
        {
          actionType: 'button',
          id: 'action-low-order',
          order: 1,
          getLabel: () => 'Low Order Action',
          onClick: jest.fn(),
        },
        {
          actionType: 'button',
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
        actionType: 'button',
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
        actionType: 'button',
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
        queryInEditor: 'SELECT * FROM table',
      };

      const fullAction: QueryPanelActionConfig = {
        actionType: 'button',
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
        queryInEditor: 'source="haha"',
      };

      const action: QueryPanelActionConfig = {
        actionType: 'button',
        id: 'clickable-action',
        order: 1,
        getLabel: () => 'Clickable Action',
        onClick: mockOnClick,
      };

      setup.register(action);
      const actions = service.getSortedActions();

      // @ts-expect-error TS2339 TODO(ts-error): fixme
      actions[0].onClick(mockDeps);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
      expect(mockOnClick).toHaveBeenCalledWith(mockDeps);
    });
  });

  describe('complex PPL query scenarios', () => {
    describe('special characters and escaping', () => {
      it('should handle query with escaped quotes and special characters', () => {
        const setup = service.setup();
        const mockDeps: QueryPanelActionDependencies = {
          query: {
            query: 'source=logs | where message = "Error: [500] couldn\'t process @user"',
            language: 'PPL',
          },
          resultStatus: { status: QueryExecutionStatus.READY },
          queryInEditor: '| where message = "Error: [500] couldn\'t process @user"',
        };

        const action: QueryPanelActionConfig = {
          actionType: 'button',
          id: 'test-special-chars',
          order: 1,
          getLabel: () => 'Test Action',
          onClick: jest.fn(),
        };

        setup.register(action);
        const actions = service.getSortedActions();
        const buttonAction = actions[0] as ButtonActionConfig;
        buttonAction.onClick(mockDeps);

        expect(buttonAction.onClick).toHaveBeenCalledWith(mockDeps);
      });

      it('should handle query with regex patterns', () => {
        const mockDeps: QueryPanelActionDependencies = {
          query: {
            query: 'source=logs | where message like_regex "\\d{3}-\\d{3}-\\d{4}"',
            language: 'PPL',
          },
          resultStatus: { status: QueryExecutionStatus.READY },
          queryInEditor: '| where message like_regex "\\d{3}-\\d{3}-\\d{4}"',
        };

        const setup = service.setup();
        const action: QueryPanelActionConfig = {
          actionType: 'button',
          id: 'test-regex',
          order: 1,
          getLabel: (deps) => `Regex query: ${deps.queryInEditor.substring(0, 20)}`,
          onClick: jest.fn(),
        };

        setup.register(action);
        expect(action.getLabel(mockDeps)).toContain('Regex query');
      });

      it('should handle query with parse command and capture groups', () => {
        // @ts-expect-error TS6133 TODO(ts-error): fixme
        const mockDeps: QueryPanelActionDependencies = {
          query: {
            query:
              'source=logs | parse message "(?<ip>\\d+\\.\\d+\\.\\d+\\.\\d+).*(?<status>\\d{3})"',
            language: 'PPL',
          },
          resultStatus: { status: QueryExecutionStatus.READY },
          queryInEditor: '| parse message "(?<ip>\\d+\\.\\d+\\.\\d+\\.\\d+).*(?<status>\\d{3})"',
        };

        const setup = service.setup();
        const action: QueryPanelActionConfig = {
          actionType: 'button',
          id: 'test-parse',
          order: 1,
          getLabel: () => 'Parse Action',
          onClick: jest.fn(),
        };

        setup.register(action);
        const actions = service.getSortedActions();
        expect(actions[0].id).toBe('test-parse');
      });

      it('should handle query with backticks and field names with dots', () => {
        // @ts-expect-error TS6133 TODO(ts-error): fixme
        const mockDeps: QueryPanelActionDependencies = {
          query: {
            query: 'source=`index-with-special-chars_@#$` | where `field.with.dots` = "value"',
            language: 'PPL',
          },
          resultStatus: { status: QueryExecutionStatus.READY },
          queryInEditor: '| where `field.with.dots` = "value"',
        };

        const setup = service.setup();
        const action: QueryPanelActionConfig = {
          actionType: 'button',
          id: 'test-backticks',
          order: 1,
          getLabel: () => 'Backtick Query',
          onClick: jest.fn(),
        };

        setup.register(action);
        expect(service.isEmpty()).toBe(false);
      });

      it('should handle query with nested JSON and escaped quotes', () => {
        const mockDeps: QueryPanelActionDependencies = {
          query: {
            query:
              'source=logs | where json_field = "{\\"key\\": \\"value with \\\'quotes\\\'\\nand newlines\\"}"',
            language: 'PPL',
          },
          resultStatus: { status: QueryExecutionStatus.READY },
          queryInEditor:
            '| where json_field = "{\\"key\\": \\"value with \\\'quotes\\\'\\nand newlines\\"}"',
        };

        const setup = service.setup();
        const action: QueryPanelActionConfig = {
          actionType: 'button',
          id: 'test-nested-json',
          order: 1,
          getLabel: () => 'JSON Query',
          onClick: jest.fn(),
        };

        setup.register(action);
        const actions = service.getSortedActions();
        const buttonAction = actions[0] as ButtonActionConfig;
        buttonAction.onClick(mockDeps);

        expect(buttonAction.onClick).toHaveBeenCalledWith(mockDeps);
      });

      it('should handle query with unicode characters', () => {
        // @ts-expect-error TS6133 TODO(ts-error): fixme
        const mockDeps: QueryPanelActionDependencies = {
          query: {
            query: 'source=logs | where message = "Error: फ़ाइल मौजूद नहीं है 🔥"',
            language: 'PPL',
          },
          resultStatus: { status: QueryExecutionStatus.READY },
          queryInEditor: '| where message = "Error: फ़ाइल मौजूद नहीं है 🔥"',
        };

        const setup = service.setup();
        const action: QueryPanelActionConfig = {
          actionType: 'button',
          id: 'test-unicode',
          order: 1,
          getLabel: () => 'Unicode Query',
          onClick: jest.fn(),
        };

        setup.register(action);
        expect(service.getSortedActions()[0].id).toBe('test-unicode');
      });
    });

    describe('query length and complexity', () => {
      it('should handle very long query (>1000 characters)', () => {
        // Construct a realistic long query with multiple conditions
        const longWhereClause = 'field1 = "value1" OR field2 = "value2" OR field3 = "value3" OR '.repeat(
          30
        );
        const longQuery =
          'source=logs | where ' +
          longWhereClause +
          'status = 200 | stats count() by host, status, method, path, user_agent | ' +
          'eval response_time_seconds = response_time / 1000 | ' +
          'where response_time_seconds > 5.0 | ' +
          'sort - count() | ' +
          'head 100';

        const mockDeps: QueryPanelActionDependencies = {
          query: { query: longQuery, language: 'PPL' },
          resultStatus: { status: QueryExecutionStatus.READY },
          queryInEditor: longQuery.replace('source=logs | ', ''),
        };

        expect(longQuery.length).toBeGreaterThan(1000);

        const setup = service.setup();
        const action: QueryPanelActionConfig = {
          actionType: 'button',
          id: 'test-long-query',
          order: 1,
          getLabel: () => 'Long Query Action',
          onClick: jest.fn(),
        };

        setup.register(action);
        const actions = service.getSortedActions();
        const buttonAction = actions[0] as ButtonActionConfig;
        buttonAction.onClick(mockDeps);

        expect(buttonAction.onClick).toHaveBeenCalledWith(mockDeps);
      });

      it('should handle multiline query with pipes', () => {
        const multilineQuery = `source=logs
| where status > 200
| stats count() by host
| sort - count()`;

        // @ts-expect-error TS6133 TODO(ts-error): fixme
        const mockDeps: QueryPanelActionDependencies = {
          query: { query: multilineQuery, language: 'PPL' },
          resultStatus: { status: QueryExecutionStatus.READY },
          queryInEditor: `| where status > 200
| stats count() by host
| sort - count()`,
        };

        const setup = service.setup();
        const action: QueryPanelActionConfig = {
          actionType: 'button',
          id: 'test-multiline',
          order: 1,
          getLabel: () => 'Multiline Query',
          onClick: jest.fn(),
        };

        setup.register(action);
        expect(service.isEmpty()).toBe(false);
      });
    });

    describe('query state variations', () => {
      it('should handle queryInEditor different from executed query', () => {
        // Simulates user editing query after execution
        const mockDeps: QueryPanelActionDependencies = {
          query: {
            query: 'source=logs | where status = 200', // Executed query
            language: 'PPL',
          },
          resultStatus: { status: QueryExecutionStatus.READY },
          queryInEditor: '| where status = 500', // User edited after execution
        };

        const setup = service.setup();
        const action: QueryPanelActionConfig = {
          actionType: 'button',
          id: 'test-query-divergence',
          order: 1,
          getIsEnabled: (deps) => deps.queryInEditor !== deps.query.query,
          getLabel: (deps) =>
            deps.queryInEditor !== deps.query.query ? 'Query changed' : 'Query unchanged',
          onClick: jest.fn(),
        };

        setup.register(action);

        expect(action.getIsEnabled!(mockDeps)).toBe(true);
        expect(action.getLabel(mockDeps)).toBe('Query changed');
      });

      it('should handle ERROR status', () => {
        const mockDeps: QueryPanelActionDependencies = {
          query: { query: 'source=logs | invalid_command', language: 'PPL' },
          resultStatus: {
            status: QueryExecutionStatus.ERROR,
            // @ts-expect-error TS2741 TODO(ts-error): fixme
            error: {
              message: {
                details: 'Unknown command',
                reason: 'Syntax error',
                type: 'parse_error',
              },
              error: 'Bad Request',
              statusCode: 400,
            },
          },
          queryInEditor: '| invalid_command',
        };

        const setup = service.setup();
        const action: QueryPanelActionConfig = {
          actionType: 'button',
          id: 'test-error-status',
          order: 1,
          getIsEnabled: (deps) => deps.resultStatus.status !== QueryExecutionStatus.ERROR,
          getLabel: () => 'Error Action',
          onClick: jest.fn(),
        };

        setup.register(action);

        expect(action.getIsEnabled!(mockDeps)).toBe(false);
      });

      it('should handle NO_RESULTS status', () => {
        const mockDeps: QueryPanelActionDependencies = {
          query: { query: 'source=logs | where status = 999', language: 'PPL' },
          resultStatus: { status: QueryExecutionStatus.NO_RESULTS },
          queryInEditor: '| where status = 999',
        };

        const setup = service.setup();
        const action: QueryPanelActionConfig = {
          actionType: 'button',
          id: 'test-no-results',
          order: 1,
          getLabel: (deps) =>
            deps.resultStatus.status === QueryExecutionStatus.NO_RESULTS
              ? 'No results found'
              : 'Results available',
          onClick: jest.fn(),
        };

        setup.register(action);

        expect(action.getLabel(mockDeps)).toBe('No results found');
      });

      it('should handle empty queryInEditor string', () => {
        const mockDeps: QueryPanelActionDependencies = {
          query: { query: 'source=logs | where status = 200', language: 'PPL' },
          resultStatus: { status: QueryExecutionStatus.READY },
          queryInEditor: '', // Empty editor
        };

        const setup = service.setup();
        const action: QueryPanelActionConfig = {
          actionType: 'button',
          id: 'test-empty-editor',
          order: 1,
          getIsEnabled: (deps) => deps.queryInEditor.length > 0,
          getLabel: () => 'Empty Editor Test',
          onClick: jest.fn(),
        };

        setup.register(action);

        expect(action.getIsEnabled!(mockDeps)).toBe(false);
      });
    });
  });

  describe('flyout action support', () => {
    describe('flyout action registration', () => {
      it('should register a single flyout action', () => {
        const setup = service.setup();
        const mockComponent = jest.fn();
        const flyoutAction: QueryPanelActionConfig = {
          actionType: 'flyout',
          id: 'test-flyout',
          order: 1,
          getLabel: () => 'Test Flyout',
          component: mockComponent,
        };

        setup.register(flyoutAction);

        expect(service.isEmpty()).toBe(false);
        const actions = service.getSortedActions();
        expect(actions).toHaveLength(1);
        expect(actions[0]).toEqual(flyoutAction);
        expect(actions[0].actionType).toBe('flyout');
      });

      it('should register multiple flyout actions', () => {
        const setup = service.setup();
        const mockComponent1 = jest.fn();
        const mockComponent2 = jest.fn();
        const flyoutActions: QueryPanelActionConfig[] = [
          {
            actionType: 'flyout',
            id: 'flyout-1',
            order: 2,
            getLabel: () => 'Flyout 1',
            component: mockComponent1,
          },
          {
            actionType: 'flyout',
            id: 'flyout-2',
            order: 1,
            getLabel: () => 'Flyout 2',
            component: mockComponent2,
          },
        ];

        setup.register(flyoutActions);

        const actions = service.getSortedActions();
        expect(actions).toHaveLength(2);
        expect(actions[0].id).toBe('flyout-2'); // Lower order comes first
        expect(actions[1].id).toBe('flyout-1');
      });

      it('should register mixed button and flyout actions', () => {
        const setup = service.setup();
        const mockComponent = jest.fn();
        const mixedActions: QueryPanelActionConfig[] = [
          {
            actionType: 'button',
            id: 'button-action',
            order: 1,
            getLabel: () => 'Button Action',
            onClick: jest.fn(),
          },
          {
            actionType: 'flyout',
            id: 'flyout-action',
            order: 2,
            getLabel: () => 'Flyout Action',
            component: mockComponent,
          },
        ];

        setup.register(mixedActions);

        const actions = service.getSortedActions();
        expect(actions).toHaveLength(2);
        expect(actions[0].actionType).toBe('button');
        expect(actions[1].actionType).toBe('flyout');
      });
    });

    describe('flyout action validation', () => {
      it('should throw error if flyout action missing component', () => {
        const setup = service.setup();
        const invalidFlyoutAction: any = {
          actionType: 'flyout',
          id: 'invalid-flyout',
          order: 1,
          getLabel: () => 'Invalid Flyout',
          // Missing component
        };

        expect(() => setup.register(invalidFlyoutAction)).toThrow(
          'Flyout action "invalid-flyout" must have component'
        );
      });

      it('should throw error if flyout component is not a function', () => {
        const setup = service.setup();
        const invalidFlyoutAction: any = {
          actionType: 'flyout',
          id: 'invalid-component',
          order: 1,
          getLabel: () => 'Invalid Component',
          component: 'not-a-function',
        };

        expect(() => setup.register(invalidFlyoutAction)).toThrow(
          'Flyout action "invalid-component" component must be a React component'
        );
      });
    });

    describe('flyout action filtering', () => {
      it('should filter and return only button actions', () => {
        const setup = service.setup();
        const mockComponent = jest.fn();
        setup.register([
          {
            actionType: 'button',
            id: 'button-1',
            order: 1,
            getLabel: () => 'Button 1',
            onClick: jest.fn(),
          },
          {
            actionType: 'flyout',
            id: 'flyout-1',
            order: 2,
            getLabel: () => 'Flyout 1',
            component: mockComponent,
          },
          {
            actionType: 'button',
            id: 'button-2',
            order: 3,
            getLabel: () => 'Button 2',
            onClick: jest.fn(),
          },
        ]);

        const buttonActions = service.getButtonActions();
        expect(buttonActions).toHaveLength(2);
        expect(buttonActions.every((action) => action.actionType === 'button')).toBe(true);
        expect(buttonActions[0].id).toBe('button-1');
        expect(buttonActions[1].id).toBe('button-2');
      });

      it('should filter and return only flyout actions', () => {
        const setup = service.setup();
        const mockComponent1 = jest.fn();
        const mockComponent2 = jest.fn();
        setup.register([
          {
            actionType: 'button',
            id: 'button-1',
            order: 1,
            getLabel: () => 'Button 1',
            onClick: jest.fn(),
          },
          {
            actionType: 'flyout',
            id: 'flyout-1',
            order: 2,
            getLabel: () => 'Flyout 1',
            component: mockComponent1,
          },
          {
            actionType: 'flyout',
            id: 'flyout-2',
            order: 3,
            getLabel: () => 'Flyout 2',
            component: mockComponent2,
          },
        ]);

        const flyoutActions = service.getFlyoutActions();
        expect(flyoutActions).toHaveLength(2);
        expect(flyoutActions.every((action) => action.actionType === 'flyout')).toBe(true);
        expect(flyoutActions[0].id).toBe('flyout-1');
        expect(flyoutActions[1].id).toBe('flyout-2');
      });
    });

    describe('flyout action with optional properties', () => {
      it('should handle flyout action with all optional properties', () => {
        const setup = service.setup();
        const mockComponent = jest.fn();
        const mockOnOpen = jest.fn();
        const mockDeps: QueryPanelActionDependencies = {
          query: { query: 'source=logs | where status = 200', language: 'PPL' },
          resultStatus: { status: QueryExecutionStatus.READY },
          queryInEditor: '| where status = 200',
        };

        const fullFlyoutAction: QueryPanelActionConfig = {
          actionType: 'flyout',
          id: 'full-flyout',
          order: 1,
          getIsEnabled: (deps) => deps.resultStatus.status === QueryExecutionStatus.READY,
          getLabel: (deps) => `Flyout for ${deps.query.language}`,
          getIcon: () => 'beaker',
          component: mockComponent,
          // @ts-expect-error TS2353 TODO(ts-error): fixme
          onOpen: mockOnOpen,
        };

        setup.register(fullFlyoutAction);

        const actions = service.getSortedActions();
        expect(actions[0]).toEqual(fullFlyoutAction);

        // Test optional functions
        expect(fullFlyoutAction.getIsEnabled!(mockDeps)).toBe(true);
        expect(fullFlyoutAction.getLabel(mockDeps)).toBe('Flyout for PPL');
        expect(fullFlyoutAction.getIcon!(mockDeps)).toBe('beaker');

        // Test onOpen callback
        // @ts-expect-error TS2339 TODO(ts-error): fixme
        fullFlyoutAction.onOpen!(mockDeps);
        expect(mockOnOpen).toHaveBeenCalledTimes(1);
        expect(mockOnOpen).toHaveBeenCalledWith(mockDeps);
      });

      it('should handle dynamic flyout label based on query context', () => {
        const setup = service.setup();
        const mockComponent = jest.fn();
        const pplDeps: QueryPanelActionDependencies = {
          query: { query: 'source=logs | where status = 200', language: 'PPL' },
          resultStatus: { status: QueryExecutionStatus.READY },
          queryInEditor: '| where status = 200',
        };
        const sqlDeps: QueryPanelActionDependencies = {
          query: { query: 'SELECT * FROM logs', language: 'SQL' },
          resultStatus: { status: QueryExecutionStatus.READY },
          queryInEditor: 'SELECT * FROM logs',
        };

        const dynamicFlyoutAction: QueryPanelActionConfig = {
          actionType: 'flyout',
          id: 'dynamic-flyout',
          order: 1,
          getLabel: (deps) => {
            if (deps.query.language === 'PPL') return 'Create PPL Monitor';
            if (deps.query.language === 'SQL') return 'Create SQL Monitor';
            return 'Create Monitor';
          },
          component: mockComponent,
        };

        setup.register(dynamicFlyoutAction);

        expect(dynamicFlyoutAction.getLabel(pplDeps)).toBe('Create PPL Monitor');
        expect(dynamicFlyoutAction.getLabel(sqlDeps)).toBe('Create SQL Monitor');
      });
    });

    describe('flyout action with PPL queries', () => {
      it('should handle flyout action with complex PPL query', () => {
        const setup = service.setup();
        const mockComponent = jest.fn();
        const mockOnOpen = jest.fn();
        const complexPPLDeps: QueryPanelActionDependencies = {
          query: {
            query:
              'source=logs | where message like_regex "\\d{3}-\\d{3}-\\d{4}" | parse message "(?<ip>\\d+\\.\\d+\\.\\d+\\.\\d+)" | stats count() by ip',
            language: 'PPL',
          },
          resultStatus: { status: QueryExecutionStatus.READY },
          queryInEditor:
            '| where message like_regex "\\d{3}-\\d{3}-\\d{4}" | parse message "(?<ip>\\d+\\.\\d+\\.\\d+\\.\\d+)" | stats count() by ip',
        };

        const flyoutAction: QueryPanelActionConfig = {
          actionType: 'flyout',
          id: 'complex-ppl-flyout',
          order: 1,
          getLabel: () => 'Analyze Complex Query',
          getIsEnabled: (deps) => deps.queryInEditor.includes('parse'),
          component: mockComponent,
          // @ts-expect-error TS2353 TODO(ts-error): fixme
          onOpen: mockOnOpen,
        };

        setup.register(flyoutAction);

        // Test that flyout action is enabled for queries with parse command
        expect(flyoutAction.getIsEnabled!(complexPPLDeps)).toBe(true);

        // Test onOpen receives correct dependencies
        // @ts-expect-error TS2339 TODO(ts-error): fixme
        flyoutAction.onOpen!(complexPPLDeps);
        expect(mockOnOpen).toHaveBeenCalledWith(complexPPLDeps);
        expect(mockOnOpen.mock.calls[0][0].queryInEditor).toContain('parse');
      });

      it('should handle flyout action with very long query', () => {
        const setup = service.setup();
        const mockComponent = jest.fn();
        const longWhereClause = 'field1 = "value1" OR field2 = "value2" OR field3 = "value3" OR '.repeat(
          30
        );
        const longQuery =
          'source=logs | where ' +
          longWhereClause +
          'status = 200 | stats count() by host, status, method, path, user_agent';

        const longQueryDeps: QueryPanelActionDependencies = {
          query: { query: longQuery, language: 'PPL' },
          resultStatus: { status: QueryExecutionStatus.READY },
          queryInEditor: longQuery.replace('source=logs | ', ''),
        };

        expect(longQuery.length).toBeGreaterThan(1000);

        const flyoutAction: QueryPanelActionConfig = {
          actionType: 'flyout',
          id: 'long-query-flyout',
          order: 1,
          getLabel: () => 'Export Query Results',
          component: mockComponent,
        };

        setup.register(flyoutAction);
        const actions = service.getSortedActions();

        // Verify flyout action handles long queries correctly
        expect(actions[0].getLabel(longQueryDeps)).toBe('Export Query Results');
        expect(longQueryDeps.queryInEditor.length).toBeGreaterThan(900);
      });
    });

    describe('flyout action getAction method', () => {
      it('should retrieve specific flyout action by id', () => {
        const setup = service.setup();
        const mockComponent = jest.fn();
        const flyoutAction: QueryPanelActionConfig = {
          actionType: 'flyout',
          id: 'specific-flyout',
          order: 1,
          getLabel: () => 'Specific Flyout',
          component: mockComponent,
        };

        setup.register(flyoutAction);

        const retrievedAction = service.getAction('specific-flyout');
        expect(retrievedAction).toBeDefined();
        expect(retrievedAction?.actionType).toBe('flyout');
        expect(retrievedAction?.id).toBe('specific-flyout');
      });

      it('should return undefined for non-existent flyout action', () => {
        const retrievedAction = service.getAction('non-existent-flyout');
        expect(retrievedAction).toBeUndefined();
      });
    });
  });
});

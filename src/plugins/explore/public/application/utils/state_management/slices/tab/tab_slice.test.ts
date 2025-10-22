/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  setTabState,
  setPatternsField,
  setUsingRegexPatterns,
  tabReducer,
  TabState,
  resetEphemeralLogsState,
  setExpandedRowState,
  setSelectedRowState,
  clearExpandedRowsState,
  clearSelectedRowsState,
  setVisibleColumnNames,
  moveVisibleColumnName,
  setDefaultColumnNames,
} from './tab_slice';

describe('tabSlice reducers', () => {
  const initialState: TabState = {
    logs: {
      expandedRowsMap: {},
      selectedRowsMap: {},
      visibleColumnNames: ['a', 'b', 'c'],
      defaultColumnNames: ['a', 'b', 'c'],
    },
    patterns: { patternsField: undefined, usingRegexPatterns: false },
  };

  describe('setTabState', () => {
    it('should replace the entire state', () => {
      const newState: TabState = {
        logs: {
          expandedRowsMap: { row1: true },
          selectedRowsMap: { row2: true },
          visibleColumnNames: [],
          defaultColumnNames: [],
        },
        patterns: {
          patternsField: 'message',
          usingRegexPatterns: true,
        },
      };

      const state = tabReducer(initialState, setTabState(newState));
      expect(state).toEqual(newState);
    });

    it('should handle different tab state configurations', () => {
      const newState: TabState = {
        logs: {
          expandedRowsMap: {},
          selectedRowsMap: {},
          visibleColumnNames: [],
          defaultColumnNames: [],
        },
        patterns: {
          patternsField: 'level',
          usingRegexPatterns: false,
        },
      };

      const state = tabReducer(initialState, setTabState(newState));
      expect(state).toEqual(newState);
    });
  });

  describe('setPatternsField', () => {
    it('should set the patterns field', () => {
      const state = tabReducer(initialState, setPatternsField('message'));
      expect(state.patterns.patternsField).toBe('message');
      expect(state.patterns.usingRegexPatterns).toBe(false); // should not change
      expect(state.logs).toEqual(initialState.logs); // should not change
    });

    it('should update patterns field when already set', () => {
      const stateWithField = {
        ...initialState,
        patterns: { patternsField: 'oldField', usingRegexPatterns: true },
      };

      const state = tabReducer(stateWithField, setPatternsField('newField'));
      expect(state.patterns.patternsField).toBe('newField');
      expect(state.patterns.usingRegexPatterns).toBe(true); // should remain unchanged
    });
  });

  describe('setUsingRegexPatterns', () => {
    it('should set the using regex patterns flag to true', () => {
      const state = tabReducer(initialState, setUsingRegexPatterns(true));
      expect(state.patterns.usingRegexPatterns).toBe(true);
      expect(state.patterns.patternsField).toBeUndefined(); // should not change
      expect(state.logs).toEqual(initialState.logs); // should not change
    });

    it('should set the using regex patterns flag to false', () => {
      const stateWithRegex = {
        ...initialState,
        patterns: { patternsField: 'message', usingRegexPatterns: true },
      };

      const state = tabReducer(stateWithRegex, setUsingRegexPatterns(false));
      expect(state.patterns.usingRegexPatterns).toBe(false);
      expect(state.patterns.patternsField).toBe('message'); // should remain unchanged
    });
  });

  describe('resetEphemeralLogsState', () => {
    it('should reset logs state to initial state for ephemeral state', () => {
      const stateWithLogs = {
        ...initialState,
        logs: {
          expandedRowsMap: { row1: true, row2: true },
          selectedRowsMap: { row3: true },
          visibleColumnNames: ['a', 'b', 'c', 'd'],
          defaultColumnNames: ['a', 'b', 'c'],
        },
      };

      const state = tabReducer(stateWithLogs, resetEphemeralLogsState());
      expect(state.logs).toEqual({
        expandedRowsMap: {},
        selectedRowsMap: {},
        visibleColumnNames: ['a', 'b', 'c', 'd'],
        defaultColumnNames: ['a', 'b', 'c'],
      });
      expect(state.patterns).toEqual(initialState.patterns); // should not change
    });
  });

  describe('setExpandedRowState', () => {
    it('should add expanded row when state is true', () => {
      const state = tabReducer(initialState, setExpandedRowState({ id: 'row1', state: true }));
      expect(state.logs.expandedRowsMap).toEqual({ row1: true });
      expect(state.logs.selectedRowsMap).toEqual({}); // should not change
    });

    it('should remove expanded row when state is false', () => {
      const stateWithExpanded = {
        ...initialState,
        logs: {
          expandedRowsMap: { row1: true, row2: true },
          selectedRowsMap: {},
          visibleColumnNames: ['a', 'b', 'c'],
          defaultColumnNames: ['a', 'b', 'c'],
        },
      };

      const state = tabReducer(
        stateWithExpanded,
        setExpandedRowState({ id: 'row1', state: false })
      );
      expect(state.logs.expandedRowsMap).toEqual({ row2: true });
    });

    it('should remove expanded row when state is false but didnt exist', () => {
      const stateWithExpanded = {
        ...initialState,
        logs: {
          expandedRowsMap: { row1: true, row2: true },
          selectedRowsMap: {},
          visibleColumnNames: [],
          defaultColumnNames: ['a', 'b', 'c'],
        },
      };

      const state = tabReducer(
        stateWithExpanded,
        setExpandedRowState({ id: 'row3', state: false })
      );
      expect(state.logs.expandedRowsMap).toEqual({ row1: true, row2: true });
    });

    it('should handle multiple expanded rows', () => {
      let state = tabReducer(initialState, setExpandedRowState({ id: 'row1', state: true }));
      state = tabReducer(state, setExpandedRowState({ id: 'row2', state: true }));

      expect(state.logs.expandedRowsMap).toEqual({ row1: true, row2: true });
    });
  });

  describe('setSelectedRowState', () => {
    it('should add selected row when state is true', () => {
      const state = tabReducer(initialState, setSelectedRowState({ id: 'row1', state: true }));
      expect(state.logs.selectedRowsMap).toEqual({ row1: true });
      expect(state.logs.expandedRowsMap).toEqual({}); // should not change
    });

    it('should remove selected row when state is false', () => {
      const stateWithSelected = {
        ...initialState,
        logs: {
          expandedRowsMap: {},
          selectedRowsMap: { row1: true, row2: true },
          visibleColumnNames: [],
          defaultColumnNames: ['a', 'b', 'c'],
        },
      };

      const state = tabReducer(
        stateWithSelected,
        setSelectedRowState({ id: 'row1', state: false })
      );
      expect(state.logs.selectedRowsMap).toEqual({ row2: true });
    });

    it('should handle multiple selected rows', () => {
      let state = tabReducer(initialState, setSelectedRowState({ id: 'row1', state: true }));
      state = tabReducer(state, setSelectedRowState({ id: 'row2', state: true }));

      expect(state.logs.selectedRowsMap).toEqual({ row1: true, row2: true });
    });
  });

  describe('clearExpandedRowsState', () => {
    it('should clear all expanded rows', () => {
      const stateWithExpanded = {
        ...initialState,
        logs: {
          expandedRowsMap: { row1: true, row2: true, row3: true },
          selectedRowsMap: { row4: true },
          visibleColumnNames: [],
          defaultColumnNames: ['a', 'b', 'c'],
        },
      };

      const state = tabReducer(stateWithExpanded, clearExpandedRowsState());
      expect(state.logs.expandedRowsMap).toEqual({});
      expect(state.logs.selectedRowsMap).toEqual({ row4: true }); // should not change
    });

    it('should handle clearing empty expanded rows', () => {
      const state = tabReducer(initialState, clearExpandedRowsState());
      expect(state.logs.expandedRowsMap).toEqual({});
    });
  });

  describe('clearSelectedRowsState', () => {
    it('should clear all selected rows', () => {
      const stateWithSelected = {
        ...initialState,
        logs: {
          expandedRowsMap: { row1: true },
          selectedRowsMap: { row2: true, row3: true, row4: true },
          visibleColumnNames: [],
          defaultColumnNames: ['a', 'b', 'c'],
        },
      };

      const state = tabReducer(stateWithSelected, clearSelectedRowsState());
      expect(state.logs.selectedRowsMap).toEqual({});
      expect(state.logs.expandedRowsMap).toEqual({ row1: true }); // should not change
    });

    it('should handle clearing empty selected rows', () => {
      const state = tabReducer(initialState, clearSelectedRowsState());
      expect(state.logs.selectedRowsMap).toEqual({});
    });
  });

  describe('log columns', () => {
    it('setVisibleColumnNames sets columns', () => {
      const state = tabReducer(initialState, setVisibleColumnNames(['x', 'y']));
      expect(state.logs.visibleColumnNames).toEqual(['x', 'y']);
    });

    it('moveVisibleColumnName moves a column to the specified destination', () => {
      const state = tabReducer(
        initialState,
        moveVisibleColumnName({ columnName: 'a', destination: 2 })
      );
      expect(state.logs.visibleColumnNames).toEqual(['b', 'c', 'a']);
    });

    it('moveVisibleColumnName does nothing if column not found', () => {
      const state = tabReducer(
        initialState,
        moveVisibleColumnName({ columnName: 'z', destination: 1 })
      );
      expect(state.logs.visibleColumnNames).toEqual(initialState.logs.visibleColumnNames);
    });

    it('moveVisibleColumnName does nothing if destination is out of bounds', () => {
      const state = tabReducer(
        initialState,
        moveVisibleColumnName({ columnName: 'a', destination: 10 })
      );
      expect(state.logs.visibleColumnNames).toEqual(initialState.logs.visibleColumnNames);
    });

    it('setDefaultColumnNames sets columns', () => {
      const state = tabReducer(initialState, setDefaultColumnNames(['x', 'y']));
      expect(state.logs.defaultColumnNames).toEqual(['x', 'y']);
    });
  });
});

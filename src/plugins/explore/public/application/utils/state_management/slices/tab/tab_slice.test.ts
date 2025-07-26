/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  setAxesMapping,
  setChartType,
  setStyleOptions,
  setTabState,
  tabReducer,
  TabState,
} from './tab_slice';
import { ColorSchemas } from '../../../../../components/visualizations/types';

describe('tabSlice reducers', () => {
  const initialState: TabState = {
    logs: {},
    visualizations: {
      chartType: undefined,
      styleOptions: {
        colorSchema: ColorSchemas.BLUES,
        fontSize: 60,
        showTitle: true,
        title: '',
        useColor: false,
      },
      axesMapping: {},
    },
    patterns: { patterns_field: undefined },
  };

  it('should return the initial state', () => {
    // @ts-ignore - passing undefined action
    expect(tabReducer(undefined, {})).toEqual(initialState);
  });

  describe('setTabState', () => {
    it('should replace the entire state', () => {
      const newState: TabState = {
        logs: { someProperty: 'value' },
        visualizations: {
          chartType: 'bar',
          styleOptions: { addTooltip: false } as any,
          axesMapping: {},
        },
        patterns: {
          patterns_field: 'message',
        },
      };

      const state = tabReducer(initialState, setTabState(newState));
      expect(state).toEqual(newState);
    });

    it('should handle different tab state configurations', () => {
      const newState: TabState = {
        logs: {},
        visualizations: {
          chartType: 'pie',
          styleOptions: undefined,
          axesMapping: {},
        },
        patterns: {
          patterns_field: 'message',
        },
      };

      const state = tabReducer(initialState, setTabState(newState));
      expect(state).toEqual(newState);
    });
  });

  describe('setStyleOptions', () => {
    it('should update the style options for visualizations', () => {
      const newStyleOptions = {
        addTooltip: true,
        addLegend: true,
      } as any; // Using 'as any' to simplify the test

      const newState = tabReducer(initialState, setStyleOptions(newStyleOptions));
      expect(newState.visualizations.styleOptions).toEqual(newStyleOptions);

      // Other state properties should remain unchanged
      expect(newState.logs).toEqual(initialState.logs);
      expect(newState.visualizations.chartType).toBe(initialState.visualizations.chartType);
    });

    it('should handle different style option configurations', () => {
      const styleOptions = { showLine: true, lineWidth: 3 } as any;
      const newState = tabReducer(initialState, setStyleOptions(styleOptions));
      expect(newState.visualizations.styleOptions).toEqual(styleOptions);
    });
  });

  describe('setChartType', () => {
    it('should update the chart type for visualizations', () => {
      const newChartType = 'bar';

      const newState = tabReducer(initialState, setChartType(newChartType));
      expect(newState.visualizations.chartType).toBe(newChartType);

      // Other state properties should remain unchanged
      expect(newState.logs).toEqual(initialState.logs);
      expect(newState.visualizations.styleOptions).toBe(initialState.visualizations.styleOptions);
    });

    it('should handle different chart types', () => {
      const chartTypes = ['line', 'bar', 'area', 'pie', 'scatter', 'heatmap'] as const;

      chartTypes.forEach((chartType) => {
        const action = setChartType(chartType as any);
        const newState = tabReducer(initialState, action);
        expect(newState.visualizations.chartType).toBe(chartType);
      });
    });
  });

  describe('setAxesMapping', () => {
    it('should update the axes mapping for visualizations', () => {
      const newAxesMapping = {
        x: 'timestamp',
        y: 'value',
        series: 'category',
      };

      const newState = tabReducer(initialState, setAxesMapping(newAxesMapping));
      expect(newState.visualizations.axesMapping).toEqual(newAxesMapping);

      // Other state properties should remain unchanged
      expect(newState.logs).toEqual(initialState.logs);
      expect(newState.visualizations.chartType).toBe(initialState.visualizations.chartType);
      expect(newState.visualizations.styleOptions).toBe(initialState.visualizations.styleOptions);
    });

    it('should handle undefined axes mapping', () => {
      const newState = tabReducer(initialState, setAxesMapping(undefined));
      expect(newState.visualizations.axesMapping).toBeUndefined();
    });

    it('should handle partial axes mapping', () => {
      const partialMapping = { x: 'date' };
      const newState = tabReducer(initialState, setAxesMapping(partialMapping));
      expect(newState.visualizations.axesMapping).toEqual(partialMapping);
    });
  });

  describe('multiple actions in sequence', () => {
    it('should handle multiple actions in sequence', () => {
      let state = initialState;

      // First, change the chart type
      state = tabReducer(state, setChartType('bar'));
      expect(state.visualizations.chartType).toBe('bar');

      // Then, update style options
      const styleOptions = { addTooltip: true, addLegend: true } as any;
      state = tabReducer(state, setStyleOptions(styleOptions));
      expect(state.visualizations.styleOptions).toEqual(styleOptions);
      expect(state.visualizations.chartType).toBe('bar'); // Should still be 'bar'

      // Change chart type again
      state = tabReducer(state, setChartType('area'));
      expect(state.visualizations.chartType).toBe('area');
      expect(state.visualizations.styleOptions).toEqual(styleOptions); // Should still have the style options

      // Finally, replace entire state
      const newTabState: TabState = {
        logs: { newProperty: 'test' },
        visualizations: {
          chartType: 'pie',
          styleOptions: undefined,
          axesMapping: {},
        },
        patterns: {
          patterns_field: 'message',
        },
      };
      state = tabReducer(state, setTabState(newTabState));
      expect(state).toEqual(newTabState);
    });
  });

  describe('state immutability', () => {
    it('should maintain proper state structure', () => {
      const state = tabReducer(initialState, setChartType('area'));

      // Ensure the state structure is maintained
      expect(state).toHaveProperty('logs');
      expect(state).toHaveProperty('visualizations');
      expect(state.visualizations).toHaveProperty('chartType');
      expect(state.visualizations).toHaveProperty('styleOptions');
    });

    it('should not mutate the original state', () => {
      const originalState = { ...initialState };
      tabReducer(initialState, setChartType('bar'));

      // Original state should remain unchanged
      expect(initialState).toEqual(originalState);
    });

    it('should create new state objects for setTabState', () => {
      const newState: TabState = {
        logs: { test: 'value' },
        visualizations: {
          chartType: 'scatter',
          styleOptions: { addTooltip: true } as any,
          axesMapping: {},
        },
        patterns: {
          patterns_field: 'message',
        },
      };

      const result = tabReducer(initialState, setTabState(newState));
      expect(result).not.toBe(initialState);
      expect(result).toEqual(newState);
    });
  });
});

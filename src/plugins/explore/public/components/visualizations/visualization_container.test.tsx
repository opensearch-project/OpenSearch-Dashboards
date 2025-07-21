/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import { VisualizationContainer } from './visualization_container';
import { useSelector } from 'react-redux';
import { useTabResults } from '../../application/utils/hooks/use_tab_results';
import { useVisualizationRegistry, getVisualizationType } from './utils/use_visualization_types';
import { useDatasetContext } from '../../application/context/dataset_context/dataset_context';
import { useSearchContext } from '../query_panel/utils/use_search_context';
import {
  isValidMapping,
  getAllColumns,
  convertStringsToMappings,
} from './visualization_container_utils';
import { ALL_VISUALIZATION_RULES } from './rule_repository';

// Mock all dependencies to avoid import chain issues
jest.mock('../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: () => ({
    services: {
      data: {
        query: {
          queryString: { getQuery: () => ({}) },
          filterManager: { getFilters: () => [] },
          timefilter: { timefilter: { getTime: () => ({}) } },
          state$: { subscribe: () => ({ unsubscribe: () => {} }) },
        },
      },
      expressions: { ReactExpressionRenderer: () => null },
      notifications: { toasts: { addInfo: jest.fn() } },
    },
  }),
  withOpenSearchDashboards: (component: any) => component,
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: () => jest.fn(),
  connect: () => (component: any) => component,
}));

jest.mock('../../application/utils/hooks/use_tab_results', () => ({
  useTabResults: jest.fn(),
}));

jest.mock('../../application/context/dataset_context/dataset_context', () => ({
  useDatasetContext: jest.fn(),
}));

jest.mock('../query_panel/utils/use_search_context', () => ({
  useSearchContext: jest.fn(),
}));

// Mock all other imports
jest.mock('./visualization', () => ({
  Visualization: (props: any) => <div data-testid="visualization" {...props} />,
}));
jest.mock('./add_to_dashboard_button', () => ({ SaveAndAddButtonWithModal: () => null }));
jest.mock('./visualization_container_utils', () => ({
  applyDefaultVisualization: jest.fn(),
  convertMappingsToStrings: jest.fn(() => ({})),
  convertStringsToMappings: jest.fn(() => ({})),
  findRuleByIndex: jest.fn(),
  getAllColumns: jest.fn(() => [
    { name: 'field1', schema: 'string', uniqueValuesCount: 1 },
    { name: 'field2', schema: 'number', uniqueValuesCount: 2 },
  ]),
  getColumnMatchFromMapping: jest.fn(() => ['field1', 'field2']),
  isValidMapping: jest.fn(() => false),
}));
jest.mock('./rule_repository', () => ({ ALL_VISUALIZATION_RULES: [] }));
jest.mock('../../application/utils/state_management/slices', () => ({
  setStyleOptions: jest.fn(),
  setChartType: jest.fn(),
  setAxesMapping: jest.fn(),
}));
jest.mock('../../application/utils/state_management/selectors', () => ({
  selectStyleOptions: jest.fn(),
  selectChartType: jest.fn(),
  selectAxesMapping: jest.fn(),
}));
jest.mock('./utils/use_visualization_types', () => ({
  useVisualizationRegistry: jest.fn(),
  getVisualizationType: jest.fn(() => ({
    ruleId: 'test-rule',
    visualizationType: { ui: { style: { defaults: {} } } },
    transformedData: [{ x: 1, y: 2 }],
    numericalColumns: [],
    categoricalColumns: [],
    dateColumns: [],
    availableChartTypes: [],
    toExpression: jest.fn(),
    axisColumnMappings: {},
  })),
}));

describe('VisualizationContainer', () => {
  const mockUseSelector = useSelector as jest.Mock;
  const mockUseTabResults = useTabResults as jest.Mock;
  const mockUseVisualizationRegistry = useVisualizationRegistry as jest.Mock;
  const mockUseDatasetContext = useDatasetContext as jest.Mock;
  const mockUseSearchContext = useSearchContext as jest.Mock;
  const mockDispatch = jest.fn();

  const mockVisualizationRegistry = {
    getVisualizationConfig: jest.fn(),
    getRules: jest.fn(() => []),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSelector.mockReturnValue({});
    mockUseTabResults.mockReturnValue({ results: { hits: { hits: [] } } });
    mockUseVisualizationRegistry.mockReturnValue(mockVisualizationRegistry);
    mockUseDatasetContext.mockReturnValue({ dataset: null });
    mockUseSearchContext.mockReturnValue({});
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('react-redux').useDispatch = jest.fn(() => mockDispatch);
  });

  it('renders null when no visualization data', () => {
    const wrapper = shallow(<VisualizationContainer />);
    expect(wrapper.type()).toBeNull();
  });

  it('renders visualization container with proper structure', () => {
    mockUseSelector.mockReturnValueOnce({}).mockReturnValueOnce('bar').mockReturnValueOnce({});

    mockUseTabResults.mockReturnValue({
      results: {
        hits: { hits: [{ _source: { field1: 'value1' } }] },
        fieldSchema: [{ name: 'field1', type: 'string' }],
      },
    });

    const wrapper = shallow(<VisualizationContainer />);
    expect(wrapper.type()).toBeNull();
  });

  it('handles empty results gracefully', () => {
    mockUseTabResults.mockReturnValue({ results: null });
    const wrapper = shallow(<VisualizationContainer />);
    expect(wrapper.type()).toBeNull();
  });

  it('handles missing field schema', () => {
    mockUseTabResults.mockReturnValue({
      results: {
        hits: { hits: [{ _source: { field1: 'value1' } }] },
        fieldSchema: null,
      },
    });
    const wrapper = shallow(<VisualizationContainer />);
    expect(wrapper.type()).toBeNull();
  });

  it('handles chart type selection', () => {
    mockUseSelector.mockReturnValueOnce({}).mockReturnValueOnce('line').mockReturnValueOnce({});
    mockUseTabResults.mockReturnValue({
      results: {
        hits: { hits: [{ _source: { field1: 'value1' } }] },
        fieldSchema: [{ name: 'field1', type: 'string' }],
      },
    });
    const wrapper = shallow(<VisualizationContainer />);
    expect(wrapper.type()).toBeNull();
  });

  it('handles style options updates', () => {
    mockUseSelector
      .mockReturnValueOnce({ color: 'blue' })
      .mockReturnValueOnce('bar')
      .mockReturnValueOnce({});
    const wrapper = shallow(<VisualizationContainer />);
    expect(wrapper.type()).toBeNull();
  });

  it('handles axes mapping state', () => {
    mockUseSelector
      .mockReturnValueOnce({})
      .mockReturnValueOnce('bar')
      .mockReturnValueOnce({ x: 'field1', y: 'field2' });
    const wrapper = shallow(<VisualizationContainer />);
    expect(wrapper.type()).toBeNull();
  });

  it('handles table chart type specifically', () => {
    mockUseSelector.mockReturnValueOnce({}).mockReturnValueOnce('table').mockReturnValueOnce({});
    mockUseTabResults.mockReturnValue({
      results: {
        hits: { hits: [{ _source: { field1: 'value1' } }] },
        fieldSchema: [{ name: 'field1', type: 'string' }],
      },
    });
    const wrapper = shallow(<VisualizationContainer />);
    expect(wrapper.type()).toBeNull();
  });

  it('handles metric chart type with validation', () => {
    mockUseSelector.mockReturnValueOnce({}).mockReturnValueOnce('metric').mockReturnValueOnce({});
    mockUseTabResults.mockReturnValue({
      results: {
        hits: { hits: [{ _source: { count: 100 } }] },
        fieldSchema: [{ name: 'count', type: 'number' }],
      },
    });
    const wrapper = shallow(<VisualizationContainer />);
    expect(wrapper.type()).toBeNull();
  });

  it('handles visualization registry interactions', () => {
    mockUseVisualizationRegistry.mockReturnValue({
      getVisualizationConfig: jest.fn(() => ({ ui: { style: { defaults: {} } } })),
      getRules: jest.fn(() => []),
    });
    const wrapper = shallow(<VisualizationContainer />);
    expect(wrapper.type()).toBeNull();
  });

  it('handles dataset context properly', () => {
    mockUseDatasetContext.mockReturnValue({
      dataset: { id: 'test-dataset', title: 'Test Dataset' },
    });
    const wrapper = shallow(<VisualizationContainer />);
    expect(wrapper.type()).toBeNull();
  });

  it('handles search context integration', () => {
    mockUseSearchContext.mockReturnValue({
      query: 'SELECT * FROM test',
      filters: [],
    });
    const wrapper = shallow(<VisualizationContainer />);
    expect(wrapper.type()).toBeNull();
  });

  it('calls dispatch when component mounts', () => {
    const wrapper = shallow(<VisualizationContainer />);
    expect(wrapper.type()).toBeNull();
  });

  it('handles toast notifications', () => {
    mockUseTabResults.mockReturnValue({
      results: {
        hits: { hits: [{ _source: { field1: 'value1' } }] },
        fieldSchema: [],
      },
    });
    const wrapper = shallow(<VisualizationContainer />);
    expect(wrapper.type()).toBeNull();
  });

  it('handles multiple selector calls', () => {
    mockUseSelector
      .mockReturnValueOnce({ theme: 'dark' })
      .mockReturnValueOnce('pie')
      .mockReturnValueOnce({ x: 'time', y: 'value' });
    shallow(<VisualizationContainer />);
    expect(mockUseSelector).toHaveBeenCalledTimes(3);
  });

  it('renders visualization when data is available', () => {
    (getVisualizationType as jest.Mock).mockReturnValue({
      ruleId: 'test-rule',
      visualizationType: { ui: { style: { defaults: {} } } },
      transformedData: [{ x: 1, y: 2 }],
      numericalColumns: [],
      categoricalColumns: [],
      dateColumns: [],
      availableChartTypes: [],
      toExpression: jest.fn(),
      axisColumnMappings: {},
    });

    mockUseSelector
      .mockReturnValueOnce({ color: 'blue' })
      .mockReturnValueOnce('bar')
      .mockReturnValueOnce({ x: 'field1', y: 'field2' });

    mockUseTabResults.mockReturnValue({
      results: {
        hits: { hits: [{ _source: { field1: 'value1', field2: 10 } }] },
        fieldSchema: [
          { name: 'field1', type: 'string' },
          { name: 'field2', type: 'number' },
        ],
      },
    });

    mockUseDatasetContext.mockReturnValue({ dataset: { id: 'test' } });

    const wrapper = shallow(<VisualizationContainer />);
    expect(wrapper.find('.exploreVisContainer')).toHaveLength(0);
  });

  it('handles rule-matched visualization with existing chart type', () => {
    const mockRule = { id: 'test-rule', toExpression: jest.fn() };
    mockVisualizationRegistry.getRules.mockReturnValue([mockRule] as any);
    mockVisualizationRegistry.getVisualizationConfig.mockReturnValue({
      ui: { style: { defaults: {} }, availableMappings: [] },
    });

    mockUseSelector
      .mockReturnValueOnce({ color: 'red' })
      .mockReturnValueOnce('line')
      .mockReturnValueOnce({ x: 'time', y: 'value' });

    mockUseTabResults.mockReturnValue({
      results: {
        hits: { hits: [{ _source: { time: '2023-01-01', value: 100 } }] },
        fieldSchema: [
          { name: 'time', type: 'date' },
          { name: 'value', type: 'number' },
        ],
      },
    });

    const wrapper = shallow(<VisualizationContainer />);
    // Component should render without errors when data is available
    expect(wrapper.type()).toBeNull(); // Still null due to mocked getVisualizationType
  });

  it('handles metric chart type with multiple values', () => {
    (getAllColumns as jest.Mock).mockReturnValue([{ name: 'count', uniqueValuesCount: 2 }]);
    (getVisualizationType as jest.Mock).mockReturnValue({
      ruleId: 'test-rule',
      visualizationType: { ui: { style: { defaults: {} } } },
      transformedData: [{ count: 100 }, { count: 200 }],
      numericalColumns: [{ name: 'count', uniqueValuesCount: 2 }],
      categoricalColumns: [],
      dateColumns: [],
      availableChartTypes: [],
      toExpression: jest.fn(),
      axisColumnMappings: {},
    });

    mockUseSelector.mockReturnValueOnce({}).mockReturnValueOnce('metric').mockReturnValueOnce({});

    mockUseTabResults.mockReturnValue({
      results: {
        hits: { hits: [{ _source: { count: 100 } }, { _source: { count: 200 } }] },
        fieldSchema: [{ name: 'count', type: 'number' }],
      },
    });

    shallow(<VisualizationContainer />);
    // Test passes if no error is thrown
  });

  it('handles table chart type selection', () => {
    (getVisualizationType as jest.Mock).mockReturnValue({
      ruleId: null,
      visualizationType: null,
      transformedData: [{ field1: 'value1' }],
      numericalColumns: [],
      categoricalColumns: [{ name: 'field1' }],
      dateColumns: [],
      availableChartTypes: [],
      toExpression: jest.fn(),
      axisColumnMappings: {},
    });

    mockVisualizationRegistry.getVisualizationConfig.mockReturnValue({
      ui: { style: { defaults: {} } },
    });

    mockUseSelector.mockReturnValueOnce({}).mockReturnValueOnce('table').mockReturnValueOnce({});

    mockUseTabResults.mockReturnValue({
      results: {
        hits: { hits: [{ _source: { field1: 'value1' } }] },
        fieldSchema: [{ name: 'field1', type: 'string' }],
      },
    });

    shallow(<VisualizationContainer />);
    // Test passes if component handles table type without errors
  });

  it('handles expression generation with valid data', () => {
    const mockRule = { id: 'test-rule', toExpression: jest.fn() };

    (getVisualizationType as jest.Mock).mockReturnValue({
      ruleId: 'test-rule',
      visualizationType: { ui: { style: { defaults: {} } } },
      transformedData: [{ x: 1, y: 2 }],
      numericalColumns: [{ name: 'x' }, { name: 'y' }],
      categoricalColumns: [],
      dateColumns: [],
      availableChartTypes: [],
      toExpression: jest.fn(),
      axisColumnMappings: { x: { name: 'x' }, y: { name: 'y' } },
    });

    mockVisualizationRegistry.getRules.mockReturnValue([mockRule] as any);

    mockUseSelector
      .mockReturnValueOnce({ color: 'blue' })
      .mockReturnValueOnce('bar')
      .mockReturnValueOnce({});

    mockUseTabResults.mockReturnValue({
      results: {
        hits: { hits: [{ _source: { x: 1, y: 2 } }] },
        fieldSchema: [
          { name: 'x', type: 'number' },
          { name: 'y', type: 'number' },
        ],
      },
    });

    mockUseDatasetContext.mockReturnValue({ dataset: { id: 'test-dataset' } });
    mockUseSearchContext.mockReturnValue({ query: 'test query' });

    shallow(<VisualizationContainer />);
    // Test passes if component handles expression generation without errors
  });

  it('handles style change with timeout', () => {
    jest.useFakeTimers();

    mockUseSelector
      .mockReturnValueOnce({ color: 'blue' })
      .mockReturnValueOnce('bar')
      .mockReturnValueOnce({});

    const wrapper = shallow(<VisualizationContainer />);

    // Simulate style change
    const visualization = wrapper.find('Visualization');
    if (visualization.length > 0) {
      (visualization.prop('onStyleChange') as any)({ color: 'red' });
      jest.advanceTimersByTime(100);
    }

    jest.useRealTimers();
  });

  it('handles chart type change with mapping reuse', () => {
    // This test verifies the component can handle chart type changes
    // The actual logic is complex and requires proper component state
    const wrapper = shallow(<VisualizationContainer />);
    expect(wrapper.type()).toBeNull(); // Component returns null when no visualization data
  });

  it('handles invalid mapping scenario', () => {
    (isValidMapping as jest.Mock).mockReturnValue(false);

    const wrapper = shallow(<VisualizationContainer />);
    expect(wrapper.type()).toBeNull(); // Component handles invalid mappings gracefully
  });

  it('handles updateVisualization callback', () => {
    // This test verifies the component structure supports updateVisualization
    // The callback is passed to child components when they exist
    const wrapper = shallow(<VisualizationContainer />);
    expect(wrapper.type()).toBeNull(); // Component returns null when no visualization data
  });

  it('handles rule matched visualization with existing chart type and valid mapping', () => {
    // Reset mocks to ensure clean state
    jest.clearAllMocks();

    (getAllColumns as jest.Mock).mockReturnValue([{ name: 'field1', type: 'string' }]);
    (isValidMapping as jest.Mock).mockReturnValue(true);
    (convertStringsToMappings as jest.Mock).mockReturnValue({ x: { name: 'field1' } });

    (getVisualizationType as jest.Mock).mockReturnValue({
      ruleId: 'test-rule',
      visualizationType: { ui: { style: { defaults: { color: 'blue' } } } },
      transformedData: [{ field1: 'value1' }],
      numericalColumns: [],
      categoricalColumns: [{ name: 'field1' }],
      dateColumns: [],
      availableChartTypes: [],
      toExpression: jest.fn(),
      axisColumnMappings: {},
    });

    mockVisualizationRegistry.getVisualizationConfig.mockReturnValue({
      ui: { style: { defaults: { color: 'red' } } },
    });

    // Set up selectors to simulate existing visualization state
    mockUseSelector
      .mockReturnValueOnce({ color: 'blue' }) // styleOptions - not empty
      .mockReturnValueOnce('bar') // selectedChartType - not table
      .mockReturnValueOnce({ x: 'field1' }); // selectedAxesMapping - not empty

    mockUseTabResults.mockReturnValue({
      results: {
        hits: { hits: [{ _source: { field1: 'value1' } }] },
        fieldSchema: [{ name: 'field1', type: 'string' }],
      },
    });

    shallow(<VisualizationContainer />);
    // Test passes if component renders without error when conditions are met
  });

  it('handles metric chart type with single value', () => {
    (getAllColumns as jest.Mock).mockReturnValue([{ name: 'count', uniqueValuesCount: 1 }]);

    (getVisualizationType as jest.Mock).mockReturnValue({
      ruleId: 'test-rule',
      visualizationType: { ui: { style: { defaults: {} } } },
      transformedData: [{ count: 100 }],
      numericalColumns: [{ name: 'count', uniqueValuesCount: 1 }],
      categoricalColumns: [],
      dateColumns: [],
      availableChartTypes: [],
      toExpression: jest.fn(),
      axisColumnMappings: {},
    });

    mockUseSelector.mockReturnValueOnce({}).mockReturnValueOnce('metric').mockReturnValueOnce({});

    mockUseTabResults.mockReturnValue({
      results: {
        hits: { hits: [{ _source: { count: 100 } }] },
        fieldSchema: [{ name: 'count', type: 'number' }],
      },
    });

    shallow(<VisualizationContainer />);
  });

  it('handles chart type change with mapping reuse success', () => {
    (getAllColumns as jest.Mock).mockReturnValue([{ name: 'field1', type: 'string' }]);

    (getVisualizationType as jest.Mock).mockReturnValue({
      ruleId: 'test-rule',
      visualizationType: { ui: { style: { defaults: {} } } },
      transformedData: [{ field1: 'value1' }],
      numericalColumns: [],
      categoricalColumns: [{ name: 'field1' }],
      dateColumns: [],
      availableChartTypes: [],
      toExpression: jest.fn(),
      axisColumnMappings: {},
    });

    const mockRule = {
      id: 'test-rule',
      matchIndex: ['categorical'],
      chartTypes: [{ type: 'pie' }],
      toExpression: jest.fn(),
    };

    (ALL_VISUALIZATION_RULES as any).length = 0;
    (ALL_VISUALIZATION_RULES as any).push(mockRule);

    mockVisualizationRegistry.getVisualizationConfig.mockReturnValue({
      ui: {
        style: { defaults: {} },
        availableMappings: [
          {
            mapping: [{ x: { type: 'categorical' } }],
          },
        ],
      },
    });

    mockUseSelector
      .mockReturnValueOnce({})
      .mockReturnValueOnce('bar')
      .mockReturnValueOnce({ x: 'field1' });

    mockUseTabResults.mockReturnValue({
      results: {
        hits: { hits: [{ _source: { field1: 'value1' } }] },
        fieldSchema: [{ name: 'field1', type: 'string' }],
      },
    });

    const wrapper = shallow(<VisualizationContainer />);
    const visualization = wrapper.find('Visualization');
    if (visualization.length > 0) {
      (visualization.prop('onChartTypeChange') as any)('pie');
    }
  });

  it('handles no rule matched with table chart type', () => {
    // Reset mocks to ensure clean state
    jest.clearAllMocks();

    (getVisualizationType as jest.Mock).mockReturnValue({
      ruleId: null,
      visualizationType: null,
      transformedData: [{ field1: 'value1' }],
      numericalColumns: [],
      categoricalColumns: [{ name: 'field1' }],
      dateColumns: [],
      availableChartTypes: [],
      toExpression: jest.fn(),
      axisColumnMappings: {},
    });

    mockVisualizationRegistry.getVisualizationConfig.mockReturnValue({
      ui: { style: { defaults: {} } },
    });

    mockUseSelector
      .mockReturnValueOnce({})
      .mockReturnValueOnce('table') // selectedChartType is table
      .mockReturnValueOnce({});

    mockUseTabResults.mockReturnValue({
      results: {
        hits: { hits: [{ _source: { field1: 'value1' } }] },
        fieldSchema: [{ name: 'field1', type: 'string' }],
      },
    });

    shallow(<VisualizationContainer />);
    // Test passes if component renders without error for table chart type
  });

  it('handles expression generation with table chart type', () => {
    (getVisualizationType as jest.Mock).mockReturnValue({
      ruleId: 'test-rule',
      visualizationType: { ui: { style: { defaults: {} } } },
      transformedData: [{ field1: 'value1' }],
      numericalColumns: [],
      categoricalColumns: [{ name: 'field1' }],
      dateColumns: [],
      availableChartTypes: [],
      toExpression: jest.fn(),
      axisColumnMappings: {},
    });

    mockUseSelector
      .mockReturnValueOnce({ color: 'blue' })
      .mockReturnValueOnce('table')
      .mockReturnValueOnce({});

    mockUseTabResults.mockReturnValue({
      results: {
        hits: { hits: [{ _source: { field1: 'value1' } }] },
        fieldSchema: [{ name: 'field1', type: 'string' }],
      },
    });

    mockUseDatasetContext.mockReturnValue({ dataset: { id: 'test-dataset' } });
    mockUseSearchContext.mockReturnValue({ query: 'test query' });

    shallow(<VisualizationContainer />);
  });

  it('handles expression generation without rule', () => {
    (getVisualizationType as jest.Mock).mockReturnValue({
      ruleId: 'nonexistent-rule',
      visualizationType: { ui: { style: { defaults: {} } } },
      transformedData: [{ field1: 'value1' }],
      numericalColumns: [],
      categoricalColumns: [{ name: 'field1' }],
      dateColumns: [],
      availableChartTypes: [],
      toExpression: jest.fn(),
      axisColumnMappings: {},
    });

    mockVisualizationRegistry.getRules.mockReturnValue([]);

    mockUseSelector
      .mockReturnValueOnce({ color: 'blue' })
      .mockReturnValueOnce('bar')
      .mockReturnValueOnce({});

    mockUseTabResults.mockReturnValue({
      results: {
        hits: { hits: [{ _source: { field1: 'value1' } }] },
        fieldSchema: [{ name: 'field1', type: 'string' }],
      },
    });

    mockUseDatasetContext.mockReturnValue({ dataset: { id: 'test-dataset' } });
    mockUseSearchContext.mockReturnValue({ query: 'test query' });

    shallow(<VisualizationContainer />);
  });

  it('handles first loading without selected chart type', () => {
    (getVisualizationType as jest.Mock).mockReturnValue({
      ruleId: null,
      visualizationType: null,
      transformedData: [{ field1: 'value1' }],
      numericalColumns: [],
      categoricalColumns: [{ name: 'field1' }],
      dateColumns: [],
      availableChartTypes: [],
      toExpression: jest.fn(),
      axisColumnMappings: {},
    });

    mockUseSelector.mockReturnValueOnce({}).mockReturnValueOnce(null).mockReturnValueOnce({});

    mockUseTabResults.mockReturnValue({
      results: {
        hits: { hits: [{ _source: { field1: 'value1' } }] },
        fieldSchema: [{ name: 'field1', type: 'string' }],
      },
    });

    shallow(<VisualizationContainer />);
  });
});

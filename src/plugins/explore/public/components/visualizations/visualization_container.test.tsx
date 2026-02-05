/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

import { VisualizationContainer } from './visualization_container';
import * as VB from './visualization_builder';
import * as TabResultsHooks from '../../application/utils/hooks/use_tab_results';
import { BehaviorSubject } from 'rxjs';
import { VisFieldType } from './types';
import { VisData } from './visualization_builder.types';

// Mock react-redux before importing any components
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('../../application/utils/hooks/use_tab_results', () => ({
  useTabResults: jest.fn(() => ({
    results: {
      hits: {
        hits: [{ _source: { field1: 'value1' } }, { _source: { field1: 'value2' } }],
      },
      fieldSchema: [
        { name: 'field1', type: 'string' },
        { name: 'count', type: 'number' },
      ],
    },
  })),
}));

jest.mock('../query_panel/utils/use_search_context', () => ({
  useSearchContext: jest.fn(() => ({
    timeRange: { from: 'now-15m', to: 'now' },
    query: 'source=test',
  })),
}));

// Mock the visualization builder
const mockVisualizationBuilder = {
  data$: new BehaviorSubject<VisData | undefined>({
    transformedData: [
      { field1: 'value1', count: 10 },
      { field1: 'value2', count: 20 },
    ],
    numericalColumns: [
      {
        id: 1,
        name: 'count',
        schema: VisFieldType.Numerical,
        column: 'count',
        validValuesCount: 2,
        uniqueValuesCount: 2,
      },
    ],
    categoricalColumns: [
      {
        id: 2,
        name: 'field1',
        schema: VisFieldType.Categorical,
        column: 'field1',
        validValuesCount: 2,
        uniqueValuesCount: 2,
      },
    ],
    dateColumns: [],
  }),
  visConfig$: new BehaviorSubject({
    type: 'bar',
    styles: {
      legendPosition: 'right',
      thresholds: [],
      pageSize: 10,
    },
    axesMapping: {},
  }),
  renderVisualization: jest.fn(),
  handleData: jest.fn(),
  init: jest.fn(),
  reset: jest.fn(),
};

describe('VisualizationContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(VB, 'getVisualizationBuilder').mockReturnValue(mockVisualizationBuilder as any);
  });

  it('renders the visualization container', () => {
    render(<VisualizationContainer />);

    expect(screen.getByTestId('exploreVisualizationLoader')).toBeInTheDocument();
    expect(mockVisualizationBuilder.init).toHaveBeenCalled();
    expect(mockVisualizationBuilder.handleData).toHaveBeenCalled();
    expect(mockVisualizationBuilder.renderVisualization).toHaveBeenCalled();
  });

  it('cleans up on unmount', () => {
    const { unmount } = render(<VisualizationContainer />);

    unmount();

    expect(mockVisualizationBuilder.reset).toHaveBeenCalled();
  });

  it('handles empty results', () => {
    // Override the mock for this test
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    jest.spyOn(TabResultsHooks, 'useTabResults').mockReturnValueOnce({
      results: null,
    });

    render(<VisualizationContainer />);

    // Should still render without crashing
    expect(screen.getByTestId('exploreVisualizationLoader')).toBeInTheDocument();
  });
});

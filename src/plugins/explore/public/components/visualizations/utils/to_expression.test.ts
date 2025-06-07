/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { toExpression } from './to_expression';
import { VisColumn, VisFieldType } from '../types';
import * as expressionsPublic from '../../../../../expressions/public';

// Mock the expressions module
jest.mock('../../../../../expressions/public', () => ({
  buildExpression: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('mocked_expression_string'),
  }),
  buildExpressionFunction: jest.fn().mockImplementation((functionName, params) => ({
    type: 'function',
    function: functionName,
    arguments: params,
  })),
}));

describe('to_expression', () => {
  // Sample data for testing
  const transformedData = [
    { 'field-0': '2023-01-01', 'field-1': 100, 'field-2': 'Category A' },
    { 'field-0': '2023-01-02', 'field-1': 200, 'field-2': 'Category B' },
  ];

  const numericalColumns: VisColumn[] = [
    {
      id: 1,
      name: 'value',
      schema: VisFieldType.Numerical,
      column: 'field-1',
    },
  ];

  const categoricalColumns: VisColumn[] = [
    {
      id: 2,
      name: 'category',
      schema: VisFieldType.Categorical,
      column: 'field-2',
    },
  ];

  const dateColumns: VisColumn[] = [
    {
      id: 0,
      name: 'date',
      schema: VisFieldType.Date,
      column: 'field-0',
    },
  ];

  const styleOptions = {
    addTooltip: true,
    addLegend: true,
  };

  const mockIndexPattern = {
    id: 'test-pattern',
    title: 'test-pattern',
  };

  const mockSearchContext = {
    timeRange: { from: 'now-7d', to: 'now' },
    filters: [],
    query: { language: 'kuery', query: 'stats' },
  };

  const mockToExpressionFn = jest.fn().mockReturnValue({
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    title: 'Test Chart',
    data: { values: transformedData },
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return an empty string if indexPattern is not provided', async () => {
    const result = await toExpression(
      mockSearchContext,
      undefined as any,
      mockToExpressionFn,
      transformedData,
      numericalColumns,
      categoricalColumns,
      dateColumns,
      styleOptions
    );

    expect(result).toBe('');
    expect(mockToExpressionFn).not.toHaveBeenCalled();
  });

  it('should return an empty string if searchContext is not provided', async () => {
    const result = await toExpression(
      undefined as any,
      mockIndexPattern as any,
      mockToExpressionFn,
      transformedData,
      numericalColumns,
      categoricalColumns,
      dateColumns,
      styleOptions
    );

    expect(result).toBe('');
    expect(mockToExpressionFn).not.toHaveBeenCalled();
  });

  it('should build and return an expression string when all required parameters are provided', async () => {
    const result = await toExpression(
      mockSearchContext,
      mockIndexPattern as any,
      mockToExpressionFn,
      transformedData,
      numericalColumns,
      categoricalColumns,
      dateColumns,
      styleOptions
    );

    // Verify the result
    expect(result).toBe('mocked_expression_string');

    // Verify that the toExpressionFn was called with the correct parameters
    expect(mockToExpressionFn).toHaveBeenCalledWith(
      transformedData,
      numericalColumns,
      categoricalColumns,
      dateColumns,
      styleOptions,
      'line'
    );

    // Verify that the expression functions were built correctly
    expect(expressionsPublic.buildExpressionFunction).toHaveBeenCalledTimes(3);
    expect(expressionsPublic.buildExpressionFunction).toHaveBeenNthCalledWith(
      1,
      'opensearchDashboards',
      {}
    );
    expect(expressionsPublic.buildExpressionFunction).toHaveBeenNthCalledWith(
      2,
      'opensearch_dashboards_context',
      {
        timeRange: JSON.stringify(mockSearchContext.timeRange),
        filters: JSON.stringify(mockSearchContext.filters),
        query: JSON.stringify(mockSearchContext.query),
      }
    );
    expect(expressionsPublic.buildExpressionFunction).toHaveBeenNthCalledWith(3, 'vega', {
      spec: JSON.stringify(mockToExpressionFn.mock.results[0].value),
    });

    // Verify that buildExpression was called with the array of functions
    expect(expressionsPublic.buildExpression).toHaveBeenCalledWith([
      { type: 'function', function: 'opensearchDashboards', arguments: {} },
      {
        type: 'function',
        function: 'opensearch_dashboards_context',
        arguments: {
          timeRange: JSON.stringify(mockSearchContext.timeRange),
          filters: JSON.stringify(mockSearchContext.filters),
          query: JSON.stringify(mockSearchContext.query),
        },
      },
      {
        type: 'function',
        function: 'vega',
        arguments: {
          spec: JSON.stringify(mockToExpressionFn.mock.results[0].value),
        },
      },
    ]);
  });

  it('should handle missing optional parameters gracefully', async () => {
    const result = await toExpression(
      mockSearchContext,
      mockIndexPattern as any,
      mockToExpressionFn
    );

    // Verify the result
    expect(result).toBe('mocked_expression_string');

    // Verify that the toExpressionFn was called with undefined parameters
    expect(mockToExpressionFn).toHaveBeenCalledWith(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      'line'
    );
  });
});

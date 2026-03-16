/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { toExpression } from './to_expression';
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

  const mockSearchContext = {
    timeRange: { from: 'now-7d', to: 'now' },
    filters: [],
    query: { language: 'kuery', query: 'stats' },
  };

  const mockedSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    title: 'Test Chart',
    data: { values: transformedData },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return an empty string if searchContext is not provided', async () => {
    const result = toExpression(undefined as any, {});

    expect(result).toBe('');
    expect(expressionsPublic.buildExpressionFunction).not.toHaveBeenCalled();
    expect(expressionsPublic.buildExpression).not.toHaveBeenCalled();
  });

  it('should build and return an expression string when all required parameters are provided', async () => {
    const result = toExpression(mockSearchContext, mockedSpec);

    // Verify the result
    expect(result).toBe('mocked_expression_string');

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
      spec: JSON.stringify(mockedSpec),
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
          spec: JSON.stringify(mockedSpec),
        },
      },
    ]);
  });
});

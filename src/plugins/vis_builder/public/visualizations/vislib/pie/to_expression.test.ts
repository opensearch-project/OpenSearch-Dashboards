/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { toExpression } from './to_expression';
import * as expressionHelpers from '../../common/expression_helpers';
import * as vegaSpecFactory from '../../vega/vega_spec_factory';
import * as expressionHelper from '../../vega/utils/expression_helper';
import * as createVis from '../common/create_vis';
import * as visualizationsPublic from '../../../../../visualizations/public';
import * as expressionsPublic from '../../../../../expressions/public';

jest.mock('../../common/expression_helpers');
jest.mock('../../vega/vega_spec_factory');
jest.mock('../../vega/utils/expression_helper');
jest.mock('../common/create_vis');
jest.mock('../../../../../visualizations/public');
jest.mock('../../../../../expressions/public');

jest.mock('../../../plugin_services', () => ({
  getSearchService: jest.fn(() => ({
    aggs: {
      createAggConfigs: jest.fn(),
    },
  })),
  getTimeFilter: jest.fn(() => ({
    getTime: jest.fn(() => ({ from: 'now-7d', to: 'now' })),
  })),
}));

describe('pie/to_expression.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate vega expression for pie chart', async () => {
    const mockState = {
      style: {
        addLegend: true,
        addTooltip: true,
        showMetricsAtAllLevels: true,
        isDonut: false,
        legendPosition: 'right',
        type: 'pie',
      },
      visualization: { someConfig: 'value' },
    };
    const mockSearchContext = { someContext: 'value' };

    (expressionHelpers.getAggExpressionFunctions as jest.Mock).mockResolvedValue({
      expressionFns: ['mockFn1', 'mockFn2'],
      aggConfigs: {},
      indexPattern: {},
    });

    (createVis.createVis as jest.Mock).mockResolvedValue({
      data: {
        aggs: {
          getResponseAggs: jest.fn().mockReturnValue([]),
        },
      },
    });

    (visualizationsPublic.getVisSchemas as jest.Mock).mockReturnValue({
      metric: [{ label: 'Metric' }],
      group: [{ label: 'Group' }],
      split_row: [{ label: 'Split Row' }],
      split_column: [{ label: 'Split Column' }],
    });

    (expressionsPublic.buildExpression as jest.Mock).mockReturnValue({
      toString: jest.fn().mockReturnValue('rawData | mockFn1 | mockFn2'),
    });
    (expressionsPublic.buildExpressionFunction as jest.Mock).mockReturnValue({});

    (expressionHelper.executeExpression as jest.Mock).mockResolvedValue({ someData: 'value' });
    (vegaSpecFactory.createVegaSpec as jest.Mock).mockReturnValue({ spec: 'mockVegaSpec' });

    (visualizationsPublic.buildPipeline as jest.Mock).mockResolvedValue('vega | mockVegaSpec');

    const result = await toExpression(mockState as any, mockSearchContext as any);

    expect(result).toBe('vega | mockVegaSpec');
    expect(expressionHelpers.getAggExpressionFunctions).toHaveBeenCalledWith(
      mockState.visualization,
      mockState.style,
      true,
      mockSearchContext
    );
    expect(createVis.createVis).toHaveBeenCalledWith('pie', {}, {}, mockSearchContext);
    expect(visualizationsPublic.getVisSchemas).toHaveBeenCalled();
    expect(expressionsPublic.buildExpressionFunction).toHaveBeenCalledWith('rawData', {});
    expect(expressionHelper.executeExpression).toHaveBeenCalledWith(
      'rawData | mockFn1 | mockFn2',
      mockSearchContext
    );
    expect(vegaSpecFactory.createVegaSpec).toHaveBeenCalledWith(
      { someData: 'value' },
      expect.objectContaining({
        addLegend: true,
        addTooltip: true,
        isDonut: false,
        legendPosition: 'right',
        dimensions: expect.any(Object),
        showMetricsAtAllLevels: true,
      }),
      mockState.style
    );
    expect(visualizationsPublic.buildPipeline).toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    const mockState = {
      style: { type: 'pie' },
      visualization: {},
    };
    const mockSearchContext = {};

    (expressionHelpers.getAggExpressionFunctions as jest.Mock).mockRejectedValue(
      new Error('Mock error')
    );

    await expect(toExpression(mockState as any, mockSearchContext as any)).rejects.toThrow(
      'Mock error'
    );
  });
});

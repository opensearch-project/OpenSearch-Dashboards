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

describe('line/to_expression.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate vislib expression when useVega is false', async () => {
    const mockState = {
      style: { addLegend: true, addTooltip: true, legendPosition: 'right', type: 'line' },
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

    (visualizationsPublic.buildVislibDimensions as jest.Mock).mockResolvedValue({
      y: [{ label: 'Y-Axis' }],
    });

    const mockExpression = {
      toString: jest.fn().mockReturnValue('vislib | mockFn1 | mockFn2'),
    };
    (expressionsPublic.buildExpression as jest.Mock).mockReturnValue(mockExpression);
    (expressionsPublic.buildExpressionFunction as jest.Mock).mockReturnValue({});

    const result = await toExpression(mockState as any, mockSearchContext as any, false);

    expect(result).toBe('vislib | mockFn1 | mockFn2');
    expect(expressionsPublic.buildExpression).toHaveBeenCalledWith(
      expect.arrayContaining(['mockFn1', 'mockFn2', expect.any(Object)])
    );
    expect(expressionsPublic.buildExpressionFunction).toHaveBeenCalledWith(
      'vislib',
      expect.any(Object)
    );
  });

  it('should generate vega expression when useVega is true', async () => {
    const mockState = {
      style: { addLegend: true, addTooltip: true, legendPosition: 'right', type: 'line' },
      visualization: { someConfig: 'value' },
    };
    const mockSearchContext = { someContext: 'value' };

    (expressionHelpers.getAggExpressionFunctions as jest.Mock).mockResolvedValue({
      expressionFns: ['mockFn1', 'mockFn2'],
      aggConfigs: {},
      indexPattern: {},
    });
    (expressionHelper.executeExpression as jest.Mock).mockResolvedValue({ someData: 'value' });
    (vegaSpecFactory.createVegaSpec as jest.Mock).mockReturnValue({ spec: 'mockVegaSpec' });

    (createVis.createVis as jest.Mock).mockResolvedValue({
      data: {
        aggs: {
          getResponseAggs: jest.fn().mockReturnValue([]),
        },
      },
    });

    (visualizationsPublic.buildVislibDimensions as jest.Mock).mockResolvedValue({
      y: [{ label: 'Y-Axis' }],
    });

    (expressionsPublic.buildExpression as jest.Mock).mockReturnValue({
      toString: jest.fn().mockReturnValue('rawData | mockFn1 | mockFn2'),
    });
    (expressionsPublic.buildExpressionFunction as jest.Mock).mockReturnValue({});

    (visualizationsPublic.buildPipeline as jest.Mock).mockResolvedValue('vega | mockVegaSpec');

    const result = await toExpression(mockState as any, mockSearchContext as any, true);

    expect(result).toBe('vega | mockVegaSpec');
    expect(vegaSpecFactory.createVegaSpec).toHaveBeenCalledWith(
      { someData: 'value' },
      expect.objectContaining({
        addLegend: true,
        addTooltip: true,
        legendPosition: 'right',
      }),
      mockState.style
    );
    expect(visualizationsPublic.buildPipeline).toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    const mockState = {
      style: { type: 'line' },
      visualization: {},
    };
    const mockSearchContext = {};

    (expressionHelpers.getAggExpressionFunctions as jest.Mock).mockRejectedValue(
      new Error('Mock error')
    );

    await expect(toExpression(mockState as any, mockSearchContext as any, false)).rejects.toThrow(
      'Mock error'
    );
  });

  it('should handle different buildVislibDimensions structures', async () => {
    const mockState = {
      style: { type: 'line' },
      visualization: {},
    };
    const mockSearchContext = {};

    (expressionHelpers.getAggExpressionFunctions as jest.Mock).mockResolvedValue({
      expressionFns: [],
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

    (visualizationsPublic.buildVislibDimensions as jest.Mock).mockResolvedValue({
      x: [{ label: 'X-Axis' }],
      y: [{ label: 'Y-Axis1' }, { label: 'Y-Axis2' }],
    });

    const mockExpression = {
      toString: jest.fn().mockReturnValue('vislib | multipleYAxes'),
    };
    (expressionsPublic.buildExpression as jest.Mock).mockReturnValue(mockExpression);
    (expressionsPublic.buildExpressionFunction as jest.Mock).mockReturnValue({});

    const result = await toExpression(mockState as any, mockSearchContext as any, false);

    expect(result).toBe('vislib | multipleYAxes');
    expect(expressionsPublic.buildExpressionFunction).toHaveBeenCalledWith(
      'vislib',
      expect.objectContaining({
        visConfig: expect.stringContaining('"valueAxes":[{"id":"ValueAxis-1"'),
      })
    );
  });
});

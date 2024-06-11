/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { toExpressionAst } from './to_ast';
import { Vis } from '../../visualizations/public';

describe('table vis toExpressionAst function', () => {
  let vis: Vis;

  beforeEach(() => {
    vis = {
      isHierarchical: () => false,
      type: {},
      params: {},
      data: {
        indexPattern: { id: '123' } as any,
        aggs: {
          getResponseAggs: () => [],
          aggs: [],
        } as any,
      },
    } as any;
  });

  it('without params', () => {
    vis.params = { table: {} };
    const actual = toExpressionAst(vis, {});
    expect(actual).toMatchSnapshot();
  });

  it('with default params', () => {
    vis.params = {
      perPage: 10,
      showPartialRows: false,
      showMetricsAtAllLevels: false,
      showTotal: false,
      totalFunc: 'sum',
      percentageCol: '',
    };
    const actual = toExpressionAst(vis, {});
    expect(actual).toMatchSnapshot();
  });

  it('with customized params', () => {
    vis.params = {
      perPage: 5,
      showPartialRows: false,
      showMetricsAtAllLevels: false,
      showTotal: true,
      totalFunc: 'min',
      percentageCol: 'Count',
    };
    const actual = toExpressionAst(vis, {});
    expect(actual).toMatchSnapshot();
  });
});

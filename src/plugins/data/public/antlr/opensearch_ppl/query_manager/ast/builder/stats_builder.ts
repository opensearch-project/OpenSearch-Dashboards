/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isEmpty } from 'lodash';
import { QueryBuilder } from './query_builder';
import { Aggregations } from '../tree/aggragations';
import { PPLNode } from '../node';
import {
  AggregateFunction,
  AggregateTerm,
  Field,
  GroupBy,
  Span,
  SpanExpression,
} from '../expression';
import {
  ExpressionChunk,
  SpanChunk,
  StatsAggregationChunk,
  StatsAggregationFunctionChunk,
  GroupByChunk,
  GroupField,
  StatsChunk,
  SpanExpressionChunk,
} from '../types';

export class StatsBuilder implements QueryBuilder<Aggregations> {
  constructor(private statsChunk: StatsChunk) {}

  build(): Aggregations {
    // return a new stats subtree
    return new Aggregations(
      'stats_command',
      [] as PPLNode[],
      !isEmpty(this.statsChunk.partitions) ? this.buildParttions(this.statsChunk.partitions) : '',
      !isEmpty(this.statsChunk.all_num) ? this.buildAllNum(this.statsChunk.all_num) : '',
      !isEmpty(this.statsChunk.delim) ? this.buildDelim(this.statsChunk.delim) : '',
      !isEmpty(this.statsChunk.aggregations)
        ? this.buildAggList(this.statsChunk.aggregations)
        : ([] as PPLNode[]),
      !isEmpty(this.statsChunk.groupby)
        ? this.buildGroupList(this.statsChunk.groupby)
        : new GroupBy('stats_by_clause', [] as PPLNode[], [], null),
      !isEmpty(this.statsChunk.dedup_split_value)
        ? this.buildDedupSplitValue(this.statsChunk.dedup_split_value)
        : ''
    );
  }

  /**
   * Flags
   */
  buildParttions(partitions: ExpressionChunk) {
    return `${partitions.keyword} ${partitions.sign} ${partitions.value}`;
  }

  buildAllNum(allNum: ExpressionChunk) {
    return `${allNum.keyword} ${allNum.sign} ${allNum.value}`;
  }

  buildDelim(delim: ExpressionChunk) {
    return `${delim.keyword} ${delim.sign} ${delim.value}`;
  }

  buildDedupSplitValue(dedupSplitvalue: ExpressionChunk) {
    return `${dedupSplitvalue.keyword} ${dedupSplitvalue.sign} ${dedupSplitvalue.value}`;
  }

  /**
   * Aggregations
   */
  buildAggList(aggregations: StatsAggregationChunk[]) {
    return aggregations.map((aggregation) => {
      return this.buildAggTerm(aggregation);
    });
  }

  buildAggTerm(aggTerm: StatsAggregationChunk) {
    return new AggregateTerm(
      'stats_agg_term',
      [] as PPLNode[],
      this.buildAggregateFunction(aggTerm.function),
      aggTerm.function_alias
    );
  }

  buildAggregateFunction(aggFunction: StatsAggregationFunctionChunk) {
    return new AggregateFunction(
      'stats_function',
      [] as PPLNode[],
      aggFunction.name,
      aggFunction.value_expression,
      aggFunction.percentile_agg_function
    );
  }

  /**
   * Groups
   */
  buildGroupList(groupby: GroupByChunk) {
    return new GroupBy(
      'stats_by_clause',
      [] as PPLNode[],
      this.buildFieldList(groupby.group_fields),
      groupby.span ? this.buildSpan(groupby.span) : null
    );
  }

  buildFieldList(group_fields: GroupField[]) {
    return group_fields.map((gf: GroupField) => {
      return new Field('field_expression', [] as PPLNode[], gf.name);
    });
  }

  buildSpan(span: SpanChunk) {
    return new Span(
      'span_clause',
      [] as PPLNode[],
      this.buildeSpanExpression(span.span_expression),
      span['customLabel']
    );
  }

  buildeSpanExpression(spanExpression: SpanExpressionChunk) {
    return new SpanExpression(
      'span_expression',
      [] as PPLNode[],
      spanExpression.field,
      spanExpression.literal_value,
      spanExpression.time_unit
    );
  }
}

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharStream, CommonTokenStream } from 'antlr4ng';
import {
  AggregationVisitor,
  contextContainsCursor,
  getMetricFromAggregation,
} from './aggregation_visitor';
import { PromQLParser, PromQLLexer } from '@osd/antlr-grammar';

describe('AggregationVisitor result aggregation', () => {
  it('returns nextResult when aggregate is null', () => {
    const visitor = new AggregationVisitor(0);

    const aggregate = null;
    const nextResult = 'metric_name';

    const result = visitor.aggregateResult(aggregate, nextResult);

    expect(result).toBe('metric_name');
  });

  it('returns aggregate when it already has a value', () => {
    const visitor = new AggregationVisitor(0);

    const aggregate = 'first_metric';
    const nextResult = 'second_metric';

    const result = visitor.aggregateResult(aggregate, nextResult);

    expect(result).toBe('first_metric');
  });

  it('returns null when both are null', () => {
    const visitor = new AggregationVisitor(0);

    const aggregate = null;
    const nextResult = null;

    const result = visitor.aggregateResult(aggregate, nextResult);

    expect(result).toBeNull();
  });
});

describe('AggregationVisitor parsing and visiting correctness', () => {
  const createAST = (query: string) => {
    const parser = new PromQLParser(
      new CommonTokenStream(new PromQLLexer(CharStream.fromString(query)))
    );

    return parser.expression();
  };

  it('should return null when cursor is not within an aggregation label list', () => {
    const cursorIndex = 5;
    const query = 'metric_name';
    const ast = createAST(query);
    const visitor = new AggregationVisitor(cursorIndex);

    const result = visitor.visit(ast);

    expect(result).toBeNull();
  });

  it('should return metric name from simple aggregation with by clause', () => {
    const query = 'sum(metric_name) by (label)';
    const cursorIndex = 24; // cursor within 'label'
    const ast = createAST(query);
    const visitor = new AggregationVisitor(cursorIndex);

    const result = visitor.visit(ast);

    expect(result).toBe('metric_name');
  });

  it('should return metric name from aggregation with without clause', () => {
    const query = 'avg(my_metric) without (label)';
    const cursorIndex = 27; // cursor within 'label'
    const ast = createAST(query);
    const visitor = new AggregationVisitor(cursorIndex);

    const result = visitor.visit(ast);

    expect(result).toBe('my_metric');
  });

  it('should return metric name from nested aggregation', () => {
    const query = 'sum(rate(http_requests_total[5m])) by (job)';
    const cursorIndex = 40; // cursor within 'job'
    const ast = createAST(query);
    const visitor = new AggregationVisitor(cursorIndex);

    const result = visitor.visit(ast);

    expect(result).toBe('http_requests_total');
  });

  it('should return null when cursor is outside the label list', () => {
    const query = 'sum(metric_name) by (label)';
    const cursorIndex = 8; // cursor within 'metric_name' not in label list
    const ast = createAST(query);
    const visitor = new AggregationVisitor(cursorIndex);

    const result = visitor.visit(ast);

    expect(result).toBeNull();
  });

  it('should handle aggregation with multiple labels', () => {
    const query = 'sum(metric_name) by (job, instance)';
    const cursorIndex = 24; // cursor within 'job'
    const ast = createAST(query);
    const visitor = new AggregationVisitor(cursorIndex);

    const result = visitor.visit(ast);

    expect(result).toBe('metric_name');
  });

  it('should return metric name from topk aggregation', () => {
    const query = 'topk(3, metric_name) by (label)';
    const cursorIndex = 28; // cursor within 'label'
    const ast = createAST(query);
    const visitor = new AggregationVisitor(cursorIndex);

    const result = visitor.visit(ast);

    expect(result).toBe('metric_name');
  });
});

describe('getMetricFromAggregation helper', () => {
  const createAST = (query: string) => {
    const parser = new PromQLParser(
      new CommonTokenStream(new PromQLLexer(CharStream.fromString(query)))
    );

    return parser.expression();
  };

  it('should return metric name using helper function', () => {
    const query = 'count(errors_total) by (code)';
    const cursorIndex = 26; // cursor within 'code'
    const ast = createAST(query);

    const result = getMetricFromAggregation(cursorIndex, ast);

    expect(result).toBe('errors_total');
  });

  it('should return null when not in aggregation context', () => {
    const query = 'metric_name{label="value"}';
    const cursorIndex = 5;
    const ast = createAST(query);

    const result = getMetricFromAggregation(cursorIndex, ast);

    expect(result).toBeNull();
  });
});

describe('contextContainsCursor', () => {
  const createAST = (query: string) => {
    const parser = new PromQLParser(
      new CommonTokenStream(new PromQLLexer(CharStream.fromString(query)))
    );

    return parser.expression();
  };

  it('should return true when cursor is within context bounds', () => {
    const query = 'metric_name';
    const ast = createAST(query);
    // ast will have start=0 and stop=10 (length of 'metric_name' - 1)

    expect(contextContainsCursor(ast, 0)).toBe(true);
    expect(contextContainsCursor(ast, 5)).toBe(true);
    expect(contextContainsCursor(ast, 10)).toBe(true);
  });

  it('should return true when cursor is at position just past the end', () => {
    const query = 'metric_name';
    const ast = createAST(query);
    // endPos + 1 >= cursorIndex means cursor at position 11 is still valid

    expect(contextContainsCursor(ast, 11)).toBe(true);
  });

  it('should return false when cursor is outside context bounds', () => {
    const query = 'metric_name';
    const ast = createAST(query);

    expect(contextContainsCursor(ast, 15)).toBe(false);
  });
});

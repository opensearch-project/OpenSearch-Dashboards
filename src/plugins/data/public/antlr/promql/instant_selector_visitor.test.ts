/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharStream, CommonTokenStream } from 'antlr4ng';
import {
  InstantSelectorVisitor,
  contextContainsCursor,
  getNamesFromInstantSelector,
} from './instant_selector_visitor';
import { PromQLParser, PromQLLexer } from '@osd/antlr-grammar';

describe('InstantSelectorVisitor result aggregation', () => {
  it('results in nextResult', () => {
    const cursorIndex = 5;
    const visitor = new InstantSelectorVisitor(cursorIndex);

    const aggregate = { metricName: undefined, labelName: undefined };
    const nextResult = { metricName: 'metric_name', labelName: 'label_name' };

    const result = visitor.aggregateResult(aggregate, nextResult);

    expect(result).toEqual(nextResult);
  });

  it('results in aggregate', () => {
    const cursorIndex = 5;
    const visitor = new InstantSelectorVisitor(cursorIndex);

    const aggregate = { metricName: 'metric_name', labelName: 'label_name' };
    const nextResult = { metricName: undefined, labelName: undefined };

    const result = visitor.aggregateResult(aggregate, nextResult);

    expect(result).toEqual(aggregate);
  });

  it('mixed results', () => {
    const cursorIndex = 5;
    const visitor = new InstantSelectorVisitor(cursorIndex);

    const aggregate = { metricName: 'metric_name', labelName: undefined };
    const nextResult = { metricName: undefined, labelName: 'label_name' };

    const result = visitor.aggregateResult(aggregate, nextResult);

    expect(result).toEqual({ metricName: 'metric_name', labelName: 'label_name' });
  });
});

describe('InstantSelectorVisitor parsing and visiting correctness', () => {
  const createAST = (query: string) => {
    const parser = new PromQLParser(
      new CommonTokenStream(new PromQLLexer(CharStream.fromString(query)))
    );

    return parser.expression();
  };

  it('should return default result when cursor is not within context', () => {
    const cursorIndex = 15;
    const query = 'metric_name';
    const ast = createAST(query);
    const visitor = new InstantSelectorVisitor(cursorIndex);

    const result = visitor.visit(ast);

    expect(result).toEqual({ metricName: undefined, labelName: undefined });
  });

  it('should return metric name when cursor is within context', () => {
    const cursorIndex = 5;
    const query = 'metric_name';
    const ast = createAST(query);
    const visitor = new InstantSelectorVisitor(cursorIndex);

    const result = visitor.visit(ast);

    expect(result).toEqual({ metricName: 'metric_name', labelName: undefined });
  });

  it('should return label name when cursor is within label matcher context', () => {
    const cursorIndex = 23;
    const query = 'metric_name{label_name=""}';
    const ast = createAST(query);
    const visitor = new InstantSelectorVisitor(cursorIndex);

    const result = visitor.visit(ast);

    expect(result).toEqual({ metricName: 'metric_name', labelName: 'label_name' });
  });

  it('should return correct metric and label names when there are multiple metrics and labels', () => {
    const cursorIndex = 62;
    const query = 'metric_name1{label_name1="value"} / metric_name2{label_name2=""}';
    const ast = createAST(query);
    const visitor = new InstantSelectorVisitor(cursorIndex);

    const result = visitor.visit(ast);

    expect(result).toEqual({ metricName: 'metric_name2', labelName: 'label_name2' });
  });

  it('should handle functions correctly', () => {
    const cursorIndex = 16;
    const query = 'rate(metric_name)';
    const ast = createAST(query);
    const visitor = new InstantSelectorVisitor(cursorIndex);

    const result = visitor.visit(ast);

    expect(result).toEqual({ metricName: 'metric_name', labelName: undefined });
  });

  it('should handle time ranges correctly', () => {
    const cursorIndex = 11;
    const query = 'metric_name[5m]';
    const ast = createAST(query);
    const visitor = new InstantSelectorVisitor(cursorIndex);

    const result = visitor.visit(ast);

    expect(result).toEqual({ metricName: 'metric_name', labelName: undefined });
  });

  it.skip('should handle complex aggregations correctly', () => {
    const cursorIndex = 30;
    const query = 'sum(rate(metric_name[5m])) by (label_name)';
    const ast = createAST(query);
    const visitor = new InstantSelectorVisitor(cursorIndex);

    const result = visitor.visit(ast);

    expect(result).toEqual({ metricName: 'metric_name', labelName: 'label_name' });
  });

  it('should handle mixed labels, time ranges, and functions correctly', () => {
    const cursorIndex = 33;
    const query = 'sum(rate(metric_name{label_name=""}[5m])) by (label_name)';
    const ast = createAST(query);
    const visitor = new InstantSelectorVisitor(cursorIndex);

    const result = visitor.visit(ast);

    expect(result).toEqual({ metricName: 'metric_name', labelName: 'label_name' });
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

    expect(contextContainsCursor(ast, 0)).toBe(true);
    expect(contextContainsCursor(ast, 5)).toBe(true);
    expect(contextContainsCursor(ast, 10)).toBe(true);
  });

  it('should return true when cursor is at position just past the end', () => {
    const query = 'metric_name';
    const ast = createAST(query);

    expect(contextContainsCursor(ast, 11)).toBe(true);
  });

  it('should return false when cursor is outside context bounds', () => {
    const query = 'metric_name';
    const ast = createAST(query);

    expect(contextContainsCursor(ast, 15)).toBe(false);
  });

  it('should return false when context has invalid start position', () => {
    const mockContext = {
      start: { start: -1 },
      stop: { stop: 10 },
    } as any;

    expect(contextContainsCursor(mockContext, 5)).toBe(false);
  });

  it('should return false when context has invalid stop position', () => {
    const mockContext = {
      start: { start: 0 },
      stop: { stop: -1 },
    } as any;

    expect(contextContainsCursor(mockContext, 5)).toBe(false);
  });

  it('should return false when start is null', () => {
    const mockContext = {
      start: null,
      stop: { stop: 10 },
    } as any;

    expect(contextContainsCursor(mockContext, 5)).toBe(false);
  });

  it('should return false when stop is null', () => {
    const mockContext = {
      start: { start: 0 },
      stop: null,
    } as any;

    expect(contextContainsCursor(mockContext, 5)).toBe(false);
  });
});

describe('getNamesFromInstantSelector', () => {
  const createAST = (query: string) => {
    const parser = new PromQLParser(
      new CommonTokenStream(new PromQLLexer(CharStream.fromString(query)))
    );

    return parser.expression();
  };

  it('should return metric name when cursor is on metric', () => {
    const query = 'http_requests_total';
    const cursorIndex = 5;
    const ast = createAST(query);

    const result = getNamesFromInstantSelector(cursorIndex, ast);

    expect(result.metricName).toBe('http_requests_total');
    expect(result.labelName).toBeUndefined();
  });

  it('should return metric and label when cursor is on label value', () => {
    const query = 'http_requests_total{method="GET"}';
    const cursorIndex = 30; // cursor within quotes
    const ast = createAST(query);

    const result = getNamesFromInstantSelector(cursorIndex, ast);

    expect(result.metricName).toBe('http_requests_total');
    expect(result.labelName).toBe('method');
  });

  it('should return default result when cursor is outside all contexts', () => {
    const query = 'metric';
    const cursorIndex = 100;
    const ast = createAST(query);

    const result = getNamesFromInstantSelector(cursorIndex, ast);

    expect(result.metricName).toBeUndefined();
    expect(result.labelName).toBeUndefined();
  });

  it('should handle empty label matchers', () => {
    const query = 'metric{}';
    const cursorIndex = 7;
    const ast = createAST(query);

    const result = getNamesFromInstantSelector(cursorIndex, ast);

    expect(result.metricName).toBe('metric');
    expect(result.labelName).toBeUndefined();
  });
});

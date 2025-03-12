/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharStream, CommonTokenStream } from 'antlr4ng';
import { InstantSelectorVisitor } from './instant_selector_visitor';
import { PromQLParser } from './.generated/PromQLParser';
import { PromQLLexer } from './.generated/PromQLLexer';

describe('InstantSelectorVisitor', () => {
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

  // move this into its own describe for aggregating
  it('should aggregate results correctly', () => {
    const cursorIndex = 5;
    const visitor = new InstantSelectorVisitor(cursorIndex);

    const aggregate = { metricName: undefined, labelName: undefined };
    const nextResult = { metricName: 'metric_name', labelName: 'label_name' };

    const result = visitor.aggregateResult(aggregate, nextResult);

    expect(result).toEqual(nextResult);
  });

  it('should return correct metric and label names when there are multiple metrics and labels', () => {
    const cursorIndex = 62;
    const query = 'metric_name1{label_name1="value"} / metric_name2{label_name2=""}';
    const ast = createAST(query);
    const visitor = new InstantSelectorVisitor(cursorIndex);

    const result = visitor.visit(ast);

    expect(result).toEqual({ metricName: 'metric_name2', labelName: 'label_name2' });
  });

  // TODO: write tests that include functions
  // TODO: write tests that have time ranges
  // TODO: write tests with aggregations, complexity
  // TODO: write tests mixed with labels, time ranges, etc
});

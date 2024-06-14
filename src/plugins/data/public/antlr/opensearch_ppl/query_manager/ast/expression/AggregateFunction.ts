/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLNode, QueryIndices, Tokens } from '../node';

export interface AggregateFunctionConstructorProps {
  name: string;
  children: PPLNode[];
  statsFunctionName: string;
  valueExpression: PPLNode;
  percentileAggFunction: string;
  takeAggFunction: string;
  indices: QueryIndices;
}

export class AggregateFunction extends PPLNode {
  private readonly statsFunctionName: string;
  private readonly valueExpression: PPLNode;
  private readonly percentileAggFunction: string;
  private readonly takeAggFunction: string;

  /**
   * Creates an instance of AggregateFunction.
   * @param name - The name of the node.
   * @param children - The children of the node.
   * @param statsFunctionName - The name of the statistics function.
   * @param valueExpression - The value expression of the function.
   * @param percentileAggFunction - The percentile aggregate function.
   * @param takeAggFunction - The take aggregate function.
   * @param indices - The start and end indices of the node in the original query.
   */
  constructor({
    name,
    children,
    statsFunctionName,
    valueExpression,
    percentileAggFunction,
    takeAggFunction,
    indices,
  }: AggregateFunctionConstructorProps) {
    super({ name, children, indices });
    this.statsFunctionName = statsFunctionName;
    this.valueExpression = valueExpression;
    this.percentileAggFunction = percentileAggFunction;
    this.takeAggFunction = takeAggFunction;
  }

  /**
   * Gets the tokens of the node.
   * @returns An object containing the statistics function name, value expression, percentile aggregate function, and take aggregate function.
   */
  getTokens(): Tokens {
    return {
      name: this.statsFunctionName,
      value_expression: this.valueExpression.getTokens(),
      percentile_agg_function: this.percentileAggFunction,
      takeAggFunction: this.takeAggFunction,
    };
  }

  /**
   * Gets a string representation of the node.
   * @returns A string representation of the aggregate function.
   */
  toString(): string {
    if (this.statsFunctionName && this.valueExpression) {
      return `${this.statsFunctionName}(${this.valueExpression})`;
    } else if (this.statsFunctionName) {
      return `${this.statsFunctionName}()`;
    } else if (this.percentileAggFunction) {
      return `${this.percentileAggFunction}`;
    } else if (this.takeAggFunction) {
      return `${this.takeAggFunction}`;
    }
    return '';
  }
}
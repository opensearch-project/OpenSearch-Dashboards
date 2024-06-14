/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLNode, QueryIndices, Tokens } from '../node';
import { GroupBy } from '../expression/group_by';

export interface AggregationsConstructorProps {
  name: string;
  children: PPLNode[];
  partitions: string;
  allNum: string;
  delim: string;
  aggExprList: PPLNode[];
  groupExprList: GroupBy;
  dedupSplitValue: string;
  indices: QueryIndices;
}

export class Aggregations extends PPLNode {
  private readonly partitions: string;
  private readonly allNum: string;
  private readonly delim: string;
  private readonly aggExprList: PPLNode[];
  private readonly groupExprList: GroupBy;
  private readonly dedupSplitValue: string;

  /**
   * Creates an instance of Aggregations.
   * @param name - The name of the node.
   * @param children - The children of the node.
   * @param partitions - The partitions.
   * @param allNum - The allNum.
   * @param delim - The delim.
   * @param aggExprList - The aggregation expression list.
   * @param groupExprList - The group expression list.
   * @param dedupSplitValue - The dedup split value.
   * @param indices - The start and end indices of the node in the original query.
   */
  constructor({
    name,
    children,
    partitions,
    allNum,
    delim,
    aggExprList,
    groupExprList,
    dedupSplitValue,
    indices,
  }: AggregationsConstructorProps) {
    super({ name, children, indices: indices ?? { start: -1, end: -1 } });
    this.partitions = partitions;
    this.allNum = allNum;
    this.delim = delim;
    this.aggExprList = aggExprList;
    this.groupExprList = groupExprList;
    this.dedupSplitValue = dedupSplitValue;
    this.indices = indices;
  }

  /**
   * Gets the tokens of the node.
   * @returns An object containing the partitions, allNum, delim, aggregations, groupby, and dedup split value.
   */
  getTokens(): Tokens {
    return {
      partitions: this.partitions,
      all_num: this.allNum,
      delim: this.delim,
      aggregations: this.aggExprList.map((aggTerm) => aggTerm.getTokens()),
      groupby: this.groupExprList.getTokens(),
      dedup_split_value: this.dedupSplitValue,
    };
  }

  /**
   * Gets a string representation of the node.
   * @returns A string representation of the aggregations.
   */
  toString(): string {
    return `stats ${this.partitions ? `${this.partitions} ` : ''}${
      this.allNum ? `${this.allNum} ` : ''
    }${this.delim ? `${this.delim} ` : ''}${this.aggExprList
      .map((aggTerm) => aggTerm.toString())
      .join(', ')}${this.groupExprList.toString()}${
      this.dedupSplitValue ? ` ${this.dedupSplitValue}` : ''
    }`;
  }
}

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  calculatePosition,
  DEFAULT_GRID_CONFIG,
  truncateToFitInWidget,
  computeDependencyTypes,
} from './celestial_node.utils';
import { AWS_SERVICE_NODE_TYPE } from '../constants/common.constants';

describe('calculatePosition', () => {
  it('returns {x:0, y:0} for index 0 with DEFAULT_GRID_CONFIG', () => {
    expect(calculatePosition(0, DEFAULT_GRID_CONFIG)).toEqual({ x: 0, y: 0 });
  });

  it('returns correct x,y for index 1', () => {
    expect(calculatePosition(1, DEFAULT_GRID_CONFIG)).toEqual({ x: 300, y: 0 });
  });

  it('wraps to next row for index 5', () => {
    expect(calculatePosition(5, DEFAULT_GRID_CONFIG)).toEqual({ x: 0, y: 100 });
  });

  it('returns correct x,y for index 7', () => {
    expect(calculatePosition(7, DEFAULT_GRID_CONFIG)).toEqual({ x: 600, y: 100 });
  });

  it('uses custom config when provided', () => {
    const config = {
      nodesPerRow: 3,
      horizontalSpacing: 200,
      verticalSpacing: 50,
      startX: 10,
      startY: 20,
    };
    expect(calculatePosition(4, config)).toEqual({ x: 210, y: 70 });
  });
});

describe('truncateToFitInWidget', () => {
  it('returns original string when length <= maxLength', () => {
    expect(truncateToFitInWidget('hello', 10)).toBe('hello');
  });

  it('truncates and adds "..." when length > maxLength', () => {
    expect(truncateToFitInWidget('hello world', 5)).toBe('hello...');
  });

  it('returns original string when length equals maxLength exactly', () => {
    expect(truncateToFitInWidget('hello', 5)).toBe('hello');
  });
});

describe('computeDependencyTypes', () => {
  const makeNode = (id: string, keyAttributes: Record<string, string> = {}) => ({
    NodeId: id,
    Name: id,
    Type: 'Service',
    KeyAttributes: keyAttributes,
    AttributeMaps: [],
  });

  const makeEdge = (source: string, dest: string) => ({
    SourceNodeId: source,
    DestinationNodeId: dest,
  });

  it('returns empty array when no outgoing edges', () => {
    const node = makeNode('A');
    expect(computeDependencyTypes(node, [], [node])).toEqual([]);
  });

  it('returns unique dependency types from ResourceType', () => {
    const nodeA = makeNode('A');
    const nodeB = makeNode('B', { ResourceType: 'AWS::DynamoDB::Table' });
    const edges = [makeEdge('A', 'B')];
    expect(computeDependencyTypes(nodeA, edges, [nodeA, nodeB])).toEqual(['AWS::DynamoDB::Table']);
  });

  it('returns Name from AWS service targets', () => {
    const nodeA = makeNode('A');
    const nodeB = makeNode('B', { Type: AWS_SERVICE_NODE_TYPE, Name: 'S3' });
    const edges = [makeEdge('A', 'B')];
    expect(computeDependencyTypes(nodeA, edges, [nodeA, nodeB])).toEqual(['S3']);
  });

  it('deduplicates types', () => {
    const nodeA = makeNode('A');
    const nodeB = makeNode('B', { ResourceType: 'AWS::Lambda::Function' });
    const nodeC = makeNode('C', { ResourceType: 'AWS::Lambda::Function' });
    const edges = [makeEdge('A', 'B'), makeEdge('A', 'C')];
    expect(computeDependencyTypes(nodeA, edges, [nodeA, nodeB, nodeC])).toEqual([
      'AWS::Lambda::Function',
    ]);
  });
});

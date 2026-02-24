/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TopologyNodeModel } from './topology-node.model';
import { TopologyNodePresenter } from '../presenters/topology-node.presenter';

const createNode = (overrides: Record<string, any> = {}) => ({
  NodeId: 'node-1',
  Name: 'TestService',
  Type: 'Service',
  KeyAttributes: { Type: 'Service' },
  AttributeMaps: [],
  ...overrides,
});

describe('TopologyNodeModel', () => {
  it('id returns node NodeId', () => {
    const model = new TopologyNodeModel(createNode({ NodeId: 'abc-123' }));
    expect(model.id).toBe('abc-123');
  });

  it('name returns node Name', () => {
    const model = new TopologyNodeModel(createNode({ Name: 'MyService' }));
    expect(model.name).toBe('MyService');
  });

  it('isGroup returns true when KeyAttributes.Type is ServiceGroup', () => {
    const model = new TopologyNodeModel(createNode({ KeyAttributes: { Type: 'ServiceGroup' } }));
    expect(model.isGroup).toBe(true);
  });

  it('isGroup returns false for other types', () => {
    const model = new TopologyNodeModel(createNode({ KeyAttributes: { Type: 'Service' } }));
    expect(model.isGroup).toBe(false);
  });

  it('type returns PlatformType when available', () => {
    const model = new TopologyNodeModel(
      createNode({
        AttributeMaps: [{ PlatformType: 'AWS::EKS' }],
        KeyAttributes: { Type: 'Service', ResourceType: 'AWS::Lambda' },
      })
    );
    expect(model.type).toBe('AWS::EKS');
  });

  it('type returns ResourceType when no PlatformType', () => {
    const model = new TopologyNodeModel(
      createNode({
        KeyAttributes: { Type: 'Service', ResourceType: 'AWS::Lambda' },
      })
    );
    expect(model.type).toBe('AWS::Lambda');
  });

  it('type returns Type when no PlatformType or ResourceType', () => {
    const model = new TopologyNodeModel(createNode({ Type: 'RemoteService' }));
    expect(model.type).toBe('RemoteService');
  });

  it('platform returns PlatformType from AttributeMaps', () => {
    const model = new TopologyNodeModel(
      createNode({ AttributeMaps: [{ PlatformType: 'AWS::ECS' }] })
    );
    expect(model.platform).toBe('AWS::ECS');
  });

  it('isInstrumented returns true when InstrumentationType is INSTRUMENTED', () => {
    const model = new TopologyNodeModel(
      createNode({ AttributeMaps: [{ InstrumentationType: 'INSTRUMENTED' }] })
    );
    expect(model.isInstrumented).toBe(true);
  });

  it('isInstrumented returns false when not instrumented', () => {
    const model = new TopologyNodeModel(
      createNode({ AttributeMaps: [{ InstrumentationType: 'NOT_INSTRUMENTED' }] })
    );
    expect(model.isInstrumented).toBe(false);
  });

  it('isInstrumented returns true for group with InstrumentedServiceCount > 0', () => {
    const model = new TopologyNodeModel(
      createNode({
        KeyAttributes: { Type: 'ServiceGroup' },
        AttributeMaps: [{ InstrumentedServiceCount: '3' }],
      })
    );
    expect(model.isInstrumented).toBe(true);
  });

  it('aggregatedNodeId returns correct value', () => {
    const model = new TopologyNodeModel(createNode({ AggregatedNodeId: 'agg-1' }));
    expect(model.aggregatedNodeId).toBe('agg-1');
  });

  it('numberOfServices returns count for groups', () => {
    const model = new TopologyNodeModel(
      createNode({
        KeyAttributes: { Type: 'ServiceGroup' },
        AttributeMaps: [{ InstrumentedServiceCount: '3', UninstrumentedServiceCount: '2' }],
      })
    );
    expect(model.numberOfServices).toBe(5);
  });

  it('numberOfServices returns 0 for non-groups', () => {
    const model = new TopologyNodeModel(createNode());
    expect(model.numberOfServices).toBe(0);
  });

  it('isDirectService returns true when not explicitly false', () => {
    const model = new TopologyNodeModel(createNode({ AttributeMaps: [{}] }));
    expect(model.isDirectService).toBe(true);
  });

  it('isDirectService returns false when attribute is false', () => {
    const model = new TopologyNodeModel(
      createNode({ AttributeMaps: [{ isDirectService: 'false' }] })
    );
    expect(model.isDirectService).toBe(false);
  });

  it('presenter returns TopologyNodePresenter instance', () => {
    const model = new TopologyNodeModel(createNode());
    expect(model.presenter).toBeInstanceOf(TopologyNodePresenter);
  });
});

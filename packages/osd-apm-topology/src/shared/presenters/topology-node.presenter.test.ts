/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TopologyNodePresenter } from './topology-node.presenter';
import { TopologyNodeModel } from '../models/topology-node.model';

const createMockModel = (overrides: Record<string, any> = {}): TopologyNodeModel =>
  (({
    name: 'TestNode',
    isGroup: false,
    platform: undefined,
    type: 'AWS::Lambda',
    groupType: undefined,
    numberOfServices: 0,
    numberOfUninstrumentedServices: 0,
    ...overrides,
  } as unknown) as TopologyNodeModel);

describe('TopologyNodePresenter', () => {
  it('title returns model name', () => {
    const presenter = new TopologyNodePresenter(createMockModel({ name: 'MyService' }));
    expect(presenter.title).toBe('MyService');
  });

  it('subtitle returns groupType for groups', () => {
    const presenter = new TopologyNodePresenter(
      createMockModel({ isGroup: true, groupType: 'Team' })
    );
    expect(presenter.subtitle).toBe('Team');
  });

  it('subtitle returns "Service" when platform is available', () => {
    const presenter = new TopologyNodePresenter(createMockModel({ platform: 'AWS::EKS' }));
    expect(presenter.subtitle).toBe('Service');
  });

  it('subtitle returns formatted type when no group or platform', () => {
    const presenter = new TopologyNodePresenter(createMockModel({ type: 'AWS::Lambda' }));
    expect(presenter.subtitle).toBe('AWS Lambda');
  });

  it('platform splits on "::" and converts to sentence case', () => {
    const presenter = new TopologyNodePresenter(createMockModel({ platform: 'AWS::ECS' }));
    expect(presenter.platform).toBe('AWS ECS');
  });

  it('type formats type string', () => {
    const presenter = new TopologyNodePresenter(createMockModel({ type: 'AWS::Lambda' }));
    expect(presenter.type).toBe('AWS Lambda');
  });

  it('numberOfServices returns string count', () => {
    const presenter = new TopologyNodePresenter(createMockModel({ numberOfServices: 5 }));
    expect(presenter.numberOfServices).toBe('5');
  });

  it('percentOfUninstrumentedServices returns formatted percentage', () => {
    const presenter = new TopologyNodePresenter(
      createMockModel({ numberOfServices: 10, numberOfUninstrumentedServices: 3 })
    );
    expect(presenter.percentOfUninstrumentedServices).toContain('30');
    expect(presenter.percentOfUninstrumentedServices).toContain('uninstrumented');
  });

  it('percentOfUninstrumentedServices returns 0% when none uninstrumented', () => {
    const presenter = new TopologyNodePresenter(
      createMockModel({ numberOfServices: 5, numberOfUninstrumentedServices: 0 })
    );
    expect(presenter.percentOfUninstrumentedServices).toContain('0');
    expect(presenter.percentOfUninstrumentedServices).toContain('uninstrumented');
  });

  it('groupType maps Related to Application', () => {
    const presenter = new TopologyNodePresenter(createMockModel({ groupType: 'Related' }));
    expect(presenter.groupType).toBe('Application');
  });

  it('groupType returns undefined when no groupType', () => {
    const presenter = new TopologyNodePresenter(createMockModel({ groupType: undefined }));
    expect(presenter.groupType).toBeUndefined();
  });
});

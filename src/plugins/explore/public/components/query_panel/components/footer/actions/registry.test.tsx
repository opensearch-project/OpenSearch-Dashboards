/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { QueryBarActionsRegistry, QueryBarAction } from './registry';

describe('QueryBarActionsRegistry', () => {
  let registry: QueryBarActionsRegistry;

  beforeEach(() => {
    registry = new QueryBarActionsRegistry();
  });

  it('registers and retrieves actions', () => {
    const action: QueryBarAction = { label: 'Test Action', onClick: jest.fn() };
    registry.register(action);
    expect(registry.getAll()).toEqual([action]);
  });

  it('returns a copy of actions array', () => {
    const action: QueryBarAction = { label: 'Test Action', onClick: jest.fn() };
    registry.register(action);
    const actions = registry.getAll();
    actions.push({ label: 'Another', onClick: jest.fn() });
    expect(registry.getAll()).toHaveLength(1);
  });

  it('clears all actions', () => {
    registry.register({ label: 'Action 1', onClick: jest.fn() });
    registry.clear();
    expect(registry.getAll()).toEqual([]);
  });
});

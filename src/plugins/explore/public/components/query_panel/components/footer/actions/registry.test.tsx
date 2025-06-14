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

  it('registers actions and returns a sorted, immutable copy of the actions array', () => {
    const action1: QueryBarAction = { id: 'a', label: 'A', onClick: jest.fn(), order: 2 };
    const action2: QueryBarAction = { id: 'b', label: 'B', onClick: jest.fn(), order: 1 };
    const action3: QueryBarAction = { id: 'c', label: 'C', onClick: jest.fn() }; // no order
    registry.register(action1);
    registry.register(action2);
    registry.register(action3);

    // Should be sorted by order, then id
    const actions = registry.getAll();
    expect(actions.map((a) => a.id)).toEqual(['b', 'a', 'c']);

    // Validate immutability
    actions.push({ id: 'd', label: 'D', onClick: jest.fn() });
    expect(registry.getAll()).toHaveLength(3);
  });

  it('clears all actions', () => {
    registry.register({ id: 'a', label: 'Action 1', onClick: jest.fn() });
    registry.clear();
    expect(registry.getAll()).toEqual([]);
  });
});

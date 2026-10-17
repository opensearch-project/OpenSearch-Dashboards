/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DirectQueryConnectionFlow,
  DirectQueryConnectionFlowRegistry,
  findOwningDirectQueryConnectionFlow,
  getVisibleDirectQueryConnectionFlows,
  isDirectQueryConnectionFlowVisible,
} from './direct_query_connection_flow_registry';

const createFlow = (
  overrides: Partial<DirectQueryConnectionFlow> = {}
): DirectQueryConnectionFlow => ({
  id: 'flowA',
  title: 'Flow A',
  buttonLabel: 'Connect A',
  mount: jest.fn(() => jest.fn()),
  ...overrides,
});

describe('DirectQueryConnectionFlowRegistry', () => {
  let registry: DirectQueryConnectionFlowRegistry;

  beforeEach(() => {
    registry = new DirectQueryConnectionFlowRegistry();
  });

  it('keeps the optional typeLabel of a registered flow', () => {
    registry.registerDirectQueryConnectionFlow(
      createFlow({ typeLabel: 'Example data connection' })
    );
    expect(registry.getFlow('flowA')?.typeLabel).toBe('Example data connection');
  });

  it('is empty by default', () => {
    expect(registry.hasFlows()).toBe(false);
    expect(registry.getAllFlows()).toEqual([]);
    expect(registry.getFlow('flowA')).toBeUndefined();
  });

  it('allows to register flows and retrieve them by id', () => {
    const flowA = createFlow({ id: 'flowA' });
    const flowB = createFlow({ id: 'example-flow' });
    registry.registerDirectQueryConnectionFlow(flowA);
    registry.registerDirectQueryConnectionFlow(flowB);

    expect(registry.hasFlows()).toBe(true);
    expect(registry.getAllFlows().map((f) => f.id)).toEqual(['flowA', 'example-flow']);
    expect(registry.getFlow('example-flow')).toEqual(flowB);
    expect(registry.getFlow('unknown')).toBeUndefined();
  });

  it('throws when registering the same flow id twice', () => {
    registry.registerDirectQueryConnectionFlow(createFlow({ id: 'flowA' }));
    expect(() =>
      registry.registerDirectQueryConnectionFlow(createFlow({ id: 'flowA' }))
    ).toThrowErrorMatchingInlineSnapshot(
      `"Direct query connection flow 'flowA' is already registered"`
    );
  });

  it('throws for invalid ids or a missing mount function', () => {
    expect(() => registry.registerDirectQueryConnectionFlow(createFlow({ id: '' }))).toThrow(
      /is invalid/
    );
    expect(() => registry.registerDirectQueryConnectionFlow(createFlow({ id: 'a/b' }))).toThrow(
      /is invalid/
    );
    expect(() =>
      registry.registerDirectQueryConnectionFlow(createFlow({ mount: undefined as any }))
    ).toThrow(/must provide a mount function/);
    expect(registry.hasFlows()).toBe(false);
  });

  it('forbids mutating registered flows', () => {
    registry.registerDirectQueryConnectionFlow(createFlow());
    const flow = registry.getFlow('flowA')!;
    expect(() => {
      (flow as any).title = 'changed';
    }).toThrow();
  });

  it('does not mutate the registry when altering the returned list', () => {
    registry.registerDirectQueryConnectionFlow(createFlow({ id: 'flowA' }));
    registry.registerDirectQueryConnectionFlow(createFlow({ id: 'flowB' }));
    registry.getAllFlows().splice(0, 2);
    expect(registry.getAllFlows()).toHaveLength(2);
  });

  describe('#findOwningFlow', () => {
    const so = { id: 'so-1', attributes: { ownerPlugin: 'example' }, workspaces: ['ws1'] };

    it('returns the first flow whose ownsConnection returns true', () => {
      registry.registerDirectQueryConnectionFlow(createFlow({ id: 'noPredicate' }));
      registry.registerDirectQueryConnectionFlow(
        createFlow({ id: 'notOwner', ownsConnection: () => false })
      );
      registry.registerDirectQueryConnectionFlow(
        createFlow({
          id: 'owner',
          ownsConnection: (o) => o.attributes.ownerPlugin === 'example',
        })
      );
      expect(registry.findOwningFlow(so)?.id).toBe('owner');
    });

    it('returns undefined when no flow owns the saved object', () => {
      registry.registerDirectQueryConnectionFlow(
        createFlow({ id: 'notOwner', ownsConnection: () => false })
      );
      expect(registry.findOwningFlow(so)).toBeUndefined();
    });

    it('treats a throwing ownsConnection as not owned', () => {
      registry.registerDirectQueryConnectionFlow(
        createFlow({
          id: 'throws',
          ownsConnection: () => {
            throw new Error('boom');
          },
        })
      );
      registry.registerDirectQueryConnectionFlow(
        createFlow({ id: 'owner', ownsConnection: () => true })
      );
      expect(registry.findOwningFlow(so)?.id).toBe('owner');
    });
  });
});

describe('isDirectQueryConnectionFlowVisible', () => {
  it('defaults to visible when isVisible is not provided', async () => {
    expect(await isDirectQueryConnectionFlowVisible(createFlow())).toBe(true);
  });

  it('supports sync and async isVisible', async () => {
    expect(await isDirectQueryConnectionFlowVisible(createFlow({ isVisible: () => true }))).toBe(
      true
    );
    expect(await isDirectQueryConnectionFlowVisible(createFlow({ isVisible: () => false }))).toBe(
      false
    );
    expect(
      await isDirectQueryConnectionFlowVisible(
        createFlow({ isVisible: () => Promise.resolve(true) })
      )
    ).toBe(true);
    expect(
      await isDirectQueryConnectionFlowVisible(
        createFlow({ isVisible: () => Promise.resolve(false) })
      )
    ).toBe(false);
  });

  it('fails closed when isVisible rejects or throws', async () => {
    expect(
      await isDirectQueryConnectionFlowVisible(
        createFlow({ isVisible: () => Promise.reject(new Error('nope')) })
      )
    ).toBe(false);
    expect(
      await isDirectQueryConnectionFlowVisible(
        createFlow({
          isVisible: () => {
            throw new Error('nope');
          },
        })
      )
    ).toBe(false);
  });
});

describe('getVisibleDirectQueryConnectionFlows', () => {
  it('returns only visible flows, preserving order', async () => {
    const flows = [
      createFlow({ id: 'a' }),
      createFlow({ id: 'b', isVisible: () => Promise.reject(new Error('x')) }),
      createFlow({ id: 'c', isVisible: () => Promise.resolve(true) }),
      createFlow({ id: 'd', isVisible: () => false }),
    ];
    expect((await getVisibleDirectQueryConnectionFlows(flows)).map((f) => f.id)).toEqual([
      'a',
      'c',
    ]);
  });
});

describe('findOwningDirectQueryConnectionFlow', () => {
  const so = { id: 'so-1', attributes: { ownerPlugin: 'example' } };

  it('only considers the given flows', () => {
    const owner = createFlow({ id: 'owner', ownsConnection: () => true });
    const other = createFlow({ id: 'other', ownsConnection: () => true });
    expect(findOwningDirectQueryConnectionFlow([other, owner], so)?.id).toBe('other');
    expect(findOwningDirectQueryConnectionFlow([owner], so)?.id).toBe('owner');
    expect(findOwningDirectQueryConnectionFlow([], so)).toBeUndefined();
  });
});

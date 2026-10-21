/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DirectQueryConnectionFlow,
  DirectQueryConnectionFlowRegistry,
  findOwningDirectQueryConnectionFlow,
  isDirectQueryConnectionFlowVisible,
} from './direct_query_connection_flow_registry';
import { DataConnectionType } from '../../../data_source/common';

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

  it('fails closed, and logs, when isVisible rejects or throws', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
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
    expect(error).toHaveBeenCalledTimes(2);
    expect(error.mock.calls[0][0]).toContain("'flowA'");
    error.mockRestore();
  });
});

describe('findOwningDirectQueryConnectionFlow', () => {
  const so = { id: 'so-1', attributes: { ownerPlugin: 'example' } };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('only considers the given flows', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const owner = createFlow({ id: 'owner', ownsConnection: () => true });
    const other = createFlow({ id: 'other', ownsConnection: () => true });
    expect(findOwningDirectQueryConnectionFlow([other, owner], so)?.id).toBe('other');
    expect(findOwningDirectQueryConnectionFlow([owner], so)?.id).toBe('owner');
    expect(findOwningDirectQueryConnectionFlow([], so)).toBeUndefined();
  });

  it('returns the first flow whose ownsConnection returns true', () => {
    const noPredicate = createFlow({ id: 'noPredicate' });
    const notOwner = createFlow({ id: 'notOwner', ownsConnection: () => false });
    const owner = createFlow({
      id: 'owner',
      ownsConnection: (o) => o.attributes.ownerPlugin === 'example',
    });
    expect(findOwningDirectQueryConnectionFlow([noPredicate, notOwner, owner], so)?.id).toBe(
      'owner'
    );
    expect(findOwningDirectQueryConnectionFlow([noPredicate, notOwner], so)).toBeUndefined();
  });

  it('treats a throwing ownsConnection as not owned, and logs the flow id', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    const throws = createFlow({
      id: 'throws',
      ownsConnection: () => {
        throw new Error('boom');
      },
    });
    const owner = createFlow({ id: 'owner', ownsConnection: () => true });
    expect(findOwningDirectQueryConnectionFlow([throws, owner], so)?.id).toBe('owner');
    expect(error).toHaveBeenCalledTimes(1);
    expect(error.mock.calls[0][0]).toContain("'throws'");
  });

  it('ignores claims on a connection of a built-in type', () => {
    const greedy = createFlow({ id: 'greedy', ownsConnection: () => true });
    Object.values(DataConnectionType).forEach((type) => {
      expect(
        findOwningDirectQueryConnectionFlow([greedy], { id: 'so-2', attributes: { type } })
      ).toBeUndefined();
    });
    expect(
      findOwningDirectQueryConnectionFlow([greedy], {
        id: 'so-3',
        attributes: { type: 'Example direct query' },
      })?.id
    ).toBe('greedy');
  });
});

describe('findOwningDirectQueryConnectionFlow with overlapping owners', () => {
  const so = { id: 'so-1', attributes: {} };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('warns outside production builds when more than one flow claims a connection', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const first = createFlow({ id: 'first', ownsConnection: () => true });
    const second = createFlow({ id: 'second', ownsConnection: () => true });
    expect(findOwningDirectQueryConnectionFlow([first, second], so)?.id).toBe('first');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain("'first', 'second'");
  });

  it('does not warn in production builds', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const env = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const first = createFlow({ id: 'first', ownsConnection: () => true });
      const second = createFlow({ id: 'second', ownsConnection: () => true });
      expect(findOwningDirectQueryConnectionFlow([first, second], so)?.id).toBe('first');
      expect(warn).not.toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = env;
    }
  });

  it('does not warn for a single owner', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const owner = createFlow({ id: 'owner', ownsConnection: () => true });
    const other = createFlow({ id: 'other', ownsConnection: () => false });
    expect(findOwningDirectQueryConnectionFlow([other, owner], so)?.id).toBe('owner');
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('DirectQueryConnectionFlowRegistry#getVisibleFlows', () => {
  it('resolves each isVisible once and shares the result', async () => {
    const registry = new DirectQueryConnectionFlowRegistry();
    const isVisibleA = jest.fn(() => Promise.resolve(true));
    const isVisibleB = jest.fn(() => false);
    registry.registerDirectQueryConnectionFlow(createFlow({ id: 'a', isVisible: isVisibleA }));
    registry.registerDirectQueryConnectionFlow(createFlow({ id: 'b', isVisible: isVisibleB }));

    const [first, second] = await Promise.all([
      registry.getVisibleFlows(),
      registry.getVisibleFlows(),
    ]);
    expect(first.map((flow) => flow.id)).toEqual(['a']);
    expect(second).toEqual(first);
    expect(await registry.isFlowVisible('a')).toBe(true);
    expect(await registry.isFlowVisible('b')).toBe(false);
    expect(await registry.isFlowVisible('unknown')).toBe(false);
    expect(isVisibleA).toHaveBeenCalledTimes(1);
    expect(isVisibleB).toHaveBeenCalledTimes(1);
  });

  it('waits only on the asked flow, so a hung isVisible delays no other flow', async () => {
    const registry = new DirectQueryConnectionFlowRegistry();
    registry.registerDirectQueryConnectionFlow(createFlow({ id: 'a' }));
    registry.registerDirectQueryConnectionFlow(
      createFlow({ id: 'hung', isVisible: () => new Promise<boolean>(() => {}) })
    );
    expect(await registry.isFlowVisible('a')).toBe(true);
  });

  it('retries a failed isVisible on the next call instead of caching it', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const registry = new DirectQueryConnectionFlowRegistry();
    const isVisible = jest
      .fn<Promise<boolean>, []>()
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValue(true);
    registry.registerDirectQueryConnectionFlow(createFlow({ id: 'a', isVisible }));
    expect(await registry.isFlowVisible('a')).toBe(false);
    expect(await registry.isFlowVisible('a')).toBe(true);
    expect(await registry.isFlowVisible('a')).toBe(true);
    expect(isVisible).toHaveBeenCalledTimes(2);
    jest.restoreAllMocks();
  });

  it('re-resolves after a new registration', async () => {
    const registry = new DirectQueryConnectionFlowRegistry();
    registry.registerDirectQueryConnectionFlow(createFlow({ id: 'a' }));
    expect((await registry.getVisibleFlows()).map((flow) => flow.id)).toEqual(['a']);
    registry.registerDirectQueryConnectionFlow(createFlow({ id: 'b' }));
    expect((await registry.getVisibleFlows()).map((flow) => flow.id)).toEqual(['a', 'b']);
  });
});

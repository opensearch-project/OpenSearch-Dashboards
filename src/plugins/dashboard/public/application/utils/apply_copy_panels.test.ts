/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { applyCopyPanels, revertCopyPanels } from './apply_copy_panels';

const makePanel = (id?: string, panelIndex = '1') => ({
  version: '3.0.0',
  type: 'visualization',
  panelIndex,
  gridData: { x: 0, y: 0, w: 24, h: 15, i: panelIndex },
  embeddableConfig: {},
  ...(id !== undefined && { id }),
});

const makeStateContainer = (panels: any[]) => {
  let current = panels;
  return {
    getState: jest.fn(() => ({ panels: current })),
    transitions: {
      set: jest.fn((prop: string, value: any) => {
        if (prop === 'panels') current = value;
      }),
    },
    _current: () => current,
  };
};

const makeClient = () => {
  let n = 0;
  return {
    bulkGet: jest.fn(async (objs: Array<{ type: string; id: string }>) => ({
      savedObjects: objs.map((o) => ({
        id: o.id,
        type: o.type,
        attributes: { title: `t-${o.id}` },
        references: [],
      })),
    })),
    bulkCreate: jest.fn(async (objs: any[]) => {
      return {
        savedObjects: objs.map((o) => {
          n += 1;
          return { id: o.id, type: o.type, attributes: o.attributes, references: o.references };
        }),
      };
    }),
    delete: jest.fn(async () => undefined),
  };
};

describe('applyCopyPanels / revertCopyPanels', () => {
  it('applyCopyPanels copies panels, sets repointed panels into state, and returns created objects + failures', async () => {
    const original = [makePanel('viz-1')];
    const sc = makeStateContainer(original);
    const client = makeClient();

    const {
      originalPanels,
      createdObjects: created,
      failures,
    } = await applyCopyPanels(client as any, sc as any);

    expect(created).toHaveLength(1);
    expect(failures).toEqual([]);
    expect(originalPanels).toBe(original);
    expect(sc.transitions.set).toHaveBeenCalledWith('panels', expect.any(Array));
    // state now holds the repointed panel (new id, same layout)
    expect(sc._current()[0].id).toBe(created[0].id);
    expect(sc._current()[0].id).not.toBe('viz-1');
    expect(sc._current()[0].panelIndex).toBe('1');
  });

  it('revertCopyPanels restores the original panels and deletes the created copies (save-path rollback)', async () => {
    const original = [makePanel('viz-1')];
    const sc = makeStateContainer(original);
    const client = makeClient();

    const { originalPanels, createdObjects: created } = await applyCopyPanels(
      client as any,
      sc as any
    );
    await revertCopyPanels(client as any, sc as any, originalPanels, created);

    // original panels restored
    expect(sc._current()).toBe(original);
    // every created copy deleted
    expect(client.delete).toHaveBeenCalledTimes(created.length);
    expect(client.delete).toHaveBeenCalledWith(created[0].type, created[0].id);
  });

  it('revertCopyPanels tolerates delete failures (best-effort)', async () => {
    const original = [makePanel('viz-1')];
    const sc = makeStateContainer(original);
    const client = makeClient();
    const { originalPanels, createdObjects: created } = await applyCopyPanels(
      client as any,
      sc as any
    );
    client.delete.mockRejectedValueOnce(new Error('delete boom'));
    await expect(
      revertCopyPanels(client as any, sc as any, originalPanels, created)
    ).resolves.toBeUndefined();
    expect(sc._current()).toBe(original);
  });
});

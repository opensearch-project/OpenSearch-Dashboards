/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  copyDashboardPanels,
  CopyPanelsAbortError,
  MAX_COPY_PANELS_BATCH_SIZE,
} from './copy_dashboard_panels';
import { SavedDashboardPanel } from '../../types';

const makePanel = (overrides: Partial<SavedDashboardPanel> = {}): SavedDashboardPanel =>
  ({
    version: '3.0.0',
    type: 'visualization',
    panelIndex: '1',
    gridData: { x: 0, y: 0, w: 24, h: 15, i: '1' },
    embeddableConfig: {},
    id: 'viz-1',
    ...overrides,
  }) as unknown as SavedDashboardPanel;

// A bulk-capable saved objects client stub.
const makeClient = (opts: { failCreateIds?: string[]; failGetIds?: string[] } = {}) => {
  const failCreate = new Set(opts.failCreateIds ?? []);
  const failGet = new Set(opts.failGetIds ?? []);
  const counter = 0;
  const bulkCreateCalls: any[] = [];
  const bulkGetCalls: any[] = [];
  return {
    bulkCreateCalls,
    bulkGetCalls,
    bulkGet: jest.fn(async (objs: Array<{ type: string; id: string }>) => {
      bulkGetCalls.push(objs);
      return {
        savedObjects: objs.map((o) =>
          failGet.has(o.id)
            ? // Mirror SimpleSavedObject: a missing/errored item still has a
              // truthy (empty) `attributes`, and the error is set separately. This
              // ensures the test exercises the real `so.error` detection, not the
              // dead `!so.attributes` arm.
              {
                type: o.type,
                id: o.id,
                attributes: {},
                error: { statusCode: 404, message: 'Not Found' },
              }
            : {
                type: o.type,
                id: o.id,
                attributes: { title: `title-${o.id}` },
                references: [{ name: 'ref', type: 'index-pattern', id: `ip-for-${o.id}` }],
              }
        ),
      };
    }),
    bulkCreate: jest.fn(async (objs: any[]) => {
      bulkCreateCalls.push(objs);
      return {
        savedObjects: objs.map((o) =>
          failCreate.has(o.id)
            ? { type: o.type, id: o.id, error: { statusCode: 500, message: 'boom' } }
            : { type: o.type, id: o.id, attributes: o.attributes, references: o.references }
        ),
      };
    }),
    delete: jest.fn(async () => undefined),
  };
};

describe('copyDashboardPanels (bulk)', () => {
  it('bulk-copies by-reference panels, repoints ids, preserves layout', async () => {
    const client = makeClient();
    const panels = [makePanel({ panelIndex: '1', id: 'viz-1' })];
    const {
      panels: out,
      createdObjects,
      failures,
    } = await copyDashboardPanels(client as any, panels);

    expect(client.bulkGet).toHaveBeenCalledTimes(1);
    expect(client.bulkCreate).toHaveBeenCalledTimes(1);
    expect(createdObjects).toHaveLength(1);
    expect(failures).toHaveLength(0);
    expect(out[0].id).toBe(createdObjects[0].id);
    expect(out[0].id).not.toBe('viz-1');
    expect(out[0].panelIndex).toBe('1');
    expect(out[0].gridData).toEqual(panels[0].gridData);
  });

  it('keeps the copy referencing the original downstream objects (shared)', async () => {
    const client = makeClient();
    await copyDashboardPanels(client as any, [makePanel({ id: 'viz-1' })]);
    const created = client.bulkCreate.mock.calls[0][0][0];
    expect(created.references).toEqual([
      { name: 'ref', type: 'index-pattern', id: 'ip-for-viz-1' },
    ]);
  });

  it('applies the default title template "{{panelTitle}} (copy)"', async () => {
    const client = makeClient();
    await copyDashboardPanels(client as any, [makePanel({ id: 'viz-1' })]);
    expect(client.bulkCreate.mock.calls[0][0][0].attributes.title).toBe('title-viz-1 (copy)');
  });

  it('applies a custom template with {{panelTitle}}/{{dashboardTitle}}', async () => {
    const client = makeClient();
    await copyDashboardPanels(client as any, [makePanel({ id: 'viz-1' })], {
      titleTemplate: '{{panelTitle}} - {{dashboardTitle}}',
      dashboardTitle: 'My Clone',
    });
    expect(client.bulkCreate.mock.calls[0][0][0].attributes.title).toBe('title-viz-1 - My Clone');
  });

  it('passes by-value panels (no id) through unchanged and does not copy them', async () => {
    const client = makeClient();
    const byValue = makePanel({ id: undefined, panelIndex: '2', embeddableConfig: { x: 1 } });
    const { panels: out, createdObjects } = await copyDashboardPanels(client as any, [byValue]);
    expect(client.bulkCreate).not.toHaveBeenCalled();
    expect(createdObjects).toHaveLength(0);
    expect(out[0]).toBe(byValue);
  });

  it('uses each panel type for bulkGet/bulkCreate (generic over types)', async () => {
    const client = makeClient();
    await copyDashboardPanels(client as any, [
      makePanel({ type: 'search', id: 's-1', panelIndex: '1' }),
      makePanel({ type: 'explore', id: 'e-1', panelIndex: '2' }),
    ]);
    expect(client.bulkGet.mock.calls[0][0]).toEqual([
      { type: 'search', id: 's-1' },
      { type: 'explore', id: 'e-1' },
    ]);
    const createTypes = client.bulkCreate.mock.calls[0][0].map((o: any) => o.type);
    expect(createTypes).toEqual(['search', 'explore']);
  });

  it('reports per-panel create failures and leaves those panels pointing at the original', async () => {
    const client = makeClient({ failCreateIds: [] });
    // make the SECOND panel's create fail
    const panels = [
      makePanel({ id: 'viz-1', panelIndex: '1' }),
      makePanel({ id: 'viz-2', panelIndex: '2' }),
    ];
    // intercept bulkCreate to fail the one whose source is viz-2
    client.bulkCreate.mockImplementationOnce(async (objs: any[]) => ({
      savedObjects: objs.map((o, i) =>
        i === 1
          ? { type: o.type, id: o.id, error: { statusCode: 500, message: 'boom' } }
          : { type: o.type, id: o.id, attributes: o.attributes, references: o.references }
      ),
    }));
    const {
      panels: out,
      createdObjects,
      failures,
    } = await copyDashboardPanels(client as any, panels);
    expect(createdObjects).toHaveLength(1);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatchObject({ panelIndex: '2', type: 'visualization', id: 'viz-2' });
    // panel_1 repointed, panel_2 still points at original viz-2
    expect(out.find((p) => p.panelIndex === '1')!.id).not.toBe('viz-1');
    expect(out.find((p) => p.panelIndex === '2')!.id).toBe('viz-2');
  });

  it('reports bulkGet failures as copy failures (panel left shared)', async () => {
    const client = makeClient({ failGetIds: ['viz-1'] });
    const {
      createdObjects,
      failures,
      panels: out,
    } = await copyDashboardPanels(client as any, [makePanel({ id: 'viz-1', panelIndex: '1' })]);
    expect(client.bulkCreate).not.toHaveBeenCalled();
    expect(createdObjects).toHaveLength(0);
    expect(failures).toEqual([{ panelIndex: '1', type: 'visualization', id: 'viz-1' }]);
    expect(out[0].id).toBe('viz-1');
  });

  it('chunks bulk requests to MAX_COPY_PANELS_BATCH_SIZE', async () => {
    const client = makeClient();
    const n = MAX_COPY_PANELS_BATCH_SIZE + 5;
    const panels = Array.from({ length: n }, (_, i) =>
      makePanel({ id: `viz-${i}`, panelIndex: String(i + 1) })
    );
    const { createdObjects } = await copyDashboardPanels(client as any, panels);
    expect(createdObjects).toHaveLength(n);
    expect(client.bulkGet).toHaveBeenCalledTimes(2); // 20 + 5
    expect(client.bulkCreate).toHaveBeenCalledTimes(2);
    expect(client.bulkGet.mock.calls[0][0]).toHaveLength(MAX_COPY_PANELS_BATCH_SIZE);
    expect(client.bulkGet.mock.calls[1][0]).toHaveLength(5);
  });

  it('aborts before dispatching the first batch when already aborted and rolls back nothing', async () => {
    const client = makeClient();
    const ac = new AbortController();
    ac.abort();
    await expect(
      copyDashboardPanels(client as any, [makePanel({ id: 'viz-1' })], { signal: ac.signal })
    ).rejects.toBeInstanceOf(CopyPanelsAbortError);
    expect(client.bulkGet).not.toHaveBeenCalled();
    expect(client.bulkCreate).not.toHaveBeenCalled();
  });

  it('aborts before the create phase and rolls back nothing created yet', async () => {
    const client = makeClient();
    const ac = new AbortController();
    // abort during bulkGet so the create phase is skipped
    client.bulkGet.mockImplementationOnce(async (objs: any[]) => {
      ac.abort();
      return {
        savedObjects: objs.map((o) => ({
          type: o.type,
          id: o.id,
          attributes: { title: `title-${o.id}` },
          references: [],
        })),
      };
    });
    await expect(
      copyDashboardPanels(client as any, [makePanel({ id: 'viz-1' })], { signal: ac.signal })
    ).rejects.toBeInstanceOf(CopyPanelsAbortError);
    expect(client.bulkCreate).not.toHaveBeenCalled();
    expect(client.delete).not.toHaveBeenCalled();
  });

  it('rolls back copies created in an earlier batch when a later batch is aborted', async () => {
    const client = makeClient();
    const ac = new AbortController();
    // 25 panels -> two create batches (20 + 5). Abort right after the FIRST
    // create batch resolves, so the second batch's pre-check throws and the
    // 20 already-created copies must be rolled back.
    let createBatch = 0;
    const realBulkCreate = client.bulkCreate.getMockImplementation()!;
    client.bulkCreate.mockImplementation(async (objs: any[]) => {
      const resp = await realBulkCreate(objs);
      createBatch += 1;
      if (createBatch === 1) ac.abort();
      return resp;
    });
    const n = MAX_COPY_PANELS_BATCH_SIZE + 5;
    const panels = Array.from({ length: n }, (_, i) =>
      makePanel({ id: `viz-${i}`, panelIndex: String(i + 1) })
    );
    await expect(
      copyDashboardPanels(client as any, panels, { signal: ac.signal })
    ).rejects.toBeInstanceOf(CopyPanelsAbortError);
    // the 20 copies created by the first batch are deleted (best-effort)
    expect(client.delete).toHaveBeenCalledTimes(MAX_COPY_PANELS_BATCH_SIZE);
  });

  it('gives two panels that reference the SAME object two independent copies', async () => {
    const client = makeClient();
    const panels = [
      makePanel({ id: 'viz-shared', panelIndex: '1' }),
      makePanel({ id: 'viz-shared', panelIndex: '2' }),
    ];
    const { createdObjects, panels: out } = await copyDashboardPanels(client as any, panels);
    // two bulkGet entries for the same id, two creates, two distinct new ids
    expect(client.bulkGet.mock.calls[0][0]).toEqual([
      { type: 'visualization', id: 'viz-shared' },
      { type: 'visualization', id: 'viz-shared' },
    ]);
    expect(createdObjects).toHaveLength(2);
    const id1 = out.find((pp) => pp.panelIndex === '1')!.id;
    const id2 = out.find((pp) => pp.panelIndex === '2')!.id;
    expect(id1).not.toBe('viz-shared');
    expect(id2).not.toBe('viz-shared');
    expect(id1).not.toBe(id2);
  });
});

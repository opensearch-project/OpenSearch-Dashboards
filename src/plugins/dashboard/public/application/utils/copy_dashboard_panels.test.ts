/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { cloneDeep } from 'lodash';
import {
  copyDashboardPanels,
  isPanelTitleTemplateValid,
  renderPanelTitle,
} from './copy_dashboard_panels';

const panel = (panelIndex: string, id?: string, type = 'visualization') =>
  ({ panelIndex, id, type, gridData: { x: 0, y: 0, w: 1, h: 1, i: panelIndex } }) as any;

const createClient = (
  attributesOf = (id: string): Record<string, unknown> => ({ title: `T-${id}` })
) => ({
  bulkGet: jest.fn(async (objects: Array<{ type: string; id: string }>) => ({
    savedObjects: objects.map(({ type, id }) =>
      id.startsWith('missing')
        ? { type, id, attributes: {}, error: { statusCode: 404 } }
        : {
            type,
            id,
            attributes: attributesOf(id),
            references: [{ id: 'ip' }],
            migrationVersion: { visualization: '7.10.0' },
          }
    ),
  })),
  bulkCreate: jest.fn(async (objects: any[]) => ({
    savedObjects: objects.map((o) =>
      o.attributes.title === 'T-bad (copy)'
        ? { ...o, error: { statusCode: 409 } }
        : { ...o, id: `new-${o.attributes.title}` }
    ),
  })),
  delete: jest.fn(async () => ({})),
});

const options = { titleTemplate: '{{panelTitle}} (copy)', dashboardTitle: 'D' };

describe('renderPanelTitle', () => {
  it('replaces both tokens', () => {
    expect(renderPanelTitle('{{panelTitle}} in {{dashboardTitle}}', 'P', 'D')).toBe('P in D');
  });
  it('does not expand tokens inside the panel title', () => {
    expect(renderPanelTitle('{{panelTitle}}!', 'A {{dashboardTitle}}', 'D')).toBe(
      'A {{dashboardTitle}}!'
    );
  });
  it('requires a non-empty template with {{panelTitle}}', () => {
    expect(isPanelTitleTemplateValid('  ')).toBe(false);
    expect(isPanelTitleTemplateValid('copy')).toBe(false);
    expect(isPanelTitleTemplateValid('{{panelTitle}}')).toBe(true);
  });
});

describe('copyDashboardPanels', () => {
  it('copies by-reference panels and repoints them', async () => {
    const client = createClient();
    const result = await copyDashboardPanels(client as any, [panel('1', 'a'), panel('2')], options);

    const created = client.bulkCreate.mock.calls[0][0];
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({
      type: 'visualization',
      attributes: { title: 'T-a (copy)' },
      references: [{ id: 'ip' }],
      migrationVersion: { visualization: '7.10.0' },
    });
    expect(result.panels[0].id).toBe('new-T-a (copy)');
    expect(result.panels[1].id).toBeUndefined();
    expect(result.failures).toEqual([]);
  });

  it('applies the template to custom panel titles of copied panels only', async () => {
    const client = createClient();
    const result = await copyDashboardPanels(
      client as any,
      [
        { ...panel('1', 'a'), title: 'Custom A' },
        { ...panel('2', 'a'), title: 'Custom B' },
        { ...panel('3', 'a'), title: '' },
        { ...panel('4', 'missing'), title: 'Custom M' },
      ],
      options
    );
    expect(result.panels.map((p) => p.title)).toEqual([
      'Custom A (copy)',
      'Custom B (copy)',
      '',
      'Custom M',
    ]);
  });

  it('applies the template to a custom title kept in embeddableConfig', async () => {
    const client = createClient();
    const panels = [
      { ...panel('1', 'a'), embeddableConfig: { title: 'Old', hidePanelTitles: false } },
      { ...panel('2', 'a'), title: 'Top', embeddableConfig: { title: 'Config' } },
      { ...panel('3', 'missing'), embeddableConfig: { title: 'Kept' } },
    ];
    const before = cloneDeep(panels);
    const result = await copyDashboardPanels(client as any, panels, options);

    expect(result.panels[0].embeddableConfig).toEqual({
      title: 'Old (copy)',
      hidePanelTitles: false,
    });
    expect(result.panels[1].title).toBe('Top (copy)');
    expect(result.panels[1].embeddableConfig).toEqual({ title: 'Config (copy)' });
    expect(result.panels[2]).toEqual(before[2]);
    expect(panels).toEqual(before);
  });

  it('applies the template to the chart title of an explore object only', async () => {
    const vis = (title: string) => JSON.stringify({ title, chartType: 'line' });
    const visById: Record<string, string> = {
      e1: vis('Chart'),
      e2: vis(''),
      e3: '{bad',
      e4: 'null',
      e5: '[]',
      e6: '5',
      v1: vis('Chart'),
    };
    const client = createClient((id) => ({ title: `T-${id}`, visualization: visById[id] }));
    await copyDashboardPanels(
      client as any,
      [
        ...['e1', 'e2', 'e3', 'e4', 'e5', 'e6'].map((id) => panel(id, id, 'explore')),
        panel('v1', 'v1', 'visualization'),
      ],
      options
    );
    const created = client.bulkCreate.mock.calls[0][0].map((o: any) => o.attributes);
    expect(created[0]).toEqual({ title: 'T-e1 (copy)', visualization: vis('Chart (copy)') });
    expect(created.slice(1).map((a: any) => a.visualization)).toEqual([
      vis(''),
      '{bad',
      'null',
      '[]',
      '5',
      vis('Chart'),
    ]);
  });

  it('names failed panels by their custom title when they have one', async () => {
    const client = createClient();
    const result = await copyDashboardPanels(
      client as any,
      [
        { ...panel('1', 'missing'), title: 'My panel' },
        { ...panel('2', 'bad'), embeddableConfig: { title: 'Legacy' } },
        { ...panel('3', 'missing2'), title: '' },
        { ...panel('4', 'missing3'), title: 'Top', embeddableConfig: { title: 'Shown' } },
        { ...panel('5', 'missing4'), title: 'Hidden', embeddableConfig: { title: '' } },
      ],
      options
    );
    expect(result.failures).toEqual([
      'My panel',
      'Legacy',
      'visualization:missing2',
      'Shown',
      'visualization:missing4',
    ]);
  });

  it('copies an object once when several panels share it', async () => {
    const client = createClient();
    const result = await copyDashboardPanels(
      client as any,
      [panel('1', 'a'), panel('2', 'a'), panel('3', 'missing'), panel('4', 'missing')],
      options
    );

    expect(client.bulkGet.mock.calls[0][0]).toEqual([
      { type: 'visualization', id: 'a' },
      { type: 'visualization', id: 'missing' },
    ]);
    expect(client.bulkCreate.mock.calls[0][0]).toHaveLength(1);
    expect(result.panels.map((p) => p.id)).toEqual([
      'new-T-a (copy)',
      'new-T-a (copy)',
      'missing',
      'missing',
    ]);
    expect(result.failures).toEqual(['visualization:missing', 'visualization:missing']);
  });

  it('keeps panels that fail to read or create on the original object', async () => {
    const client = createClient();
    const result = await copyDashboardPanels(
      client as any,
      [panel('1', 'missing'), panel('2', 'bad'), panel('3', 'ok')],
      options
    );
    expect(result.panels.map((p) => p.id)).toEqual(['missing', 'bad', 'new-T-ok (copy)']);
    expect(result.failures).toEqual(['visualization:missing', 'T-bad']);
  });

  it('calls onCopied only after a copy is created', async () => {
    const onCopied = jest.fn();
    const client = createClient();
    await copyDashboardPanels(client as any, [panel('1', 'missing')], { ...options, onCopied });
    expect(onCopied).not.toHaveBeenCalled();
    await copyDashboardPanels(client as any, [panel('1', 'a')], { ...options, onCopied });
    expect(onCopied).toHaveBeenCalledTimes(1);
  });

  it('copies in batches of 20', async () => {
    const client = createClient();
    const panels = Array.from({ length: 21 }, (_, i) => panel(`${i}`, `id${i}`));
    await copyDashboardPanels(client as any, panels, options);
    expect(client.bulkGet).toHaveBeenCalledTimes(2);
    expect(client.bulkCreate).toHaveBeenCalledTimes(2);
  });

  it('rethrows and keeps created copies when a create request fails', async () => {
    const client = createClient();
    client.bulkCreate
      .mockImplementationOnce(async (objects: any[]) => ({ savedObjects: objects }))
      .mockRejectedValueOnce(new Error('network'));
    const panels = Array.from({ length: 21 }, (_, i) => panel(`${i}`, `id${i}`));

    await expect(copyDashboardPanels(client as any, panels, options)).rejects.toThrow('network');
    expect(client.delete).not.toHaveBeenCalled();
  });

  it('sends no more requests and keeps created copies when aborted', async () => {
    const client = createClient();
    const controller = new AbortController();
    client.bulkCreate.mockImplementationOnce(async (objects: any[]) => {
      controller.abort();
      return { savedObjects: objects };
    });

    await expect(
      copyDashboardPanels(client as any, [panel('1', 'a')], {
        ...options,
        signal: controller.signal,
      })
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(client.delete).not.toHaveBeenCalled();
  });
});

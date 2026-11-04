/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  copyDashboardPanels,
  isPanelTitleTemplateValid,
  renderPanelTitle,
} from './copy_dashboard_panels';

const panel = (panelIndex: string, id?: string, type = 'visualization') =>
  ({ panelIndex, id, type, gridData: { x: 0, y: 0, w: 1, h: 1, i: panelIndex } }) as any;

const createClient = () => ({
  bulkGet: jest.fn(async (objects: Array<{ type: string; id: string }>) => ({
    savedObjects: objects.map(({ type, id }) =>
      id.startsWith('missing')
        ? { type, id, attributes: {}, error: { statusCode: 404 } }
        : {
            type,
            id,
            attributes: { title: `T-${id}` },
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

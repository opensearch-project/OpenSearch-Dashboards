/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getUniquePanelCopyTitle } from './get_unique_panel_copy_title';

const clientWithTotal = (total: number) => ({
  find: jest.fn(async () => ({ total, savedObjects: [], page: 1, perPage: 0 })),
});

describe('getUniquePanelCopyTitle', () => {
  it('appends "(copy)" when no other base-titled objects exist (total 1 = the source)', async () => {
    const client = clientWithTotal(1);
    const title = await getUniquePanelCopyTitle(client as any, 'My Viz', 'visualization');
    expect(title).toBe('My Viz (copy)');
  });

  it('appends "(copy N)" when N other base-titled objects already exist', async () => {
    const client = clientWithTotal(3); // source + 2 existing copies -> total-1 = 2
    const title = await getUniquePanelCopyTitle(client as any, 'My Viz', 'visualization');
    expect(title).toBe('My Viz (copy 2)');
  });

  it('strips an existing "(copy)" / "(copy N)" suffix before computing the base title', async () => {
    const client = clientWithTotal(1);
    expect(await getUniquePanelCopyTitle(client as any, 'My Viz (copy)', 'visualization')).toBe(
      'My Viz (copy)'
    );
    expect(await getUniquePanelCopyTitle(client as any, 'My Viz (copy 4)', 'visualization')).toBe(
      'My Viz (copy)'
    );
    // the search is performed against the stripped base title
    const searchArg = (client.find as jest.Mock).mock.calls.pop()[0].search;
    expect(searchArg).toBe('"My Viz"');
  });
});

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getTopNavLinks } from './get_top_nav_links';
import { newTopNavData } from './top_nav_new';
import { openTopNavData } from './top_nav_open';
import { saveTopNavData } from './top_nav_save';
import { shareTopNavData } from './top_nav_share';

const mockServices = (overrides: any = {}) => ({
  capabilities: { discover: { save: true } },
  share: {},
  ...overrides,
});

const startSyncingQueryStateWithUrl = jest.fn();
const searchContext = {} as any;
// @ts-expect-error TS6133 TODO(ts-error): fixme
const indexPattern = {} as any;
const savedExplore = {} as any;
const clearEditors = jest.fn();

const mockDataset = {} as any;
const mockTabState = {} as any;
const mockTabDefinition = { id: 'logs' } as any;

describe('getTopNavLinks', () => {
  it('returns save, open, new, and share links when all capabilities and services are present', () => {
    const links = getTopNavLinks(
      mockServices(),
      startSyncingQueryStateWithUrl,
      searchContext,
      {
        dataset: mockDataset,
        tabState: mockTabState,
        flavorId: 'logs',
        tabDefinition: mockTabDefinition,
        activeTabId: 'logs',
      },
      clearEditors,
      savedExplore
    );
    expect(links).toHaveLength(4);
    expect(links[0]).toMatchObject(saveTopNavData);
    expect(links[1]).toMatchObject(openTopNavData);
    expect(links[2]).toMatchObject(newTopNavData);
    expect(links[3]).toMatchObject(shareTopNavData);
    expect(typeof links[0].run).toBe('function');
    expect(typeof links[1].run).toBe('function');
    expect(typeof links[2].run).toBe('function');
    expect(typeof links[3].run).toBe('function');
  });

  it('omits save link if capabilities.discover.save is false', () => {
    const services = mockServices({ capabilities: { discover: { save: false } } });
    const links = getTopNavLinks(
      services,
      startSyncingQueryStateWithUrl,
      searchContext,
      {
        dataset: mockDataset,
        tabState: mockTabState,
        flavorId: 'logs',
        tabDefinition: mockTabDefinition,
        activeTabId: 'logs',
      },
      clearEditors,
      savedExplore
    );
    expect(links).toHaveLength(3);
    expect(links[0]).toMatchObject(openTopNavData);
    expect(links[1]).toMatchObject(newTopNavData);
    expect(links[2]).toMatchObject(shareTopNavData);
  });

  it('omits share link if share service is missing', () => {
    const services = mockServices({ share: undefined });
    const links = getTopNavLinks(
      services,
      startSyncingQueryStateWithUrl,
      searchContext,
      {
        dataset: mockDataset,
        tabState: mockTabState,
        flavorId: 'logs',
        tabDefinition: mockTabDefinition,
        activeTabId: 'logs',
      },
      clearEditors,
      savedExplore
    );
    expect(links).toHaveLength(3);
    expect(links[0]).toMatchObject(saveTopNavData);
    expect(links[1]).toMatchObject(openTopNavData);
    expect(links[2]).toMatchObject(newTopNavData);
  });

  it('always includes open and new links', () => {
    const services = mockServices({
      capabilities: { discover: { save: false } },
      share: undefined,
    });
    const links = getTopNavLinks(
      services,
      startSyncingQueryStateWithUrl,
      searchContext,
      {
        dataset: mockDataset,
        tabState: mockTabState,
        flavorId: 'logs',
        tabDefinition: mockTabDefinition,
        activeTabId: 'logs',
      },
      clearEditors,
      savedExplore
    );
    expect(links).toHaveLength(2);
    expect(links[0]).toMatchObject(openTopNavData);
    expect(links[1]).toMatchObject(newTopNavData);
  });
});

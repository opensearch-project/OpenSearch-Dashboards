/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { shareTopNavData, getShareButtonRun } from './top_nav_share';

jest.mock('./helpers', () => ({
  getSharingData: jest.fn(() => Promise.resolve({ foo: 'bar' })),
}));
jest.mock('../../../../../../opensearch_dashboards_utils/public', () => ({
  unhashUrl: jest.fn((url) => `unhashed:${url}`),
}));

describe('shareTopNavData', () => {
  it('should have correct properties', () => {
    expect(shareTopNavData).toMatchObject({
      tooltip: expect.any(String),
      ariaLabel: expect.any(String),
      testId: 'shareTopNavButton',
      iconType: 'share',
      controlType: 'icon',
    });
  });
});

describe('getShareButtonRun', () => {
  const mockToggleShareContextMenu = jest.fn();
  const mockGetState = jest.fn(() => ({
    legacy: { isDirty: false },
  }));

  const baseServices = {
    share: { toggleShareContextMenu: mockToggleShareContextMenu },
    store: { getState: mockGetState },
    capabilities: { discover: { createShortUrl: true } },
  } as any;

  const savedExplore = {
    id: '123',
    title: 'Test Search',
    searchSource: {},
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    (window as any).location = { href: 'http://localhost/test' };
  });

  it('should do nothing if savedExplore is missing', async () => {
    const run = getShareButtonRun(baseServices, undefined);
    await run({} as never);
    expect(mockToggleShareContextMenu).not.toHaveBeenCalled();
  });

  it('should do nothing if share service is missing', async () => {
    const run = getShareButtonRun({ ...baseServices, share: undefined }, savedExplore);
    await run({} as never);
    expect(mockToggleShareContextMenu).not.toHaveBeenCalled();
  });

  it('should call toggleShareContextMenu with correct params', async () => {
    const run = getShareButtonRun(baseServices, savedExplore);
    await run({} as never);

    expect(mockToggleShareContextMenu).toHaveBeenCalledWith(
      expect.objectContaining({
        allowEmbed: false,
        allowShortUrl: true,
        shareableUrl: 'unhashed:http://localhost/',
        objectId: '123',
        objectType: 'search',
        sharingData: expect.objectContaining({
          foo: 'bar',
          title: 'Test Search',
        }),
        isDirty: false,
      })
    );
  });

  it('should set isDirty true if savedExplore.id is missing', async () => {
    const run = getShareButtonRun(baseServices, { ...savedExplore, id: undefined });
    await run({} as never);
    expect(mockToggleShareContextMenu).toHaveBeenCalledWith(
      expect.objectContaining({ isDirty: true })
    );
  });

  it('should set isDirty true if legacyState.isDirty is true', async () => {
    mockGetState.mockReturnValueOnce({ legacy: { isDirty: true } });
    const run = getShareButtonRun(baseServices, savedExplore);
    await run({} as never);
    expect(mockToggleShareContextMenu).toHaveBeenCalledWith(
      expect.objectContaining({ isDirty: true })
    );
  });
});

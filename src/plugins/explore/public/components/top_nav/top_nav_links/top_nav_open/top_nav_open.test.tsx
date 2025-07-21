/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { openTopNavData, getOpenButtonRun } from './top_nav_open';

jest.mock('../../../../../../opensearch_dashboards_react/public', () => ({
  toMountPoint: jest.fn((x) => x),
  OpenSearchDashboardsContextProvider: jest.fn(({ children }) => <div>{children}</div>),
}));

jest.mock('./open_search_panel', () => ({
  OpenSearchPanel: jest.fn(() => <div>OpenSearchPanel</div>),
}));

describe('openTopNavData', () => {
  it('should have correct properties', () => {
    expect(openTopNavData).toMatchObject({
      tooltip: 'Open',
      ariaLabel: 'Open Saved Search',
      testId: 'discoverOpenButton',
      iconType: 'folderOpen',
      controlType: 'icon',
    });
  });
});

describe('getOpenButtonRun', () => {
  it('openFlyout is called when run', () => {
    const close = jest.fn();
    const openFlyout = jest.fn(() => ({ close })) as any;
    const services = { overlays: { openFlyout } } as any;

    const run = getOpenButtonRun(services);
    run({} as HTMLElement);

    expect(openFlyout).toHaveBeenCalled();
  });
});

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isDirectQuerySyncEnabledByUrl } from './direct_query_sync_url_flag';

describe('isDirectQuerySyncEnabledByUrl', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // @ts-ignore
    delete window.location;
    window.location = {
      hash: '',
    } as any;
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  it('returns true when URL param is true', () => {
    window.location.hash = '#/view/someid?dashboard.directQueryConnectionSync=true';
    expect(isDirectQuerySyncEnabledByUrl()).toBe(true);
  });

  it('returns false when URL param is false', () => {
    window.location.hash = '#/view/someid?dashboard.directQueryConnectionSync=false';
    expect(isDirectQuerySyncEnabledByUrl()).toBe(false);
  });

  it('returns undefined when URL param is missing', () => {
    window.location.hash = '#/view/someid';
    expect(isDirectQuerySyncEnabledByUrl()).toBe(undefined);
  });

  it('returns undefined when URL param is not true/false', () => {
    window.location.hash = '#/view/someid?dashboard.directQueryConnectionSync=maybe';
    expect(isDirectQuerySyncEnabledByUrl()).toBe(undefined);
  });

  it('handles multiple URL params correctly', () => {
    window.location.hash =
      '#/view/someid?otherparam=abc&dashboard.directQueryConnectionSync=true&anotherparam=xyz';
    expect(isDirectQuerySyncEnabledByUrl()).toBe(true);
  });
});

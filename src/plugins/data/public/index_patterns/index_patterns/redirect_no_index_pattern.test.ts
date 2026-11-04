/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock } from '../../../../../core/public/mocks';
import { onRedirectNoIndexPattern } from './redirect_no_index_pattern';

describe('redirect when no index pattern is available', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it.each<[boolean, boolean, string]>([
    [true, true, 'management'],
    [true, false, 'home'],
    [false, true, 'home'],
    [false, false, 'home'],
  ])('management=%s, save=%s redirects to %s', (management, save, target) => {
    const core = coreMock.createStart();
    const capabilities = {
      ...core.application.capabilities,
      management: { opensearchDashboards: { indexPatterns: management } },
      indexPatterns: { save },
    };

    // The returned promise intentionally never resolves while navigation replaces the current app.
    onRedirectNoIndexPattern(capabilities, core.application.navigateToApp, core.overlays)();

    if (target === 'management') {
      expect(core.application.navigateToApp).toHaveBeenCalledWith(
        'management',
        expect.objectContaining({
          path: expect.stringContaining('/opensearch-dashboards/indexPatterns'),
        })
      );
    } else {
      expect(core.application.navigateToApp).toHaveBeenCalledWith('home');
    }
    expect(core.application.navigateToApp).toHaveBeenCalledTimes(1);
  });
});

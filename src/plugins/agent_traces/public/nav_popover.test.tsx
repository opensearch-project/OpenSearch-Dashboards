/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { of } from 'rxjs';
import { agentTracesNavPopover, agentSpansNavPopover } from './nav_popover';
import { httpServiceMock } from '../../../core/public/mocks';
import { NavPopoverServices } from '../../../core/public';

const makeServices = (navigateToApp = jest.fn()): NavPopoverServices => ({
  navigateToApp,
  basePath: httpServiceMock.createSetupContract({ basePath: '/test' }).basePath,
  http: httpServiceMock.createStartContract(),
  recentlyAccessed$: of([]),
});

describe('agent_traces nav popovers', () => {
  afterEach(() => jest.clearAllMocks());

  describe.each([
    ['Traces', agentTracesNavPopover, 'agentTraces/traces', 'traces'],
    ['Spans', agentSpansNavPopover, 'agentTraces/spans', 'spans'],
  ])('%s popover', (_label, popover, appId, tab) => {
    it('declares exactly newSearch + browseSaved (no Logs action)', () => {
      expect((popover.actions ?? []).map((a) => a.id)).toEqual(['newSearch', 'browseSaved']);
    });

    it('opens a fresh search on the correct tab', () => {
      const services = makeServices();
      popover.actions!.find((a) => a.id === 'newSearch')!.onClick(services);
      expect(services.navigateToApp).toHaveBeenCalledWith(appId, {
        path: `#/?_a=(ui:(activeTabId:${tab},showHistogram:!t))`,
      });
    });

    it('navigates with the open-saved marker on the correct tab', () => {
      const services = makeServices();
      popover.actions!.find((a) => a.id === 'browseSaved')!.onClick(services);
      expect(services.navigateToApp).toHaveBeenCalledWith(appId, {
        path: `#/?_openSaved=true&_a=(ui:(activeTabId:${tab},showHistogram:!t))`,
      });
    });
  });
});

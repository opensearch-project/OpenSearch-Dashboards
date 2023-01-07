/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock } from '../../../../../core/public/mocks';
import { CoreStart } from 'opensearch-dashboards/public';
import { ViewEventsOptionAction } from './view_events_option_action';
import { createMockErrorEmbeddable, createMockVisEmbeddable } from '../../mocks';
import flyoutStateModule from '../flyout_state';

// Mocking the flyout state service. Defaulting to CLOSED. May override
// getFlyoutState() in below individual tests to test out different scenarios.
jest.mock('src/plugins/vis_augmenter/public/view_events_flyout/flyout_state', () => {
  return {
    VIEW_EVENTS_FLYOUT_STATE: {
      OPEN: 'OPEN',
      CLOSED: 'CLOSED',
    },
    getFlyoutState: () => 'CLOSED',
    setFlyoutState: () => {},
  };
});

let coreStart: CoreStart;

beforeEach(async () => {
  coreStart = coreMock.createStart();
});
afterEach(async () => {
  jest.clearAllMocks();
});

describe('ViewEventsOptionAction', () => {
  it('is incompatible with ErrorEmbeddables', async () => {
    const action = new ViewEventsOptionAction(coreStart);
    const errorEmbeddable = createMockErrorEmbeddable();
    expect(await action.isCompatible({ embeddable: errorEmbeddable })).toBe(false);
  });

  it('is incompatible with VisualizeEmbeddable with invalid vis', async () => {
    const visEmbeddable = createMockVisEmbeddable('test-saved-obj-id', 'test-title', false);
    const action = new ViewEventsOptionAction(coreStart);
    expect(await action.isCompatible({ embeddable: visEmbeddable })).toBe(false);
  });

  it('is compatible with VisualizeEmbeddable with valid vis', async () => {
    const visEmbeddable = createMockVisEmbeddable('test-saved-obj-id', 'test-title');
    const action = new ViewEventsOptionAction(coreStart);
    expect(await action.isCompatible({ embeddable: visEmbeddable })).toBe(true);
  });

  it('execute throws error if incompatible embeddable', async () => {
    const errorEmbeddable = createMockErrorEmbeddable();
    const action = new ViewEventsOptionAction(coreStart);
    async function check() {
      await action.execute({ embeddable: errorEmbeddable });
    }
    await expect(check()).rejects.toThrow(Error);
  });

  it('execute calls openFlyout if compatible embeddable and flyout is currently closed', async () => {
    const getFlyoutStateSpy = jest
      .spyOn(flyoutStateModule, 'getFlyoutState')
      .mockImplementation(() => 'CLOSED');
    const visEmbeddable = createMockVisEmbeddable('test-saved-obj-id', 'test-title');
    const action = new ViewEventsOptionAction(coreStart);
    await action.execute({ embeddable: visEmbeddable });
    expect(coreStart.overlays.openFlyout).toHaveBeenCalledTimes(1);
    expect(getFlyoutStateSpy).toHaveBeenCalledTimes(1);
  });

  it('execute does not call openFlyout if compatible embeddable and flyout is currently open', async () => {
    const getFlyoutStateSpy = jest
      .spyOn(flyoutStateModule, 'getFlyoutState')
      .mockImplementation(() => 'OPEN');
    const visEmbeddable = createMockVisEmbeddable('test-saved-obj-id', 'test-title');
    const action = new ViewEventsOptionAction(coreStart);
    await action.execute({ embeddable: visEmbeddable });
    expect(coreStart.overlays.openFlyout).toHaveBeenCalledTimes(0);
    expect(getFlyoutStateSpy).toHaveBeenCalledTimes(1);
  });

  it('Returns display name', async () => {
    const action = new ViewEventsOptionAction(coreStart);
    expect(action.getDisplayName()).toBeDefined();
  });

  it('Returns an icon type', async () => {
    const action = new ViewEventsOptionAction(coreStart);
    expect(action.getIconType()).toBeDefined();
  });
});

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenEventsFlyoutAction } from './open_events_flyout_action';
import flyoutStateModule from '../flyout_state';
import servicesModule from '../../services';

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

// Mocking core service as needed when making calls to the core's overlays service
jest.mock('src/plugins/vis_augmenter/public/services.ts', () => {
  return {
    getCore: () => {
      return {
        overlays: {
          openFlyout: () => {},
        },
      };
    },
  };
});

afterEach(async () => {
  jest.clearAllMocks();
});

describe('OpenEventsFlyoutAction', () => {
  it('is incompatible with null saved obj id', async () => {
    const action = new OpenEventsFlyoutAction();
    const savedObjectId = null;
    // @ts-ignore
    expect(await action.isCompatible({ savedObjectId })).toBe(false);
  });

  it('is incompatible with undefined saved obj id', async () => {
    const action = new OpenEventsFlyoutAction();
    const savedObjectId = undefined;
    // @ts-ignore
    expect(await action.isCompatible({ savedObjectId })).toBe(false);
  });

  it('is incompatible with empty saved obj id', async () => {
    const action = new OpenEventsFlyoutAction();
    const savedObjectId = '';
    expect(await action.isCompatible({ savedObjectId })).toBe(false);
  });

  it('execute throws error if incompatible saved obj id', async () => {
    const action = new OpenEventsFlyoutAction();
    async function check(id: any) {
      await action.execute({ savedObjectId: id });
    }
    await expect(check(null)).rejects.toThrow(Error);
    await expect(check(undefined)).rejects.toThrow(Error);
    await expect(check('')).rejects.toThrow(Error);
  });

  it('execute calls openFlyout if compatible saved obj id and flyout is closed', async () => {
    const getFlyoutStateSpy = jest
      .spyOn(flyoutStateModule, 'getFlyoutState')
      .mockImplementation(() => 'CLOSED');
    // openFlyout exists within core.overlays service. We spy on the initial getCore() fn call indicating
    // that openFlyout is getting called.
    const openFlyoutStateSpy = jest.spyOn(servicesModule, 'getCore');
    const savedObjectId = 'test-id';
    const action = new OpenEventsFlyoutAction();
    await action.execute({ savedObjectId });
    expect(openFlyoutStateSpy).toHaveBeenCalledTimes(1);
    expect(getFlyoutStateSpy).toHaveBeenCalledTimes(1);
  });

  it('execute does not call openFlyout if compatible saved obj id and flyout is open', async () => {
    const getFlyoutStateSpy = jest
      .spyOn(flyoutStateModule, 'getFlyoutState')
      .mockImplementation(() => 'OPEN');
    const openFlyoutStateSpy = jest.spyOn(servicesModule, 'getCore');
    const savedObjectId = 'test-id';
    const action = new OpenEventsFlyoutAction();
    await action.execute({ savedObjectId });
    expect(openFlyoutStateSpy).toHaveBeenCalledTimes(0);
    expect(getFlyoutStateSpy).toHaveBeenCalledTimes(1);
  });

  it('Returns display name', async () => {
    const action = new OpenEventsFlyoutAction();
    expect(action.getDisplayName()).toBeDefined();
  });

  it('Returns undefined icon type', async () => {
    const action = new OpenEventsFlyoutAction();
    expect(action.getIconType()).toBeUndefined();
  });
});

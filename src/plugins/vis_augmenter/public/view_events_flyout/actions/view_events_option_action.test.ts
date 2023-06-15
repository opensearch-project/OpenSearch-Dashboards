/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ViewEventsOptionAction } from './view_events_option_action';
import { createMockErrorEmbeddable, createMockVisEmbeddable } from '../../mocks';
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

// Mocking the UISettings service. This is needed when making eligibility checks for the actions,
// which does UISettings checks to ensure the feature is enabled.
// Also mocking core service as needed when making calls to the core's overlays service
jest.mock('src/plugins/vis_augmenter/public/services.ts', () => {
  return {
    getUISettings: () => {
      return {
        get: (config: string) => {
          switch (config) {
            case 'visualization:enablePluginAugmentation':
              return true;
            case 'visualization:enablePluginAugmentation.maxPluginObjects':
              return 10;
            default:
              throw new Error(`Accessing ${config} is not supported in the mock.`);
          }
        },
      };
    },
    getCore: () => {
      return {
        overlays: {
          openFlyout: () => {},
        },
      };
    },
    getSavedAugmentVisLoader: () => {
      return {
        delete: () => {},
        findAll: () => {
          return {
            hits: [],
          };
        },
      };
    },
  };
});

afterEach(async () => {
  jest.clearAllMocks();
});

describe('ViewEventsOptionAction', () => {
  it('is incompatible with ErrorEmbeddables', async () => {
    const action = new ViewEventsOptionAction();
    const errorEmbeddable = createMockErrorEmbeddable();
    expect(await action.isCompatible({ embeddable: errorEmbeddable })).toBe(false);
  });

  it('is incompatible with VisualizeEmbeddable with invalid vis', async () => {
    const visEmbeddable = createMockVisEmbeddable('test-saved-obj-id', 'test-title', false);
    const action = new ViewEventsOptionAction();
    expect(await action.isCompatible({ embeddable: visEmbeddable })).toBe(false);
  });

  it('is incompatible with VisualizeEmbeddable with valid vis and no vislayers', async () => {
    const visEmbeddable = createMockVisEmbeddable('test-saved-obj-id', 'test-title');
    visEmbeddable.visLayers = [];
    const action = new ViewEventsOptionAction();
    expect(await action.isCompatible({ embeddable: visEmbeddable })).toBe(false);
  });

  it('is compatible with VisualizeEmbeddable with valid vis', async () => {
    const visEmbeddable = createMockVisEmbeddable('test-saved-obj-id', 'test-title');
    const action = new ViewEventsOptionAction();
    expect(await action.isCompatible({ embeddable: visEmbeddable })).toBe(true);
  });

  it('execute throws error if incompatible embeddable', async () => {
    const errorEmbeddable = createMockErrorEmbeddable();
    const action = new ViewEventsOptionAction();
    async function check() {
      await action.execute({ embeddable: errorEmbeddable });
    }
    await expect(check()).rejects.toThrow(Error);
  });

  it('execute calls openFlyout if compatible embeddable and flyout is currently closed', async () => {
    const getFlyoutStateSpy = jest
      .spyOn(flyoutStateModule, 'getFlyoutState')
      .mockImplementation(() => 'CLOSED');
    // openFlyout exists within core.overlays service. We spy on the initial getCore() fn call indicating
    // that openFlyout is getting called.
    const openFlyoutStateSpy = jest.spyOn(servicesModule, 'getCore');
    const visEmbeddable = createMockVisEmbeddable('test-saved-obj-id', 'test-title');
    const action = new ViewEventsOptionAction();
    await action.execute({ embeddable: visEmbeddable });
    expect(openFlyoutStateSpy).toHaveBeenCalledTimes(1);
    expect(getFlyoutStateSpy).toHaveBeenCalledTimes(1);
  });

  it('execute does not call openFlyout if compatible embeddable and flyout is currently open', async () => {
    const getFlyoutStateSpy = jest
      .spyOn(flyoutStateModule, 'getFlyoutState')
      .mockImplementation(() => 'OPEN');
    const openFlyoutStateSpy = jest.spyOn(servicesModule, 'getCore');
    const visEmbeddable = createMockVisEmbeddable('test-saved-obj-id', 'test-title');
    const action = new ViewEventsOptionAction();
    await action.execute({ embeddable: visEmbeddable });
    expect(openFlyoutStateSpy).toHaveBeenCalledTimes(0);
    expect(getFlyoutStateSpy).toHaveBeenCalledTimes(1);
  });

  it('Returns display name', async () => {
    const action = new ViewEventsOptionAction();
    expect(action.getDisplayName()).toBeDefined();
  });

  it('Returns an icon type', async () => {
    const action = new ViewEventsOptionAction();
    expect(action.getIconType()).toBeDefined();
  });
});

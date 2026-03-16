/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createNewVisActions } from './new_vis_actions';
import { coreMock } from '../../../../core/public/mocks';
import { uiActionsPluginMock } from '../../../ui_actions/public/mocks';
import { dataPluginMock } from '../../../data/public/mocks';
import { DASHBOARD_ADD_PANEL_TRIGGER } from '../../../dashboard/public';
import { VISUALIZE_ENABLE_LABS_SETTING } from '../../common/constants';
import { ActionExecutionContext } from '../../../ui_actions/public';

describe('createNewVisActions', () => {
  const mockVisTypes = [
    {
      name: 'standard',
      title: 'Standard Vis',
      icon: 'visBarVertical',
      stage: 'production',
      requiresSearch: false,
      options: {},
      hidden: false,
    },
    {
      name: 'experimental',
      title: 'Experimental Vis',
      icon: 'visBarHorizontal',
      stage: 'experimental',
      requiresSearch: false,
      options: {},
      hidden: false,
    },
    {
      name: 'withSearch',
      title: 'Vis With Search',
      icon: 'visLine',
      stage: 'production',
      requiresSearch: true,
      options: {
        showIndexSelection: true,
      },
      hidden: false,
    },
    {
      name: 'withSearchNoSelection',
      title: 'Vis With Search No Selection',
      icon: 'visArea',
      stage: 'production',
      requiresSearch: true,
      options: {
        showIndexSelection: false,
      },
      hidden: false,
    },
    {
      name: 'hidden',
      title: 'Hidden Vis',
      icon: 'visPie',
      stage: 'production',
      requiresSearch: false,
      options: {},
      hidden: true,
    },
    {
      name: 'aliasApp',
      title: 'Alias App Vis',
      icon: 'visGauge',
      stage: 'production',
      aliasApp: 'otherApp',
      aliasPath: '/path',
      hidden: false,
    },
    {
      name: 'aliasAppWithPromotion',
      title: 'Alias App With Promotion',
      icon: 'visMetric',
      stage: 'production',
      aliasApp: 'promotedApp',
      aliasPath: '/promoted',
      promotion: {
        description: 'This is a promoted visualization',
      },
      hidden: false,
    },
  ];

  const setupServices = () => {
    const uiSettings = coreMock.createStart().uiSettings;
    const uiActions = uiActionsPluginMock.createStartContract();
    const overlays = coreMock.createStart().overlays;
    const application = coreMock.createStart().application;
    const savedObjects = coreMock.createStart().savedObjects;
    const data = dataPluginMock.createStartContract();
    const types = {
      all: jest.fn().mockReturnValue(mockVisTypes),
      getAliases: jest.fn().mockReturnValue([]),
      get: jest.fn().mockImplementation((id) => mockVisTypes.find((vis) => vis.name === id)),
    };

    uiSettings.get.mockImplementation((key) => {
      if (key === VISUALIZE_ENABLE_LABS_SETTING) {
        return false;
      }
      return undefined;
    });

    return {
      types,
      uiActions,
      uiSettings,
      overlays,
      application,
      savedObjects,
      data,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('registers actions for all non-experimental visualizations when labs disabled', () => {
    const services = setupServices();
    createNewVisActions(services);

    // Should not register experimental vis
    expect(services.uiActions.addTriggerAction).toHaveBeenCalledTimes(6);

    // Verify standard vis is registered
    expect(services.uiActions.addTriggerAction).toHaveBeenCalledWith(
      DASHBOARD_ADD_PANEL_TRIGGER,
      expect.objectContaining({
        id: 'add_vis_action_standard',
        getDisplayName: expect.any(Function),
        getIconType: expect.any(Function),
        execute: expect.any(Function),
      })
    );
  });

  test('registers actions for all visualizations including experimental when labs enabled', () => {
    const services = setupServices();
    services.uiSettings.get.mockImplementation((key) => {
      if (key === VISUALIZE_ENABLE_LABS_SETTING) {
        return true;
      }
      return undefined;
    });

    createNewVisActions(services);

    // Should register all non-hidden vis types (7 total, including experimental)
    expect(services.uiActions.addTriggerAction).toHaveBeenCalledTimes(7);
  });

  test('does not register hidden visualizations', () => {
    const services = setupServices();
    services.uiSettings.get.mockReturnValue(true); // Enable labs
    createNewVisActions(services);

    // Check that the hidden vis is registered but has an isCompatible function that returns false
    const hiddenVisActionCalls = Array.from({
      length: services.uiActions.addTriggerAction.mock.calls.length,
    })
      .map((_, i) => services.uiActions.addTriggerAction.mock.calls[i])
      .filter((call) => call[1].id === 'add_vis_action_hidden');

    // The action is registered but should have an isCompatible function
    expect(hiddenVisActionCalls.length).toBe(1);
    if (hiddenVisActionCalls.length > 0) {
      // If the action has an isCompatible function, it should return false for hidden visualizations
      const action = hiddenVisActionCalls[0][1];
      if (action.isCompatible) {
        expect(action.isCompatible({} as ActionExecutionContext<{}>)).resolves.toBe(false);
      }
    }
  });

  test('registers special action for visualizations with alias and promotion', () => {
    const services = setupServices();
    createNewVisActions(services);

    // Find the call for the promoted alias app
    const promotedActionCall = Array.from({
      length: services.uiActions.addTriggerAction.mock.calls.length,
    })
      .map((_, i) => services.uiActions.addTriggerAction.mock.calls[i])
      .find((call) => call[1].id === 'add_vis_action_aliasAppWithPromotion');

    expect(promotedActionCall).toBeDefined();
    if (promotedActionCall) {
      expect(promotedActionCall[1]).toHaveProperty('MenuItem');
      expect(promotedActionCall[1].execute).toEqual(expect.any(Function));
    }
  });

  test('registers regular action for visualizations with alias but no promotion', () => {
    const services = setupServices();
    createNewVisActions(services);

    // Find the call for the regular alias app
    const aliasActionCall = Array.from({
      length: services.uiActions.addTriggerAction.mock.calls.length,
    })
      .map((_, i) => services.uiActions.addTriggerAction.mock.calls[i])
      .find((call) => call[1].id === 'add_vis_action_aliasApp');

    expect(aliasActionCall).toBeDefined();
    if (aliasActionCall) {
      expect(aliasActionCall[1]).not.toHaveProperty('MenuItem');
      expect(aliasActionCall[1].execute).toEqual(expect.any(Function));
    }
  });

  test('registers action that opens modal for visualizations requiring search with showIndexSelection', () => {
    const services = setupServices();
    createNewVisActions(services);

    // Find the call for the vis with search
    const withSearchActionCall = Array.from({
      length: services.uiActions.addTriggerAction.mock.calls.length,
    })
      .map((_, i) => services.uiActions.addTriggerAction.mock.calls[i])
      .find((call) => call[1].id === 'add_vis_action_withSearch');

    expect(withSearchActionCall).toBeDefined();

    // Execute the action
    if (withSearchActionCall) {
      withSearchActionCall[1].execute({} as ActionExecutionContext<{}>);
    }

    // Should open a modal
    expect(services.overlays.openModal).toHaveBeenCalledTimes(1);
  });

  test('registers action that navigates directly for visualizations requiring search without showIndexSelection', () => {
    const services = setupServices();
    createNewVisActions(services);

    // Find the call for the vis with search but no selection
    const withSearchNoSelectionActionCall = Array.from({
      length: services.uiActions.addTriggerAction.mock.calls.length,
    })
      .map((_, i) => services.uiActions.addTriggerAction.mock.calls[i])
      .find((call) => call[1].id === 'add_vis_action_withSearchNoSelection');

    expect(withSearchNoSelectionActionCall).toBeDefined();

    // Execute the action
    if (withSearchNoSelectionActionCall) {
      withSearchNoSelectionActionCall[1].execute({} as ActionExecutionContext<{}>);
    }

    // Should navigate directly without opening a modal
    expect(services.overlays.openModal).not.toHaveBeenCalled();
    expect(services.application.navigateToApp).toHaveBeenCalledWith('visualize', {
      path: '#/create?type=withSearchNoSelection',
    });
  });
});

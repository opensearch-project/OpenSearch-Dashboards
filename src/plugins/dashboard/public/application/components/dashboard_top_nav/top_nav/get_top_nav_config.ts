/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { i18n } from '@osd/i18n';
import { ViewMode } from '../../../../../../embeddable/public';
import { TopNavIds } from './top_nav_ids';
import { NavAction } from '../../../../types';
import {
  TopNavControlIconData,
  TopNavMenuIconData,
  TopNavMenuSwitchData,
} from '../../../../../../navigation/public';

/**
 * @param actions - A mapping of TopNavIds to an action function that should run when the
 * corresponding top nav is clicked.
 * @param hideWriteControls if true, does not include any controls that allow editing or creating objects.
 * @return an array of objects for a top nav configuration, based on the mode.
 */
export function getTopNavLegacyConfig(
  dashboardMode: ViewMode,
  actions: { [key: string]: NavAction },
  hideWriteControls: boolean
) {
  switch (dashboardMode) {
    case ViewMode.VIEW:
      return hideWriteControls
        ? [
            getLegacyFullScreenConfig(actions[TopNavIds.FULL_SCREEN]),
            getLegacyShareConfig(actions[TopNavIds.SHARE]),
          ]
        : [
            getLegacyFullScreenConfig(actions[TopNavIds.FULL_SCREEN]),
            getLegacyShareConfig(actions[TopNavIds.SHARE]),
            getLegacyCloneConfig(actions[TopNavIds.CLONE]),
            getLegacyEditConfig(actions[TopNavIds.ENTER_EDIT_MODE]),
          ];
    case ViewMode.EDIT:
      return [
        getLegacyOptionsConfig(actions[TopNavIds.OPTIONS]),
        getLegacyShareConfig(actions[TopNavIds.SHARE]),
        getLegacyAddConfig(actions[TopNavIds.ADD_EXISTING]),
        getLegacyViewConfig(actions[TopNavIds.EXIT_EDIT_MODE]),
        getLegacySaveConfig(actions[TopNavIds.SAVE]),
        getLegacyCreateNewConfig(actions[TopNavIds.VISUALIZE]),
      ];
    default:
      return [];
  }
}

function getLegacyFullScreenConfig(action: NavAction) {
  return {
    id: 'full-screen',
    label: i18n.translate('dashboard.topNave.fullScreenButtonAriaLabel', {
      defaultMessage: 'full screen',
    }),
    description: i18n.translate('dashboard.topNave.fullScreenConfigDescription', {
      defaultMessage: 'Full Screen Mode',
    }),
    testId: 'dashboardFullScreenMode',
    run: action,
  };
}

/**
 * @returns {osdTopNavConfig}
 */
function getLegacyEditConfig(action: NavAction) {
  return {
    emphasize: true,
    id: 'edit',
    iconType: 'pencil',
    label: i18n.translate('dashboard.topNave.editButtonAriaLabel', {
      defaultMessage: 'edit',
    }),
    description: i18n.translate('dashboard.topNave.editConfigDescription', {
      defaultMessage: 'Switch to edit mode',
    }),
    testId: 'dashboardEditMode',
    // We want to hide the "edit" button on small screens, since those have a responsive
    // layout, which is not tied to the grid anymore, so we cannot edit the grid on that screens.
    className: 'eui-hideFor--s eui-hideFor--xs',
    run: action,
  };
}

/**
 * @returns {osdTopNavConfig}
 */
function getLegacySaveConfig(action: NavAction) {
  return {
    id: 'save',
    label: i18n.translate('dashboard.topNave.saveButtonAriaLabel', {
      defaultMessage: 'save',
    }),
    description: i18n.translate('dashboard.topNave.saveConfigDescription', {
      defaultMessage: 'Save your dashboard',
    }),
    testId: 'dashboardSaveMenuItem',
    run: action,
  };
}

/**
 * @returns {osdTopNavConfig}
 */
function getLegacyViewConfig(action: NavAction) {
  return {
    id: 'cancel',
    label: i18n.translate('dashboard.topNave.cancelButtonAriaLabel', {
      defaultMessage: 'cancel',
    }),
    description: i18n.translate('dashboard.topNave.viewConfigDescription', {
      defaultMessage: 'Cancel editing and switch to view-only mode',
    }),
    testId: 'dashboardViewOnlyMode',
    run: action,
  };
}

/**
 * @returns {osdTopNavConfig}
 */
function getLegacyCloneConfig(action: NavAction) {
  return {
    id: 'clone',
    label: i18n.translate('dashboard.topNave.cloneButtonAriaLabel', {
      defaultMessage: 'clone',
    }),
    description: i18n.translate('dashboard.topNave.cloneConfigDescription', {
      defaultMessage: 'Create a copy of your dashboard',
    }),
    testId: 'dashboardClone',
    run: action,
  };
}

/**
 * @returns {osdTopNavConfig}
 */
function getLegacyAddConfig(action: NavAction) {
  return {
    id: 'add',
    label: i18n.translate('dashboard.topNave.addButtonAriaLabel', {
      defaultMessage: 'add',
    }),
    description: i18n.translate('dashboard.topNave.addConfigDescription', {
      defaultMessage: 'Add a panel to the dashboard',
    }),
    testId: 'dashboardAddPanelButton',
    run: action,
  };
}

/**
 * @returns {osdTopNavConfig}
 */
function getLegacyCreateNewConfig(action: NavAction) {
  return {
    emphasize: true,
    iconType: 'plus',
    id: 'addNew',
    label: i18n.translate('dashboard.topNave.addNewButtonAriaLabel', {
      defaultMessage: 'Create new',
    }),
    description: i18n.translate('dashboard.topNave.addNewConfigDescription', {
      defaultMessage: 'Create a new panel on this dashboard',
    }),
    testId: 'dashboardAddNewPanelButton',
    run: action,
  };
}

/**
 * @returns {osdTopNavConfig}
 */
function getLegacyShareConfig(action: NavAction | undefined) {
  return {
    id: 'share',
    label: i18n.translate('dashboard.topNave.shareButtonAriaLabel', {
      defaultMessage: 'share',
    }),
    description: i18n.translate('dashboard.topNave.shareConfigDescription', {
      defaultMessage: 'Share Dashboard',
    }),
    testId: 'shareTopNavButton',
    run: action,
    // disable the Share button if no action specified
    disableButton: !action,
  };
}

/**
 * @returns {osdTopNavConfig}
 */
function getLegacyOptionsConfig(action: NavAction) {
  return {
    id: 'options',
    label: i18n.translate('dashboard.topNave.optionsButtonAriaLabel', {
      defaultMessage: 'options',
    }),
    description: i18n.translate('dashboard.topNave.optionsConfigDescription', {
      defaultMessage: 'Options',
    }),
    testId: 'dashboardOptionsButton',
    run: action,
  };
}

export function getTopNavConfig(
  dashboardMode: ViewMode,
  actions: { [key: string]: NavAction },
  hideWriteControls: boolean
) {
  switch (dashboardMode) {
    case ViewMode.VIEW:
      return hideWriteControls
        ? [getShareConfig(actions[TopNavIds.SHARE])]
        : [
            getEditConfig(actions[TopNavIds.ENTER_EDIT_MODE], false),
            getCloneConfig(actions[TopNavIds.CLONE]),
            getShareConfig(actions[TopNavIds.SHARE]),
          ];
    case ViewMode.EDIT:
      return [
        getEditConfig(actions[TopNavIds.EXIT_EDIT_MODE], true),
        getSaveConfig(actions[TopNavIds.SAVE]),
        getAddConfig(actions[TopNavIds.ADD_EXISTING]),
        getOptionsConfig(actions[TopNavIds.OPTIONS]),
        getShareConfig(actions[TopNavIds.SHARE]),
      ];
    default:
      return [];
  }
}

export function getTopNavRightConfig(
  dashboardMode: ViewMode,
  actions: { [key: string]: NavAction }
) {
  switch (dashboardMode) {
    case ViewMode.VIEW:
      return [getFullScreenConfig(actions[TopNavIds.FULL_SCREEN])];

    default:
      return [];
  }
}

function getFullScreenConfig(action: NavAction): TopNavControlIconData {
  return {
    id: 'full-screen',
    ariaLabel: i18n.translate('dashboard.topNave.fullScreenConfigDescription', {
      defaultMessage: 'Full Screen Mode',
    }),
    testId: 'dashboardFullScreenMode',
    run: action,
    iconType: 'fullScreen',
    display: 'base',
    controlType: 'icon',
  };
}

function getEditConfig(action: NavAction, checked: boolean): TopNavMenuSwitchData {
  return {
    label: i18n.translate('dashboard.topNav.editSwitchLabel', {
      defaultMessage: 'Edit',
    }),
    testId: 'dashboardEditSwitch',
    run: action,
    checked,
    controlType: 'switch',
  };
}

function getSaveConfig(action: NavAction): TopNavMenuIconData {
  return {
    tooltip: i18n.translate('dashboard.topNav.saveButtonTooltip', {
      defaultMessage: 'Save',
    }),
    ariaLabel: i18n.translate('dashboard.topNav.saveButtonAriaLabel', {
      defaultMessage: 'Save your dashboard',
    }),
    testId: 'dashboardSaveMenuItem',
    run: action,
    iconType: 'save',
    controlType: 'icon',
  };
}

function getCloneConfig(action: NavAction): TopNavMenuIconData {
  return {
    tooltip: i18n.translate('dashboard.topNav.cloneButtonTooltip', {
      defaultMessage: 'Clone',
    }),
    ariaLabel: i18n.translate('dashboard.topNav.cloneButtonAriaLabel', {
      defaultMessage: 'Create a copy of your dashboard',
    }),
    testId: 'dashboardClone',
    run: action,
    iconType: 'copy',
    controlType: 'icon',
  };
}

function getAddConfig(action: NavAction): TopNavMenuIconData {
  return {
    tooltip: i18n.translate('dashboard.topNav.addButtonTooltip', {
      defaultMessage: 'Add',
    }),
    ariaLabel: i18n.translate('dashboard.topNav.addButtonAriaLabel', {
      defaultMessage: 'Add a panel to the dashboard',
    }),
    testId: 'dashboardAddPanelButton',
    run: action,
    iconType: 'plusInCircle',
    controlType: 'icon',
  };
}

function getShareConfig(action: NavAction | undefined): TopNavMenuIconData {
  return {
    tooltip: i18n.translate('dashboard.topNav.shareButtonTooltip', {
      defaultMessage: 'Share',
    }),
    ariaLabel: i18n.translate('dashboard.topNav.shareButtonAriaLabel', {
      defaultMessage: 'Share Dashboard',
    }),
    testId: 'shareTopNavButton',
    run: action || (() => {}),
    // disable the Share button if no action specified
    disabled: !action,
    iconType: 'share',
    controlType: 'icon',
  };
}

function getOptionsConfig(action: NavAction) {
  return {
    tooltip: i18n.translate('dashboard.topNav.optionsButtonTooltip', {
      defaultMessage: 'Options',
    }),
    ariaLabel: i18n.translate('dashboard.topNav.optionsButtonAriaLabel', {
      defaultMessage: 'Options',
    }),
    testId: 'dashboardOptionsButton',
    run: action,
    iconType: 'gear',
    controlType: 'icon',
  };
}

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Trigger, UiActionsSetup } from '../../ui_actions/public';

export const DASHBOARD_ADD_PANEL_TRIGGER = 'DASHBOARD_ADD_PANEL_TRIGGER';

declare module '../../ui_actions/public' {
  export interface TriggerContextMapping {
    [DASHBOARD_ADD_PANEL_TRIGGER]: {};
  }
}

export const dashboardAddPanelTrigger: Trigger<'DASHBOARD_ADD_PANEL_TRIGGER'> = {
  id: DASHBOARD_ADD_PANEL_TRIGGER,
};

export const bootstrap = (uiActions: UiActionsSetup) => {
  uiActions.registerTrigger(dashboardAddPanelTrigger);
};

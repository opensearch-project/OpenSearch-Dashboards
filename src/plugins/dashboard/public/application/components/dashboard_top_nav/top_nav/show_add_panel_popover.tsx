/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { i18n } from '@osd/i18n';
import { I18nProvider } from '@osd/i18n/react';
import {
  EuiButton,
  EuiWrappingPopover,
  EuiListGroup,
  EuiListGroupItem,
  EuiSpacer,
} from '@elastic/eui';
import { ActionExecutionContext, UiActionsStart } from '../../../../../../ui_actions/public';
import { dashboardAddPanelTrigger, DASHBOARD_ADD_PANEL_TRIGGER } from '../../../../ui_triggers';
import { uiToReactComponent } from '../../../../../../opensearch_dashboards_react/public';

let isMount = false;

const container = document.createElement('div');

const unmount = () => {
  ReactDOM.unmountComponentAtNode(container);
  isMount = false;
};
const triggerContext = {
  trigger: dashboardAddPanelTrigger,
};

const PanelPopover = ({
  onClose,
  button,
  onAddExistingPanelFlyout,
  uiActions,
}: {
  onClose: () => void;
  button: HTMLElement;
  onAddExistingPanelFlyout: () => void;
  uiActions: UiActionsStart;
}) => {
  const actions = uiActions.getTriggerActions(DASHBOARD_ADD_PANEL_TRIGGER).sort((a, b) => {
    const aOrder = a.order ?? -Infinity; // Missing values appear first
    const bOrder = b.order ?? -Infinity;
    return aOrder - bOrder;
  });

  return (
    <I18nProvider>
      <EuiWrappingPopover
        id="dashboardAddPanelPopover"
        button={button}
        isOpen={true}
        closePopover={onClose}
        panelPaddingSize="s"
      >
        <EuiListGroup
          flush
          size="xs"
          gutterSize="none"
          style={{ minWidth: 250, maxHeight: 350, overflow: 'auto' }}
        >
          {actions.map((action) => {
            if (action.MenuItem) {
              const ReactMenuItem = uiToReactComponent<{
                context: ActionExecutionContext;
                onClick: () => void;
              }>(action.MenuItem);
              return (
                <ReactMenuItem
                  context={triggerContext}
                  onClick={() => {
                    action.execute(triggerContext);
                    onClose();
                  }}
                />
              );
            } else {
              return (
                <EuiListGroupItem
                  key={action.id}
                  iconType={action.getIconType(triggerContext)}
                  label={action.getDisplayName(triggerContext)}
                  onClick={() => {
                    action.execute(triggerContext);
                    onClose();
                  }}
                />
              );
            }
          })}
        </EuiListGroup>
        <EuiSpacer size="s" />
        <EuiButton
          fullWidth
          size="s"
          onClick={() => {
            onAddExistingPanelFlyout();
            onClose();
          }}
        >
          {i18n.translate('dashboard.addExistingPanel', { defaultMessage: 'From library' })}
        </EuiButton>
      </EuiWrappingPopover>
    </I18nProvider>
  );
};

export function showAddPanelPopover({
  anchorElement,
  onAddExistingPanelFlyout,
  uiActions,
}: {
  anchorElement: HTMLElement;
  onAddExistingPanelFlyout: () => void;
  uiActions: UiActionsStart;
}) {
  if (isMount) {
    unmount();
    return;
  }

  isMount = true;

  document.body.appendChild(container);
  ReactDOM.render(
    <PanelPopover
      onAddExistingPanelFlyout={onAddExistingPanelFlyout}
      button={anchorElement}
      onClose={unmount}
      uiActions={uiActions}
    />,
    container
  );
}

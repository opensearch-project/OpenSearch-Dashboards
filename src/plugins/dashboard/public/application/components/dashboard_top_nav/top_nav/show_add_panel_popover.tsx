/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import ReactDOM from 'react-dom';
import { i18n } from '@osd/i18n';
import { I18nProvider } from '@osd/i18n/react';
import { useAsync } from 'react-use';
import { EuiButton, EuiWrappingPopover, EuiSpacer, EuiContextMenu } from '@elastic/eui';
import { buildContextMenuForActions, UiActionsStart } from '../../../../../../ui_actions/public';
import { dashboardAddPanelTrigger, DASHBOARD_ADD_PANEL_TRIGGER } from '../../../../ui_triggers';

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
  const actionsRef = useRef(uiActions.getTriggerActions(DASHBOARD_ADD_PANEL_TRIGGER));

  const panels = useAsync(() => {
    return buildContextMenuForActions({
      actions: actionsRef.current.map((action) => ({
        action,
        context: triggerContext,
        trigger: DASHBOARD_ADD_PANEL_TRIGGER as any,
      })),
      closeMenu: onClose,
      title: '',
      autoWrapItems: false,
    });
  }, []);

  return (
    <I18nProvider>
      <EuiWrappingPopover
        id="dashboardAddPanelPopover"
        button={button}
        isOpen={true}
        closePopover={onClose}
        panelPaddingSize="s"
      >
        <EuiContextMenu size="s" initialPanelId="mainMenu" panels={panels.value} />
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

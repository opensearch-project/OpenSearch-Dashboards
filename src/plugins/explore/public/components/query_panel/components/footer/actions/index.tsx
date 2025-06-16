/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// TODO: Actions are not scope of P0. This should bes tested with external plugins in next scope.

import React, { useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiButtonEmpty,
  EuiContextMenuPanel,
  EuiContextMenuItem,
  EuiPopover,
  EuiIcon,
} from '@elastic/eui';
import { queryBarActionsRegistry } from './registry';

export const Actions: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const actions = queryBarActionsRegistry.getAll();

  const items = actions.map((action, index) => (
    <EuiContextMenuItem
      key={index}
      icon={<EuiIcon type={action.iconType} />}
      onClick={action.onClick}
      data-test-subj={`queryPanelFooterActionMenuItem-${index}`}
    >
      {action.label}
    </EuiContextMenuItem>
  ));

  return (
    <EuiPopover
      button={
        <EuiButtonEmpty onClick={() => setIsOpen(!isOpen)}>
          {i18n.translate('explore.queryPanel.actions.buttonLabel', {
            defaultMessage: 'Actions',
          })}
          <EuiIcon type="arrowDown" className="queryPanel__footer__actionsButtonIcon" />
        </EuiButtonEmpty>
      }
      isOpen={isOpen}
      closePopover={() => setIsOpen(false)}
      panelPaddingSize="none"
    >
      <EuiContextMenuPanel items={items} />
    </EuiPopover>
  );
};

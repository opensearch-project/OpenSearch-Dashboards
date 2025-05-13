/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiButton, EuiContextMenuPanel, EuiContextMenuItem, EuiPopover } from '@elastic/eui';
import { useState } from 'react';
import { queryBarActionsRegistry } from './registry';

export const Actions: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const actions = queryBarActionsRegistry.getAll();

  const items = actions.map((action, index) => (
    <EuiContextMenuItem
      key="action"
      data-test-subj="actionMenuOpenDocs"
      onClick={() => {
        // console.log('open');
      }}
    >
      {action.label}
    </EuiContextMenuItem>
  ));

  return (
    <EuiPopover
      button={
        <EuiButton iconType="arrowDown" onClick={() => setIsOpen(!isOpen)}>
          Actions
        </EuiButton>
      }
      isOpen={isOpen}
      closePopover={() => setIsOpen(false)}
      panelPaddingSize="none"
    >
      <EuiContextMenuPanel items={items} />
    </EuiPopover>
  );
};

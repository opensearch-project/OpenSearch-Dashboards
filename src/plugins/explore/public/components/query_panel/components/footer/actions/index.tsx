/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiButtonEmpty,
  EuiContextMenuPanel,
  EuiContextMenuItem,
  EuiPopover,
  EuiIcon,
} from '@elastic/eui';
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
        <EuiButtonEmpty onClick={() => setIsOpen(!isOpen)}>
          Actions
          <EuiIcon type="arrowDown" style={{ margin: '0px 5px' }} />
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

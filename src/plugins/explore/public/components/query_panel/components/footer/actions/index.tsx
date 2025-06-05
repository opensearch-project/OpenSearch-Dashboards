/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// TODO: Actions are not scope of P0. This should bes tested with external plugins in next scope.

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
      key={index}
      icon={<EuiIcon type={action.iconType} />}
      onClick={action.onClick}
      data-test-subj={`queryEditorActionMenuItem-${index}`}
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

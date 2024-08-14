/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiButtonEmpty } from '@elastic/eui';
import {
  DiscoverAction,
  DiscoverActionContext,
} from '../../../../../../plugins/data_explorer/public';

interface DiscoverActionsProps {
  actions: DiscoverAction[];
  context: DiscoverActionContext;
}

const DiscoverActions: React.FC<DiscoverActionsProps> = ({ actions, context }) => {
  actions.sort((a, b) => {
    return a.order - b.order;
  });

  return (
    <div className="dscCanvas_actions">
      {actions.map((action) => (
        <EuiButtonEmpty
          key={action.order}
          size="s"
          iconType={action.iconType}
          onClick={() => {
            action.onClick(context);
          }}
        >
          {action.name}
        </EuiButtonEmpty>
      ))}
    </div>
  );
};

export { DiscoverActions };

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButton, EuiEmptyPrompt, EuiFlexGroup, EuiFlexItem, EuiPanel } from '@elastic/eui';
import React, { FC } from 'react';

import './workspace.scss';

export const Workspace: FC = ({ children }) => {
  return (
    <section className="wizWorkspace">
      <EuiFlexGroup className="wizCanvasControls">
        <EuiFlexItem grow={false}>
          {/* TODO: This is the temporary view of the selected chard, should be replaced by dropdown */}
          <EuiButton iconType="visBarVertical" disabled>
            Bar
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiPanel className="wizCanvas">
        {children ? (
          children
        ) : (
          <EuiFlexItem className="wizWorkspace__empty">
            <EuiEmptyPrompt
              iconType="visBarVertical"
              title={<h2>Welcome to the wizard!</h2>}
              body={<p>Drag some fields onto the panel to visualize some data.</p>}
            />
          </EuiFlexItem>
        )}
      </EuiPanel>
    </section>
  );
};

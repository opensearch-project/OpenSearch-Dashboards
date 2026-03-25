/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ReactNode } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiPanel } from '@elastic/eui';
import { VisActionBar } from '../component/vis_action_bar';
import '../in_context_editor.scss';

interface ICanvasPanelProps {
  children: ReactNode;
  className?: string;
  testId?: string;
}
export const EditorPanel: React.FC<ICanvasPanelProps> = ({ children, testId }) => {
  return (
    <EuiFlexGroup
      direction="column"
      justifyContent="spaceBetween"
      gutterSize="none"
      className="editor-panel"
    >
      <EuiFlexItem grow={false}>
        <VisActionBar />
      </EuiFlexItem>
      <EuiFlexItem grow={true} style={{ minHeight: 0, overflow: 'hidden' }}>
        <EuiPanel
          hasBorder={true}
          hasShadow={false}
          borderRadius="m"
          paddingSize="none"
          className="editor-container"
          data-test-subj={testId}
          style={{ overflow: 'auto' }}
        >
          {children}
        </EuiPanel>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ReactNode } from 'react';
import { EuiPanel } from '@elastic/eui';

interface ICanvasPanelProps {
  children: ReactNode;
  className?: string;
  testId?: string;
}
export const CanvasPanel: React.FC<ICanvasPanelProps> = ({ children, testId, className }) => {
  return (
    <EuiPanel
      hasBorder={true}
      hasShadow={false}
      paddingSize="s"
      className={className ?? 'dscCanvas'}
      data-test-subj={testId}
      borderRadius="m"
    >
      {children}
    </EuiPanel>
  );
};

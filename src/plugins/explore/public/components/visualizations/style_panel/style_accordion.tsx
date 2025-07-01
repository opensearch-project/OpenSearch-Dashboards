/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiText, EuiPanel, EuiAccordion, EuiHorizontalRule } from '@elastic/eui';
import React from 'react';

export interface StyleAccordionProps {
  id: string;
  accordionLabel: React.ReactNode;
  initialIsOpen: boolean;
}

export const StyleAccordion: React.FC<StyleAccordionProps> = ({
  id,
  accordionLabel,
  initialIsOpen,
  children,
}) => {
  return (
    <EuiPanel paddingSize="s" borderRadius="none" hasBorder={false} hasShadow={false}>
      <EuiAccordion
        id={id}
        buttonContent={
          <EuiText size="s" style={{ fontWeight: 600 }}>
            {accordionLabel}
          </EuiText>
        }
        initialIsOpen={initialIsOpen}
      >
        <EuiPanel paddingSize="s" hasBorder={false} color="subdued">
          {children}
        </EuiPanel>
      </EuiAccordion>
      <EuiHorizontalRule margin="none" />{' '}
    </EuiPanel>
  );
};

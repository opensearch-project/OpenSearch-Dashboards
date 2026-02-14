/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiText, EuiPanel, EuiAccordion, EuiHorizontalRule, EuiSpacer } from '@elastic/eui';
import React from 'react';

import './style_accordion.scss';

export interface StyleAccordionProps {
  id: string;
  accordionLabel: React.ReactNode;
  initialIsOpen: boolean;
  children?: React.ReactNode;
}

export const StyleAccordion = ({
  id,
  accordionLabel,
  initialIsOpen,
  children,
}: StyleAccordionProps) => {
  return (
    <EuiPanel
      paddingSize="none"
      borderRadius="none"
      hasBorder={false}
      hasShadow={false}
      className="style-accordion"
    >
      <EuiAccordion
        id={id}
        buttonContent={
          <EuiText size="s" style={{ fontWeight: 600 }}>
            {accordionLabel}
          </EuiText>
        }
        initialIsOpen={initialIsOpen}
      >
        <EuiSpacer size="s" />
        <EuiPanel paddingSize="s" hasBorder={false} hasShadow={false}>
          {children}
        </EuiPanel>
      </EuiAccordion>
      <div className="style-accordion-separator">
        <EuiSpacer size="s" />
        <EuiHorizontalRule margin="none" />
        <EuiSpacer size="s" />
      </div>
    </EuiPanel>
  );
};

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiText,
  EuiLink,
  EuiSpacer,
} from '@elastic/eui';

interface Props {
  title: string;
  description: string;
  links: Array<{
    text: string;
    url: string;
  }>;
  categories: React.ReactNode;
  footer?: React.ReactNode;
}

export const HeroSection: React.FC<Props> = ({ title, description, links, categories, footer }) => {
  return (
    <EuiPanel>
      <EuiFlexGroup direction="row">
        <EuiFlexItem grow={1}>
          <EuiTitle size="l" className="home-hero-title">
            <h2>{title}</h2>
          </EuiTitle>
          <EuiText>{description}</EuiText>
          {links.map((link) => (
            <EuiLink key={link.url} href={link.url} external={true}>
              {link.text}
            </EuiLink>
          ))}
        </EuiFlexItem>
        <EuiFlexItem grow={3}>{categories}</EuiFlexItem>
      </EuiFlexGroup>
      {footer && <EuiSpacer />}
      {footer}
    </EuiPanel>
  );
};

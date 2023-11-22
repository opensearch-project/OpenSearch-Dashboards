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
  description: React.ReactNode;
  links: Array<{
    text: string;
    url: string;
  }>;
  actionButton: React.ReactNode;
  content: React.ReactNode;
  illustration: React.ReactNode;
}

export const HeroSection: React.FC<Props> = ({
  title,
  description,
  links,
  actionButton,
  content,
  illustration,
}) => {
  return (
    <EuiPanel paddingSize="m">
      <EuiFlexGroup direction="row" alignItems="flexStart" className="home-hero-group">
        <EuiFlexItem grow={10}>{illustration}</EuiFlexItem>
        <EuiFlexItem grow={9} className="home-hero-descriptionSection">
          <EuiTitle size="l" className="home-hero-title">
            <h2>{title}</h2>
          </EuiTitle>
          <EuiText>{description}</EuiText>
          <EuiSpacer size="m" />
          {actionButton}
          <EuiSpacer size="m" />
          <EuiFlexGroup direction="row" responsive={false} gutterSize="l">
            {links.map((link) => (
              <EuiFlexItem grow={false} key={link.url}>
                <EuiLink href={link.url} external={true}>
                  {link.text}
                </EuiLink>
              </EuiFlexItem>
            ))}
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem grow={10}>{content}</EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};

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
  link: {
    text: string;
    url: string;
  };
  actionButton: React.ReactNode;
  content: React.ReactNode;
  illustration: React.ReactNode;
}

export const HeroSection: React.FC<Props> = ({
  title,
  description,
  link,
  actionButton,
  content,
  illustration,
}) => {
  return (
    <EuiPanel paddingSize="m">
      <EuiFlexGroup direction="row" alignItems="center" className="home-hero-group">
        <EuiFlexItem grow={10}>{illustration}</EuiFlexItem>
        <EuiFlexItem grow={9} className="home-hero-descriptionSection">
          <EuiTitle size="l" className="home-hero-title">
            <h2>{title}</h2>
          </EuiTitle>
          <EuiText>{description}</EuiText>
          <EuiSpacer size="m" />
          <EuiFlexGroup direction="row" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}>{actionButton}</EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiLink key={link.url} href={link.url} external={true}>
                {link.text}
              </EuiLink>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem grow={10}>{content}</EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};

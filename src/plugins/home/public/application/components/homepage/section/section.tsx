/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  EuiPanel,
  EuiTitle,
  EuiText,
  EuiLink,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonIcon,
} from '@elastic/eui';

interface Props {
  title: string;
  description?: string;
  links?: Array<{
    text: string;
    url: string;
  }>;
  categories: React.ReactNode;
}

export const Section: React.FC<Props> = ({ title, description, links, categories }) => {
  const hasDescriptionCategory = Boolean(description) || (!!links && links.length > 0);
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  return (
    <EuiPanel hasBorder={false} hasShadow={false} color="transparent">
      <EuiFlexGroup direction="row" alignItems="center" gutterSize="s">
        <EuiFlexItem grow={false}>
          <EuiButtonIcon
            iconType={collapsed ? 'arrowRight' : 'arrowUp'}
            onClick={toggleCollapsed}
            size="s"
            iconSize="m"
          />
        </EuiFlexItem>
        <EuiFlexItem grow={true}>
          <EuiTitle size="l">
            <h3>{title}</h3>
          </EuiTitle>
        </EuiFlexItem>
      </EuiFlexGroup>
      {!collapsed && (
        <EuiFlexGroup direction="row">
          {hasDescriptionCategory && (
            <EuiFlexItem grow={1}>
              {description && <EuiText>{description}</EuiText>}
              {links &&
                links.map((link) => (
                  <EuiLink key={link.url} href={link.url} external={true}>
                    {link.text}
                  </EuiLink>
                ))}
            </EuiFlexItem>
          )}
          <EuiFlexItem grow={3}>{categories}</EuiFlexItem>
        </EuiFlexGroup>
      )}
    </EuiPanel>
  );
};

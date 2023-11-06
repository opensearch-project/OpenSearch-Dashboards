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
  EuiSpacer,
} from '@elastic/eui';

interface Props {
  title: string;
  description?: string;
  links?: Array<{
    text: string;
    url: string;
  }>;
  categories: React.ReactNode;
  initiallyOpen?: boolean;
}

export const Section: React.FC<Props> = ({
  title,
  description,
  links,
  categories,
  initiallyOpen = true,
}) => {
  const hasDescriptionCategory = Boolean(description) || (!!links && links.length > 0);
  const hasDescriptionSpacer = Boolean(description) && !!links && links.length > 0;
  const [collapsed, setCollapsed] = useState(!initiallyOpen);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  return (
    <EuiPanel hasBorder={false} hasShadow={false} color="transparent">
      <EuiFlexGroup direction="row" alignItems="center" gutterSize="s" responsive={false}>
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
              {hasDescriptionSpacer && <EuiSpacer size="m" />}
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

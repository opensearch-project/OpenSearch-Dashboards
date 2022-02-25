/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiHorizontalRule, EuiSpacer, EuiTitle } from '@elastic/eui';

interface Props {
  title: string;
  icon?: React.ReactNode;
  showDivider?: boolean;
}
export const Title = ({ title, icon, showDivider = false }: Props) => (
  <>
    <div className="wizConfig__title">
      <EuiFlexGroup gutterSize="s" alignItems="center">
        {icon && <EuiFlexItem grow={false}>{icon}</EuiFlexItem>}
        <EuiFlexItem>
          <EuiTitle size="xxs">
            <h2>{title}</h2>
          </EuiTitle>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
    {showDivider ? <EuiHorizontalRule margin="s" /> : <EuiSpacer size="s" />}
  </>
);

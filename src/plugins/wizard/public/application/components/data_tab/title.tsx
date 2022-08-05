/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiIcon,
  EuiSpacer,
  EuiTitle,
} from '@elastic/eui';
export interface TitleProps {
  title: string;
  isSecondary?: boolean;
  closeMenu?: () => void;
}

export const Title = ({ title, isSecondary, closeMenu }: TitleProps) => {
  const icon = isSecondary && (
    <EuiIcon type="arrowLeft" onClick={closeMenu} data-test-subj="panelCloseBtn" />
  );
  return (
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
      {isSecondary ? <EuiHorizontalRule margin="s" /> : <EuiSpacer size="s" />}
    </>
  );
};

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiIcon, EuiPanel, EuiText } from '@elastic/eui';

export interface SectionPanelProps {
  title?: string;
  subtitle?: string;
  iconType?: string;
  actions?: ReactNode;
  headerContent?: ReactNode;
  children: ReactNode;
  activeType?: string;
  footer?: ReactNode;
  overlay?: ReactNode;
}

export const SectionPanel = ({
  title,
  subtitle,
  iconType,
  actions,
  headerContent,
  children,
  activeType,
  footer,
  overlay,
}: SectionPanelProps) => {
  return (
    <EuiPanel
      paddingSize="none"
      hasBorder={false}
      hasShadow={false}
      borderRadius="none"
      className="queryWorkspaceDetail"
      data-test-subj="sectionPanel"
    >
      {(title || headerContent) && (
        <div
          className={['queryWorkspaceDetail__header', `queryWorkspaceDetail__header--${activeType}`]
            .filter(Boolean)
            .join(' ')}
        >
          <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
            {iconType && (
              <EuiFlexItem grow={false}>
                <EuiIcon color="subdued" type={iconType} size="s" />
              </EuiFlexItem>
            )}
            {headerContent ? (
              <EuiFlexItem grow={false} className="queryWorkspaceDetail__headerContent">
                {headerContent}
              </EuiFlexItem>
            ) : (
              <EuiFlexItem grow={false}>
                <EuiText size="s">
                  <strong>{title}</strong>
                </EuiText>
              </EuiFlexItem>
            )}
            {subtitle && (
              <>
                <EuiFlexItem grow={false}>
                  <div className="queryWorkspaceDetail__divider" />
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiText size="s" color="subdued">
                    {subtitle}
                  </EuiText>
                </EuiFlexItem>
              </>
            )}
            {actions && <EuiFlexItem />}
            {actions && (
              <EuiFlexItem
                grow={false}
                className="queryWorkspaceDetail__actions"
                data-test-subj="sectionPanelActions"
              >
                {actions}
              </EuiFlexItem>
            )}
          </EuiFlexGroup>
        </div>
      )}
      <div className="queryWorkspaceDetail__body">
        <div className="queryWorkspaceDetail__content">{children}</div>
        {overlay}
      </div>
      {footer && (
        <div className="queryWorkspaceDetail__footer" data-test-subj="sectionPanelFooter">
          {footer}
        </div>
      )}
    </EuiPanel>
  );
};

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ReactNode, useMemo } from 'react';
import { EuiPanel, EuiTab, EuiTabs } from '@elastic/eui';

export interface AuthenticationTabItem {
  id: string;
  name: string;
  content: ReactNode;
  disabled?: boolean;
  href?: string;
}

export interface AuthenticationTabsProps {
  tabs: AuthenticationTabItem[];
  onTabChange: (tabId: string) => void;
  selectedTabId: string;
}

export const AuthenticationTabs = ({
  tabs,
  onTabChange,
  selectedTabId,
}: AuthenticationTabsProps) => {
  /* No tabs data */
  if (!tabs || !tabs.length) {
    return null;
  }

  /* Suppressing below rule as we return null if tabs == null */
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const selectedTabContent = useMemo(() => {
    return tabs.find((obj) => obj.id === selectedTabId)?.content;
  }, [selectedTabId, tabs]);

  const renderTabs = () => {
    return tabs.map((tab, index) => (
      <EuiTab
        key={index}
        href={tab.href}
        onClick={(e) => {
          onTabChange(tab.id);
        }}
        isSelected={tab.id === selectedTabId}
        disabled={tab.disabled}
      >
        {tab.name}
      </EuiTab>
    ));
  };

  return (
    <>
      <EuiTabs size="s">{renderTabs()}</EuiTabs>
      <EuiPanel paddingSize="m" color="transparent" hasBorder={false}>
        {selectedTabContent}
      </EuiPanel>
    </>
  );
};

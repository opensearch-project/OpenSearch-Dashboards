/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './collapsible_nav_group_enabled.scss';
import { EuiFlexItem, EuiFlexGroup, EuiIcon } from '@elastic/eui';
import React, { useState } from 'react';
import { getIsCategoryOpen as getIsCategoryOpenFromStorage, setIsCategoryOpen } from '../../utils';

export interface CollapsibleNavGroupsLabelProps {
  collapsible: boolean;
  storageKey: string;
  storage?: Storage;
  label?: React.ReactNode;
  onToggle?: (isOpen: boolean) => void;
}

export function getIsCategoryOpen(storageKey: string, storage: Storage = window.localStorage) {
  return getIsCategoryOpenFromStorage(storageKey, storage, 'false');
}

export function CollapsibleNavGroupsLabel({
  collapsible,
  storageKey,
  storage = window.localStorage,
  label,
  onToggle,
}: CollapsibleNavGroupsLabelProps) {
  const [, setRenderKey] = useState(Date.now());
  const isOpen = collapsible ? getIsCategoryOpen(storageKey, storage) : true;
  return (
    <EuiFlexGroup
      alignItems="center"
      className={`${collapsible ? 'euiAccordion__button' : undefined}`}
      gutterSize="none"
      onClick={() => {
        if (!collapsible) {
          return;
        }

        setIsCategoryOpen(storageKey, !isOpen, storage);
        // Trigger the element to rerender because `setIsCategoryOpen` is not updating component's state
        setRenderKey(Date.now());
        onToggle?.(!isOpen);
      }}
    >
      <EuiFlexItem>{label}</EuiFlexItem>
      {collapsible ? (
        <EuiFlexItem grow={false}>
          <EuiIcon type={isOpen ? 'minus' : 'plus'} className="leftNavCustomizedAccordionIcon" />
        </EuiFlexItem>
      ) : null}
    </EuiFlexGroup>
  );
}

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiNotificationBadge,
  EuiTitle,
} from '@elastic/eui';
import React from 'react';
import { useState } from 'react';
import './draggable_accordion.scss';

export const DraggableAccordion = ({ children, title, defaultState = true }) => {
  const [isOpen, setIsOpen] = useState(defaultState);

  function handleOnClick() {
    setIsOpen(!isOpen);
  }

  return (
    <div className="draggableAccordion">
      <EuiFlexGroup direction="column" justifyContent="center" gutterSize="none" responsive={false}>
        <EuiFlexGroup
          direction="row"
          gutterSize="none"
          justifyContent="spaceBetween"
          responsive={false}
        >
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              onClick={handleOnClick}
              iconType={isOpen ? 'arrowDown' : 'arrowRight'}
              aria-label="Expand Elements"
              className="draggableAccordion__button"
              size="s"
              flush="both"
            >
              <EuiTitle size="xxs">
                <span>{title}</span>
              </EuiTitle>
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem className="draggableAccordion__badge" grow={false}>
            <EuiNotificationBadge color="subdued" size="m">
              {children?.length || 0}
            </EuiNotificationBadge>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup direction="column" gutterSize="none" responsive={false}>
          {isOpen && children}
        </EuiFlexGroup>
      </EuiFlexGroup>
    </div>
  );
};

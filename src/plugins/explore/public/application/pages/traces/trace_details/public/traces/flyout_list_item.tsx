/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiSmallButtonIcon,
  EuiDescriptionList,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiText,
  EuiToolTip,
} from '@elastic/eui';
import React, { useState } from 'react';
import './flyout_list_item.scss';

interface FlyoutListItemProps {
  title: React.ReactNode;
  description: React.ReactNode;
  addSpanFilter?: () => void;
}

export function FlyoutListItem(props: FlyoutListItemProps) {
  const [hover, setHover] = useState(false);

  const descriptionComponent =
    props.description !== '-' ? (
      <EuiFlexGroup gutterSize="none">
        <EuiFlexItem>
          <EuiText size="s" className="flyout-list-item__description-text">
            <b>{props.description}</b>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          {hover && props.addSpanFilter && (
            <EuiToolTip position="top" content="Filter spans on this value">
              <EuiSmallButtonIcon
                aria-label="span-flyout-filter-icon"
                iconType="filter"
                onClick={props.addSpanFilter}
                className="flyout-list-item__filter-button"
              />
            </EuiToolTip>
          )}
        </EuiFlexItem>
      </EuiFlexGroup>
    ) : (
      <EuiText size="s" className="flyout-list-item__description-text">
        <b>{props.description}</b>
      </EuiText>
    );
  return (
    <>
      <div
        onMouseOver={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
      >
        <EuiDescriptionList
          data-test-subj={`${props.title}DescriptionList`}
          listItems={[
            {
              title: (
                <EuiText size="s" color="subdued" className="flyout-list-item__title-text">
                  {props.title}
                </EuiText>
              ),
              description: descriptionComponent,
            },
          ]}
          type="column"
          align="center"
          compressed
        />
      </div>
      <EuiSpacer size="s" />
    </>
  );
}

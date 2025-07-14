/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiIconProps,
  EuiToolTip,
} from '@elastic/eui';
import React from 'react';
import { Observable } from 'rxjs';
import useObservable from 'react-use/lib/useObservable';

import './left_bottom_action_button.scss';

interface LeftBottomActionButtonProps {
  isNavDrawerLocked$: Observable<boolean>;
  iconType?: EuiIconProps['type'];
  icon?: React.ReactNode;
  onClick?: () => void;
  title: string;
}

export const LeftBottomActionButton = (props: LeftBottomActionButtonProps) => {
  const isNavOpen = useObservable(props.isNavDrawerLocked$, false);

  let finalIcon: React.ReactNode | undefined = props.icon;

  if (props.iconType) {
    finalIcon = <EuiIcon type={props.iconType} aria-label={props.title} color="text" />;
  }

  return isNavOpen ? (
    <EuiFlexGroup
      style={{ cursor: 'pointer' }}
      gutterSize="s"
      alignItems="center"
      onClick={props.onClick}
    >
      <EuiFlexItem className="leftBottomActionButtonIconItem" grow={false}>
        {finalIcon}
      </EuiFlexItem>
      <EuiFlexItem className="leftBottomActionButtonTitleItem">{props.title}</EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiIcon type="arrowRight" color="text" />
      </EuiFlexItem>
    </EuiFlexGroup>
  ) : (
    <EuiToolTip content={props.title}>
      <EuiButtonEmpty onClick={props.onClick}>{finalIcon}</EuiButtonEmpty>
    </EuiToolTip>
  );
};

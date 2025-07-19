/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButtonEmpty, EuiIcon, EuiIconProps, EuiToolTip } from '@elastic/eui';
import React from 'react';
import { Observable } from 'rxjs';
import useObservable from 'react-use/lib/useObservable';

import './left_bottom_action_button.scss';

interface LeftBottomActionButtonProps {
  isNavDrawerLocked$: Observable<boolean>;
  isChromeVisible$: Observable<boolean>;
  iconType?: EuiIconProps['type'];
  icon?: React.ReactNode;
  onClick?: () => void;
  title: string;
  ['arial-label']?: string;
}

export const LeftBottomActionButton = (props: LeftBottomActionButtonProps) => {
  const isNavOpen = useObservable(props.isNavDrawerLocked$, false);
  const isVisible = useObservable(props.isChromeVisible$, true);

  let finalIcon: React.ReactNode | undefined = props.icon;

  if (props.iconType) {
    finalIcon = <EuiIcon type={props.iconType} aria-label={props.title} color="text" />;
  }

  return isNavOpen && isVisible ? (
    <EuiButtonEmpty
      color="text"
      aria-label={props['arial-label'] || props.title}
      flush="both"
      onClick={props.onClick}
      size="xs"
      className="leftBottomActionButton"
    >
      <div className="leftBottomActionButtonContent">
        <div className="leftBottomActionButtonIconItem">{finalIcon}</div>
        <div className="leftBottomActionButtonTitleItem eui-textTruncate" title={props.title}>
          {props.title}
        </div>
        <EuiIcon type="arrowRight" color="text" />
      </div>
    </EuiButtonEmpty>
  ) : (
    <EuiToolTip content={props.title}>
      <EuiButtonEmpty
        aria-label={props['arial-label'] || props.title}
        flush="both"
        size="xs"
        onClick={props.onClick}
      >
        {finalIcon}
      </EuiButtonEmpty>
    </EuiToolTip>
  );
};

/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { upperFirst, isFunction } from 'lodash';
import React, { MouseEvent } from 'react';
import classNames from 'classnames';
import {
  EuiToolTip,
  EuiButton,
  EuiHeaderLink,
  EuiCompressedSwitch,
  EuiButtonIcon,
  EuiSwitch,
  EuiSwitchEvent,
} from '@elastic/eui';
import {
  TopNavMenuClickAction,
  TopNavMenuData,
  TopNavMenuLegacyData,
  TopNavMenuSwitchAction,
  TopNavMenuSwitchData,
} from './top_nav_menu_data';

function TopNavMenuLegacyItem(props: TopNavMenuLegacyData) {
  function isDisabled(): boolean {
    const val = isFunction(props.disableButton) ? props.disableButton() : props.disableButton;
    return val!;
  }

  function getTooltip(): string {
    const val = isFunction(props.tooltip) ? props.tooltip() : props.tooltip;
    return val!;
  }

  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    if (isDisabled()) return;
    props.run(e.currentTarget);
  }

  const commonButtonProps = {
    isDisabled: isDisabled(),
    onClick: handleClick,
    iconType: props.iconType,
    iconSide: props.iconSide,
    'data-test-subj': props.testId,
    className: props.className,
    'aria-label': props.ariaLabel,
  };

  let component;
  if (props.type === 'toggle') {
    component = (
      <EuiCompressedSwitch
        label={upperFirst(props.label || props.id!)}
        checked={props.emphasize || false}
        onChange={(e) => {
          handleClick((e as unknown) as MouseEvent<HTMLButtonElement>);
        }}
        data-test-subj={props.testId}
        className={props.className}
      />
    );
  } else {
    component = props.emphasize ? (
      <EuiButton size="s" {...commonButtonProps}>
        {upperFirst(props.label || props.id!)}
      </EuiButton>
    ) : (
      <EuiHeaderLink size="xs" color="primary" {...commonButtonProps}>
        {upperFirst(props.label || props.id!)}
      </EuiHeaderLink>
    );
  }

  const tooltip = getTooltip();
  if (tooltip) {
    return <EuiToolTip content={tooltip}>{component}</EuiToolTip>;
  }
  return component;
}

export function TopNavMenuItem(props: TopNavMenuData) {
  if (!('controlType' in props)) return TopNavMenuLegacyItem(props);

  const { disabled, tooltip, run } = props as Exclude<TopNavMenuData, TopNavMenuLegacyData>;

  const isDisabled = () => Boolean(typeof disabled === 'function' ? disabled() : disabled);

  const handleClick = (e: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    if (!isDisabled()) (run as TopNavMenuClickAction)?.(e.currentTarget);
  };

  const getComponent = (addTypeClassName: boolean = false) => {
    const className = classNames(props.className, {
      [`osdTopNavGroup--${props.controlType}`]: addTypeClassName,
      'osdTopNavGroup-isDisabled': isDisabled(),
    });
    switch (props.controlType) {
      case 'button':
        return (
          <>
            {/* eslint-disable-next-line @elastic/eui/href-or-on-click */}
            <EuiButton
              size="s"
              iconType={props.iconType}
              iconSide={props.iconSide}
              className={className}
              isLoading={props.isLoading}
              href={props.href}
              isDisabled={isDisabled()}
              onClick={handleClick}
              aria-label={props.ariaLabel}
              data-test-subj={props.testId}
              color="text"
            >
              {props.label}
            </EuiButton>
          </>
        );

      case 'icon':
        return (
          <EuiButtonIcon
            size="s"
            display="base"
            iconType={props.iconType}
            className={className}
            href={props.href}
            isDisabled={isDisabled()}
            onClick={handleClick}
            aria-label={props.ariaLabel}
            data-test-subj={props.testId}
            color="text"
          />
        );

      case 'switch':
        const { checked } = props as TopNavMenuSwitchData;

        const isChecked = () => Boolean(typeof checked === 'function' ? checked() : checked);

        const handleSwitch = (e: EuiSwitchEvent) => {
          if (!isDisabled()) (run as TopNavMenuSwitchAction)?.(e.currentTarget, e.target.checked);
        };

        return (
          <EuiSwitch
            compressed
            label={props.label}
            checked={isChecked()}
            className={className}
            disabled={isDisabled()}
            onChange={handleSwitch}
            aria-label={props.ariaLabel}
            data-test-subj={props.testId}
            color="text"
            display="base"
          />
        );
    }
  };

  const tooltipContent = typeof tooltip === 'function' ? tooltip() : tooltip;

  if (tooltipContent) {
    const className = classNames(`osdTopNavGroup--${props.controlType}`, {
      'osdTopNavGroup-isDisabled': isDisabled(),
    });
    return (
      <EuiToolTip content={tooltipContent} anchorClassName={className}>
        {getComponent()}
      </EuiToolTip>
    );
  }

  return getComponent(true);
}

TopNavMenuItem.defaultProps = {
  disableButton: false,
  tooltip: '',
};

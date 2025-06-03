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

import {
  EuiButton,
  EuiHeaderLink,
  EuiButtonIcon,
  EuiText,
  EuiToolTip,
  EuiHeaderLinkProps,
} from '@elastic/eui';
import { upperFirst } from 'lodash';
import React, { MouseEvent } from 'react';
import { TopNavControlData } from './top_nav_control_data';

export function TopNavControlItem(props: TopNavControlData) {
  if ('renderComponent' in props) return props.renderComponent;

  if ('text' in props) {
    const { text, ...rest } = props;
    return (
      <EuiText size="s" {...rest}>
        {text}
      </EuiText>
    );
  }

  if ('description' in props) {
    const links = props.links && [props.links].flat();

    return (
      <EuiText className="descriptionHeaderControl" size="s">
        {props.description}
        {links?.map((linkProps) => (
          <>
            {' '}
            {/* @ts-ignore using an undefined property to prevent abuse */}
            <TopNavControlItem {...linkProps} sizeOverride="xs" />
          </>
        ))}
      </EuiText>
    );
  }

  function isDisabled(): boolean {
    if ('isDisabled' in props) {
      const val = typeof props.isDisabled === 'function' ? props.isDisabled() : props.isDisabled;
      return val || false;
    }
    return false;
  }

  function getTooltip(): string {
    if ('tooltip' in props) {
      const val = typeof props.tooltip === 'function' ? props.tooltip() : props.tooltip;
      return val || '';
    }
    return '';
  }

  function handleClick(e: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) {
    if ('run' in props && !isDisabled()) props.run?.(e.currentTarget);
  }

  let component;
  switch (props.controlType) {
    case 'icon':
      component = (
        <EuiButtonIcon
          size="s"
          iconType={props.iconType}
          iconSize={props.iconSize}
          color={props.color}
          className={props.className}
          href={props.href}
          target={props.target}
          isDisabled={isDisabled()}
          onClick={handleClick}
          aria-label={props.ariaLabel}
          data-test-subj={props.testId}
          display={props.display || 'empty'}
        />
      );
      break;

    case 'link':
      let { iconType, iconSide } = props;
      let iconGap: EuiHeaderLinkProps['iconGap'];
      if (props.target === '_blank') {
        iconType = 'popout';
        iconSide = 'right';
        iconGap = 's';
      }

      component = (
        <EuiHeaderLink
          // @ts-ignore using an undefined property to prevent abuse
          size={props.sizeOverride || 's'}
          iconType={iconType}
          iconSide={iconSide}
          iconGap={iconGap}
          iconSize={props.iconSize}
          color={props.color}
          flush={props.flush}
          className={props.className}
          href={props.href}
          target={props.target}
          isDisabled={isDisabled()}
          onClick={handleClick}
          aria-label={props.ariaLabel}
          data-test-subj={props.testId}
          isLoading={props.isLoading}
        >
          {upperFirst(props.label || props.id)}
        </EuiHeaderLink>
      );
      break;

    default:
      component = (
        <>
          {/* eslint-disable-next-line @elastic/eui/href-or-on-click */}
          <EuiButton
            size="s"
            iconType={props.iconType}
            iconSide={props.iconSide}
            iconSize={props.iconSize}
            color={props.color}
            fill={props.fill}
            className={props.className}
            href={props.href}
            target={props.target}
            isDisabled={isDisabled()}
            onClick={handleClick}
            aria-label={props.ariaLabel}
            data-test-subj={props.testId}
            isLoading={props.isLoading}
          >
            {upperFirst(props.label || props.id)}
          </EuiButton>
        </>
      );
  }

  const tooltip = getTooltip();
  if (tooltip) {
    return <EuiToolTip content={tooltip}>{component}</EuiToolTip>;
  }
  return component;
}

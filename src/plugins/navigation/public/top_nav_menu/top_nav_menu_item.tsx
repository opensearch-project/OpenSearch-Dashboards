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
import { EuiToolTip, EuiButton, EuiHeaderLink, EuiSwitch } from '@elastic/eui';
import { TopNavMenuData } from './top_nav_menu_data';

export function TopNavMenuItem(props: TopNavMenuData) {
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
  };

  let component;
  if (props.type === 'toggle') {
    component = (
      <EuiSwitch
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

TopNavMenuItem.defaultProps = {
  disableButton: false,
  tooltip: '',
};

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

import { EuiButtonProps, EuiButtonIconProps } from '@elastic/eui';
import { EuiIconType } from '@elastic/eui/src/components/icon/icon';

export type TopNavMenuAction = (anchorElement: HTMLElement) => void;
export type TopNavMenuClickAction = (targetElement: HTMLElement) => void;
export type TopNavMenuSwitchAction = (targetElement: HTMLElement, checked: boolean) => void;

// @deprecated
export interface TopNavMenuLegacyData {
  id?: string;
  label: string;
  run: TopNavMenuAction;
  description?: string;
  testId?: string;
  className?: string;
  disableButton?: boolean | (() => boolean);
  tooltip?: string | (() => string | undefined);
  ariaLabel?: string;
  emphasize?: boolean;
  iconType?: EuiIconType;
  iconSide?: EuiButtonProps['iconSide'];
  // @deprecated - experimental, do not use yet. Will be removed in a future minor version
  type?: 'toggle' | 'button';
}

type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

interface TopNavMenuCommonData {
  testId?: string;
  className?: string;
  disabled?: boolean | (() => boolean);
  tooltip?: string | (() => string | undefined);
}

export type TopNavMenuButtonData = TopNavMenuCommonData &
  RequireAtLeastOne<
    {
      label: string;
      iconType?: EuiButtonProps['iconType'];
      iconSide?: EuiButtonProps['iconSide'];
      ariaLabel?: string;
      isLoading?: boolean;
      run?: TopNavMenuClickAction;
      href?: string;
      controlType: 'button';
    },
    'href' | 'run'
  >;

export type TopNavMenuIconData = TopNavMenuCommonData &
  RequireAtLeastOne<
    {
      iconType: EuiButtonIconProps['iconType'];
      ariaLabel: string;
      run?: TopNavMenuClickAction;
      href?: string;
      tooltip: string | (() => string | undefined);
      controlType: 'icon';
    },
    'href' | 'run'
  >;

export type TopNavMenuSwitchData = TopNavMenuCommonData & {
  label: string;
  ariaLabel?: string;
  checked: boolean | (() => boolean);
  run: TopNavMenuSwitchAction;
  controlType: 'switch';
};

export type TopNavMenuData =
  | TopNavMenuLegacyData
  | TopNavMenuButtonData
  | TopNavMenuIconData
  | TopNavMenuSwitchData;

export type RegisteredTopNavMenuData = TopNavMenuData & {
  appName?: string;
};

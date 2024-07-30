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

import { EuiButtonProps, EuiTextProps, EuiHeaderLinkProps, EuiButtonIconProps } from '@elastic/eui';
import { EuiIconType } from '@elastic/eui/src/components/icon/icon';

export type TopNavControlAction = (anchorElement: HTMLElement) => void;

interface TopNavControlButtonOrLinkOrIconData {
  id?: string;
  testId?: string;
  className?: string;
  fill?: boolean;
  isDisabled?: boolean | (() => boolean);
  tooltip?: string | (() => string | undefined);
  ariaLabel?: string;
  emphasize?: boolean;
  iconSide?: EuiButtonProps['iconSide'];
  iconSize?: EuiButtonProps['iconSize'];
  type?: 'button' | 'link' | 'icon';
}

interface TopNavControlTextData {
  text: string;
  className?: string;
  textAlign?: EuiTextProps['textAlign'];
  color?: EuiTextProps['color'];
}

type TopNavControlLinkData = TopNavControlButtonOrLinkOrIconData & {
  label: string;
  isLoading?: boolean;
  iconType?: EuiIconType;
  href: string;
  color?: EuiHeaderLinkProps['color'];
  type: 'link';
};

type TopNavControlButtonData = TopNavControlButtonOrLinkOrIconData & {
  label: string;
  isLoading?: boolean;
  iconType?: EuiIconType;
  run: TopNavControlAction;
  color?: EuiButtonProps['color'];
  type?: 'button';
};

type TopNavControlIconData = TopNavControlButtonOrLinkOrIconData & {
  iconType: EuiIconType;
  ariaLabel: string;
  color?: EuiButtonIconProps['color'];
  run: TopNavControlAction;
  type: 'icon';
};

interface TopNavControlDescriptionData {
  description: string;
}

interface TopNavControlComponentData {
  renderComponent: React.ReactElement;
}

export type TopNavControlData =
  | TopNavControlButtonData
  | TopNavControlLinkData
  | TopNavControlIconData
  | TopNavControlTextData
  | TopNavControlDescriptionData
  | TopNavControlComponentData;

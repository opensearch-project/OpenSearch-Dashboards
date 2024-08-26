/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButtonProps, EuiTextProps, EuiHeaderLinkProps, EuiButtonIconProps } from '@elastic/eui';

export type TopNavControlAction = (targetElement: HTMLElement) => void;

type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

interface TopNavControlButtonOrLinkOrIconData {
  // @deprecated
  id?: string;
  testId?: string;
  className?: string;
  isDisabled?: boolean | (() => boolean);
  tooltip?: string | (() => string | undefined);
  ariaLabel?: string;
  target?: '_blank';
  iconSize?: EuiButtonProps['iconSize'];
}

export type TopNavControlLinkData = TopNavControlButtonOrLinkOrIconData &
  RequireAtLeastOne<
    {
      label: string;
      isLoading?: boolean;
      href?: string;
      run?: TopNavControlAction;
      iconType?: EuiHeaderLinkProps['iconType'];
      iconSide?: EuiHeaderLinkProps['iconSide'];
      iconGap?: EuiHeaderLinkProps['iconGap'];
      color?: EuiHeaderLinkProps['color'];
      flush?: EuiHeaderLinkProps['flush'];
      controlType: 'link';
    },
    'href' | 'run'
  >;

export type TopNavControlButtonData = TopNavControlButtonOrLinkOrIconData &
  RequireAtLeastOne<
    {
      label: string;
      isLoading?: boolean;
      href?: string;
      run?: TopNavControlAction;
      iconType?: EuiButtonProps['iconType'];
      iconSide?: EuiButtonProps['iconSide'];
      iconGap?: EuiHeaderLinkProps['iconGap'];
      color?: EuiButtonProps['color'];
      fill?: EuiButtonProps['fill'];
      controlType?: 'button';
    },
    'href' | 'run'
  >;

export type TopNavControlIconData = TopNavControlButtonOrLinkOrIconData &
  RequireAtLeastOne<
    {
      iconType: EuiButtonIconProps['iconType'];
      ariaLabel: string;
      href?: string;
      run?: TopNavControlAction;
      display?: EuiButtonIconProps['display'];
      color?: EuiButtonIconProps['color'];
      controlType: 'icon';
    },
    'href' | 'run'
  >;

export interface TopNavControlTextData {
  text: string;
  className?: string;
  textAlign?: EuiTextProps['textAlign'];
  color?: EuiTextProps['color'];
}

export interface TopNavControlDescriptionData {
  description: string;
  links?: TopNavControlLinkData | TopNavControlLinkData[];
}

export interface TopNavControlComponentData {
  renderComponent: React.ReactElement;
}

export type TopNavControlData =
  | TopNavControlButtonData
  | TopNavControlLinkData
  | TopNavControlIconData
  | TopNavControlTextData
  | TopNavControlDescriptionData
  | TopNavControlComponentData;

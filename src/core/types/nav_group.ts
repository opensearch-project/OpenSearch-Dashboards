/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiIconType } from '@elastic/eui/src/components/icon/icon';

/**
 * There are two types of navGroup:
 * 1: system nav group, like data administration / settings and setup
 * 2: use case group, like observability.
 *
 * by default the nav group will be regarded as use case group.
 */
export enum NavGroupType {
  SYSTEM = 'system',
}

export enum NavGroupStatus {
  Visible,
  Hidden,
}

/** @public */
export interface ChromeNavGroup {
  id: string;
  title: string;
  description: string;
  order?: number;
  icon?: EuiIconType;
  type?: NavGroupType;

  status?: NavGroupStatus;
}

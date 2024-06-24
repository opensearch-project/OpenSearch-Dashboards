/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiIconType } from '@elastic/eui/src/components/icon/icon';

export enum NavGroupType {
  SYSTEM = 'system',
}

/** @public */
export interface ChromeNavGroup {
  id: string;
  title: string;
  description: string;
  order?: number;
  icon?: EuiIconType;

  /**
   * Groups with type of NavGroupType.SYSTEM will:
   * 1. Always display before USE_CASE_GROUP.
   * 2. Not be pickable within the workspace creation page.
   *
   * @default undefined indicates it is of type useCase
   */
  type?: NavGroupType;
}

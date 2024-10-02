/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { UiSettingScope } from './types';

export const CURRENT_USER_PLACEHOLDER = '<current_user>';

export const buildDocIdWithScope = (id: string, scope?: UiSettingScope) => {
  if (scope === UiSettingScope.USER) {
    return `${CURRENT_USER_PLACEHOLDER}_${id}`;
  }
  return id;
};

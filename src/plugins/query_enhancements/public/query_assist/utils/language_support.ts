/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPL_SUPPORT_DATASET_TYPES } from './constant';

export const isPPLSupportedType = (type?: string) => {
  if (!type) {
    return false;
  }

  return PPL_SUPPORT_DATASET_TYPES.includes(type);
};

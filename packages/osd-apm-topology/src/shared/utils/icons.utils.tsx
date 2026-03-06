/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { ICONS } from '../constants/icons.constants';
import { ServiceLensUnknownNodeIcon } from '../resources/services';

export const getIcon = (type: string) => {
  const icon = ICONS?.[type];
  if (icon) {
    return <img src={icon} alt="" />;
  }
  return <img src={ServiceLensUnknownNodeIcon} alt="" />;
};

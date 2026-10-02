/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { ICONS } from '../constants/icons.constants';
import { isBrandIconKey } from '../constants/dependency_icons.constants';
import { ServiceLensUnknownNodeIcon } from '../resources/services';

export const getIcon = (type: string) => {
  const icon = ICONS?.[type];
  if (icon) {
    // Brand marks keep their official color (see celestial.scss .celBrandIcon).
    return (
      <img
        src={icon}
        alt=""
        className={isBrandIconKey(type) || type === 'Kafka' ? 'celBrandIcon' : undefined}
      />
    );
  }
  return <img src={ServiceLensUnknownNodeIcon} alt="" />;
};

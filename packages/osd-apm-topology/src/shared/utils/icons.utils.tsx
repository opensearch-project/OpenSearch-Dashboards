/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { ICONS } from '../constants/icons.constants';
import { getBrandIconClassName } from '../constants/dependency_icons.constants';
import { ServiceLensUnknownNodeIcon } from '../resources/services';

export const getIcon = (type: string) => {
  const icon = ICONS?.[type];
  if (icon) {
    // Brand marks keep their official color (see celestial.scss .celBrandIcon).
    const brandClassName = getBrandIconClassName(
      type === 'Kafka' || type === 'Messaging::Kafka' ? 'kafka' : type.replace(/^Dependency::/, '')
    );
    return <img src={icon} alt="" className={brandClassName || undefined} />;
  }
  return <img src={ServiceLensUnknownNodeIcon} alt="" />;
};

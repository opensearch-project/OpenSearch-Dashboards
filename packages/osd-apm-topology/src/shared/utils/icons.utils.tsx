/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { ICONS } from '../constants/icons.constants';
import {
  getBrandIconClassName,
  getDependencySystemDarkIcon,
} from '../constants/dependency_icons.constants';
import { ServiceLensUnknownNodeIcon } from '../resources/services';

export const getIcon = (type: string) => {
  const icon = ICONS?.[type];
  if (icon) {
    // Brand marks keep their official color (see celestial.scss .celBrandIcon).
    const system =
      type === 'Kafka' || type === 'Messaging::Kafka' ? 'kafka' : type.replace(/^Dependency::/, '');
    const brandClassName = getBrandIconClassName(system);
    const darkIcon = getDependencySystemDarkIcon(system);
    if (darkIcon) {
      // The vendor's light version replaces the mark in dark mode (see celestial.scss).
      return (
        <>
          <img src={icon} alt="" className={`${brandClassName} celBrandIcon--lightTheme`} />
          <img src={darkIcon} alt="" className={`${brandClassName} celBrandIcon--darkTheme`} />
        </>
      );
    }
    return <img src={icon} alt="" className={brandClassName || undefined} />;
  }
  return <img src={ServiceLensUnknownNodeIcon} alt="" />;
};

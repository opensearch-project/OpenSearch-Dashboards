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

import React, { CSSProperties } from 'react';
import { ChromeGlobalBanner } from '../../chrome_service';

interface HeaderBannerProps {
  globalBanner?: ChromeGlobalBanner;
  style?: CSSProperties;
}

/**
 * HeaderBanner component that renders the banner in the header
 * This component is extracted from the Header component for better separation and extensibility
 */
export const HeaderBanner: React.FC<HeaderBannerProps> = ({ globalBanner, style }) => {
  return (
    <>
      {globalBanner && (
        <div className="globalBanner" style={style}>
          {globalBanner.component}
        </div>
      )}
    </>
  );
};

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

import { useState, useEffect } from 'react';
import { ChromeStart } from 'opensearch-dashboards/public';

export const useChromeVisibility = (chrome: ChromeStart) => {
  const [isVisible, setIsVisible] = useState<boolean>(true);

  useEffect(() => {
    const subscription = chrome.getIsVisible$().subscribe((value: boolean) => {
      setIsVisible(value);
    });

    return () => subscription.unsubscribe();
  }, [chrome]);

  return isVisible;
};

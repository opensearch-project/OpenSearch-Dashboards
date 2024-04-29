/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiHeaderSectionItemButton, EuiIcon } from '@elastic/eui';
import React, { useMemo } from 'react';
import { CoreStart } from '../../..';

import { isModifiedOrPrevented } from './nav_link';
export interface RightNavigationButtonProps {
  application: CoreStart['application'];
  http: CoreStart['http'];
  appId: string;
  iconType: string;
  title: string;
}

export const RightNavigationButton = ({
  application,
  http,
  appId,
  iconType,
  title,
}: RightNavigationButtonProps) => {
  const targetUrl = useMemo(() => {
    const appUrl = application.getUrlForApp(appId, {
      path: '/',
      absolute: false,
    });
    // Remove prefix in Url including workspace and other prefix
    return http.basePath.prepend(http.basePath.remove(appUrl), {
      withoutClientBasePath: true,
    });
  }, [application, http.basePath, appId]);

  const isLeftClickEvent = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    return event.button === 0;
  };

  const navigateToApp = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    /* Use href and onClick to support "open in new tab" and SPA navigation in the same link */
    if (
      isLeftClickEvent(event) && // ignore everything but left clicks
      !isModifiedOrPrevented(event)
    ) {
      event.preventDefault();
      application.navigateToUrl(targetUrl);
    }
    return;
  };

  return (
    <EuiHeaderSectionItemButton
      data-test-subj="rightNavigationButton"
      aria-label={title}
      onClick={navigateToApp}
      href={targetUrl}
    >
      <EuiIcon type={iconType} size="m" title={title} color="text" />
    </EuiHeaderSectionItemButton>
  );
};

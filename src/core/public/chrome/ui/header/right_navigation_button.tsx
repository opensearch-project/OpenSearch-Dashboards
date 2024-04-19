/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiHeaderSectionItemButton, EuiIcon } from '@elastic/eui';
import React from 'react';
import { InternalApplicationStart } from '../../../application';
import { HttpStart } from '../../../http';

export interface RightNavigationButtonProps {
  application: InternalApplicationStart;
  http: HttpStart;
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
  const navigateToApp = () => {
    const appUrl = application.getUrlForApp(appId, {
      path: '/',
      absolute: false,
    });
    // Remove prefix in Url including workspace and other prefix
    const targetUrl = http.basePath.prepend(http.basePath.remove(appUrl), {
      withoutClientBasePath: true,
    });
    application.navigateToUrl(targetUrl);
  };

  return (
    <EuiHeaderSectionItemButton
      data-test-subj="rightNavigationButton"
      aria-label={title}
      onClick={navigateToApp}
    >
      <EuiIcon type={iconType} size="m" title={title} color="text" />
    </EuiHeaderSectionItemButton>
  );
};

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiIcon } from '@elastic/eui';
import { ChromeBranding } from '../../../chrome_service';

/**
 * Use branding configurations to render the header mark on the nav bar.
 *
 * @param {ChromeBranding} - branding object consist of mark, darkmode selection, asset path and title
 * @returns Mark component which is going to be rendered on the main page header bar.
 */
export const Mark = ({
  darkMode,
  assetFolderUrl = '',
  mark,
  applicationTitle = 'opensearch dashboards',
}: ChromeBranding) => {
  const { defaultUrl: markUrl, darkModeUrl: darkMarkUrl } = mark ?? {};

  const customMark = darkMode ? darkMarkUrl ?? markUrl : markUrl;
  const defaultMark = darkMode
    ? 'opensearch_mark_dark_mode.svg'
    : 'opensearch_mark_default_mode.svg';
  const altText = `${applicationTitle} logo`;

  const iconType = customMark ? customMark : `${assetFolderUrl}/${defaultMark}`;
  const testSubj = customMark ? 'customLogo' : 'defaultLogo';

  return (
    <EuiIcon
      data-test-subj={testSubj}
      data-test-image-url={iconType}
      type={iconType}
      title={altText}
      className="logoImage"
      size="l"
    />
  );
};

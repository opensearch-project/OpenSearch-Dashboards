/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiIcon } from '@elastic/eui';
import { ChromeBranding } from '../../chrome_service';

/**
 * Use branding configurations to render the header mark on the nav bar.
 *
 * @param {ChromeBranding} - branding object consist of mark, darkmode selection, asset path and title
 * @returns Mark component which is going to be rendered on the main page header bar.
 */
export const HomeIcon = ({
  darkMode,
  assetFolderUrl = '',
  mark,
  applicationTitle = 'opensearch dashboards',
  useExpandedMenu = false,
}: ChromeBranding) => {
  const { defaultUrl: markUrl, darkModeUrl: darkMarkUrl } = mark ?? {};

  const customMark = darkMode ? darkMarkUrl ?? markUrl : markUrl;
  const defaultMark = darkMode
    ? 'opensearch_mark_dark_mode.svg'
    : 'opensearch_mark_default_mode.svg';

  const getIconProps = () => {
    const iconType = customMark
      ? customMark
      : useExpandedMenu
      ? 'home'
      : `${assetFolderUrl}/${defaultMark}`;
    const testSubj = customMark ? 'customMark' : useExpandedMenu ? 'homeIcon' : 'defaultMark';
    const title = `${applicationTitle} home`;
    // marks look better at the large size, but the home icon should be medium to fit in with other icons
    const size = iconType === 'home' ? ('m' as const) : ('l' as const);

    return {
      'data-test-subj': testSubj,
      'data-test-image-url': iconType,
      type: iconType,
      title,
      size,
    };
  };

  const props = getIconProps();

  return <EuiIcon className="logoImage" {...props} />;
};

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './header_logo.scss';
import React from 'react';
import { ChromeBranding } from '../../chrome_service';

/**
 * Use branding configurations to render the logo on the nav bar.
 *
 * @param {ChromeBranding} - branding object consist of logo, darkmode selection, asset path and title
 * @returns Logo component
 */
export const HeaderLogo = ({
  darkMode,
  assetFolderUrl = '',
  logo,
  applicationTitle = 'opensearch dashboards',
}: ChromeBranding) => {
  const { defaultUrl: logoUrl, darkModeUrl: darkLogoUrl } = logo ?? {};

  const customLogo = darkMode ? darkLogoUrl ?? logoUrl : logoUrl;
  const defaultLogo = darkMode
    ? 'opensearch_logo_dark_mode.svg'
    : 'opensearch_logo_default_mode.svg';

  const logoSrc = customLogo ? customLogo : `${assetFolderUrl}/${defaultLogo}`;
  const testSubj = customLogo ? 'customLogo' : 'defaultLogo';
  const alt = `${applicationTitle} logo`;

  return (
    <div className="logoContainer">
      <img
        data-test-subj={testSubj}
        data-test-image-url={logoSrc}
        src={logoSrc}
        alt={alt}
        loading="lazy"
        className="logoImage"
      />
    </div>
  );
};

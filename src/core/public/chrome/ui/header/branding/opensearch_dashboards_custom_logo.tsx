/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import '../header_logo.scss';
import { ChromeBranding } from '../../../chrome_service';

/**
 * Use branding configurations to render the header logo on the nav bar.
 *
 * @param {ChromeBranding} - branding object consist of logo, mark and title
 * @returns Custom branding logo component which is going to be rendered on the main page header bar.
 *          If logo default is valid, the full logo by logo default config will be rendered;
 *          if not, the logo icon by mark default config will be rendered; if both are not found,
 *          the default OpenSearch Dashboards logo will be rendered.
 */
export const CustomLogo = ({ ...branding }: ChromeBranding) => {
  const darkMode = branding.darkMode;
  const assetFolderUrl = branding.assetFolderUrl;
  const logoDefault = branding.logo?.defaultUrl;
  const logoDarkMode = branding.logo?.darkModeUrl;
  const markDefault = branding.mark?.defaultUrl;
  const markDarkMode = branding.mark?.darkModeUrl;
  const applicationTitle = branding.applicationTitle;

  /**
   * Use branding configurations to check which URL to use for rendering
   * header logo in nav bar in default mode
   *
   * @returns a valid custom URL or undefined if no valid URL is provided
   */
  const customHeaderLogoDefaultMode = () => {
    return logoDefault ?? markDefault ?? undefined;
  };

  /**
   * Use branding configurations to check which URL to use for rendering
   * header logo in nav bar in dark mode
   *
   * @returns a valid custom URL or undefined if no valid URL is provided
   */
  const customHeaderLogoDarkMode = () => {
    return logoDarkMode ?? logoDefault ?? markDarkMode ?? markDefault ?? undefined;
  };

  /**
   * Render custom header logo for both default mode and dark mode
   *
   * @returns a valid custom header logo URL, or undefined
   */
  const customHeaderLogo = () => {
    return darkMode ? customHeaderLogoDarkMode() : customHeaderLogoDefaultMode();
  };

  return customHeaderLogo() ? (
    <div className="logoContainer">
      <img
        data-test-subj="customLogo"
        data-test-image-url={customHeaderLogo()}
        src={customHeaderLogo()}
        alt={applicationTitle + ' logo'}
        loading="lazy"
        className="logoImage"
      />
    </div>
  ) : (
    <img src={`${assetFolderUrl}/opensearch_logo.svg`} alt={applicationTitle + ' logo'} />
  );
};

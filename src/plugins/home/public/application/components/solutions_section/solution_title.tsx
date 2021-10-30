/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import React, { FC } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiToken,
  EuiTitle,
  EuiText,
  EuiIcon,
  IconType,
} from '@elastic/eui';
import { HomePluginBranding } from '../../../plugin';

interface Props {
  /**
   * @deprecated
   * Title will be deprecated because we will use title config from branding
   */
  title: string;
  subtitle: string;
  /**
   * @deprecated
   * IconType will be deprecated because we will make rendering custom dashboard logo logic consistent with other logos' logic
   */
  iconType: IconType;
  branding: HomePluginBranding;
}

/**
 * Use branding configurations to check which URL to use for rendering
 * home card logo in default mode. In default mode, home card logo will
 * proritize default mode mark URL. If it is invalid, default opensearch logo
 * will be rendered.
 *
 * @param {HomePluginBranding} - pass in custom branding configurations
 * @returns a valid custom URL or undefined if no valid URL is provided
 */
const customHomeLogoDefaultMode = (branding: HomePluginBranding) => {
  return branding.mark?.defaultUrl ?? undefined;
};

/**
 * Use branding configurations to check which URL to use for rendering
 * home logo in dark mode. In dark mode, home logo will render
 * dark mode mark URL if valid. Otherwise, it will render the default
 * mode mark URL if valid. If both dark mode mark URL and default mode mark
 * URL are invalid, the default opensearch logo will be rendered.
 *
 * @param {HomePluginBranding} - pass in custom branding configurations
 * @returns {string|undefined} a valid custom URL or undefined if no valid URL is provided
 */
const customHomeLogoDarkMode = (branding: HomePluginBranding) => {
  return branding.mark?.darkModeUrl ?? branding.mark?.defaultUrl ?? undefined;
};

/**
 * Render custom home logo for both default mode and dark mode
 *
 * @param {HomePluginBranding} - pass in custom branding configurations
 * @returns {string|undefined} a valid custom loading logo URL, or undefined
 */
const customHomeLogo = (branding: HomePluginBranding) => {
  return branding.darkMode ? customHomeLogoDarkMode(branding) : customHomeLogoDefaultMode(branding);
};

/**
 * Check if we render a custom home logo or the default opensearch spinner.
 * If customWelcomeLogo() returns undefined(no valid custom URL is found), we
 * render the default opensearch logo
 *
 * @param {HomePluginBranding} - pass in custom branding configurations
 * @returns a image component with custom logo URL, or the default opensearch logo
 */
const renderBrandingEnabledOrDisabledLogo = (branding: HomePluginBranding) => {
  const customLogo = customHomeLogo(branding);
  if (customLogo) {
    return (
      <div className="homSolutionPanel__customIcon">
        <img
          className="homSolutionPanel__customIconContainer"
          data-test-subj="dashboardCustomLogo"
          data-test-image-url={customLogo}
          alt={branding.applicationTitle + ' logo'}
          src={customLogo}
        />
      </div>
    );
  }
  const DEFAULT_OPENSEARCH_MARK = `${branding.assetFolderUrl}/opensearch_mark_default_mode.svg`;
  const DARKMODE_OPENSEARCH_MARK = `${branding.assetFolderUrl}/opensearch_mark_dark_mode.svg`;

  return (
    <EuiToken
      iconType={branding.darkMode ? DARKMODE_OPENSEARCH_MARK : DEFAULT_OPENSEARCH_MARK}
      shape="circle"
      fill="light"
      size="l"
      className="homSolutionPanel__icon"
    />
  );
};

/**
 *
 * @param {string} title
 * @param {string} subtitle
 * @param {IconType} iconType - will always be inputOutput icon type here
 * @param {HomePluginBranding} branding - custom branding configurations
 *
 * @returns - a EUI component <EuiFlexGroup> that renders the blue dashboard card on home page,
 * title and iconType are deprecated here because SolutionTitle component will only be rendered once
 * as the home dashboard card, and we are now in favor of using custom branding configurations.
 */
export const SolutionTitle: FC<Props> = ({ title, subtitle, iconType, branding }) => (
  <EuiFlexGroup gutterSize="none" alignItems="center">
    <EuiFlexItem className="eui-textCenter">
      {renderBrandingEnabledOrDisabledLogo(branding)}

      <EuiTitle
        className="homSolutionPanel__title eui-textInheritColor"
        size="s"
        data-test-subj="dashboardCustomTitle"
        data-test-title={branding.applicationTitle}
      >
        <h3>{branding.applicationTitle}</h3>
      </EuiTitle>

      <EuiText size="s">
        <p className="homSolutionPanel__subtitle">
          {subtitle} <EuiIcon type="sortRight" />
        </p>
      </EuiText>
    </EuiFlexItem>
  </EuiFlexGroup>
);

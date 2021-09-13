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

import React from 'react';
import '../header_logo.scss';
import { OpenSearchDashboardsLogoDarkMode } from './opensearch_dashboards_logo_darkmode';

/**
 * @param {object} logo - full logo on main screen: defaultUrl will be used in default mode; darkModeUrl will be used in dark mode
 * @param {object} mark - thumbnail logo: defaultUrl will be used in default mode; darkModeUrl will be used in dark mode
 * @param {string} applicationTitle - custom title for the application
 */
export interface CustomLogoType {
  logo: {
    defaultUrl?: string;
    darkModeUrl?: string;
  };
  mark: {
    defaultUrl?: string;
    darkModeUrl?: string;
  };
  applicationTitle?: string;
}
/**
 *
 * @param {CustomLogoType} - branding object consist of logo, mark and title
 * @returns A image component which is going to be rendered on the main page header bar.
 *          If logo default is valid, the full logo by logo default config will be rendered;
 *          if not, the logo icon by mark default config will be rendered; if both are not found,
 *          the default opensearch logo will be rendered.
 */
export const CustomLogo = ({ ...branding }: CustomLogoType) => {
  const headerLogoUrl = !branding.logo.defaultUrl
    ? branding.mark.defaultUrl
    : branding.logo.defaultUrl;
  return !branding.logo.defaultUrl && !branding.mark.defaultUrl ? (
    OpenSearchDashboardsLogoDarkMode()
  ) : (
    <div className="logoContainer">
      <img
        data-test-subj="customLogo"
        data-test-image-url={headerLogoUrl}
        src={headerLogoUrl}
        alt={branding.applicationTitle + ' logo'}
        loading="lazy"
        className="logoImage"
      />
    </div>
  );
};

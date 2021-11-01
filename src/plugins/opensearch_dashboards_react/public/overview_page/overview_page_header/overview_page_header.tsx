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
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiTitle,
  IconType,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { CoreStart } from 'opensearch-dashboards/public';
import { RedirectAppLinks } from '../../app_links';
import { useOpenSearchDashboards } from '../../context';
import { ReactPluginBranding } from '../..';

import './index.scss';

interface Props {
  hideToolbar?: boolean;
  iconType?: IconType;
  overlap?: boolean;
  showDevToolsLink?: boolean;
  showManagementLink?: boolean;
  title: JSX.Element | string;
  addBasePath: (path: string) => string;
  branding: ReactPluginBranding;
}

export const OverviewPageHeader: FC<Props> = ({
  hideToolbar,
  iconType,
  overlap,
  showDevToolsLink,
  showManagementLink,
  title,
  addBasePath,
  branding,
}) => {
  const {
    services: { application },
  } = useOpenSearchDashboards<CoreStart>();

  const {
    management: isManagementEnabled,
    dev_tools: isDevToolsEnabled,
  } = application.capabilities.navLinks;

  const DEFAULT_OPENSEARCH_MARK = `${branding.assetFolderUrl}/opensearch_mark_default_mode.svg`;
  const DARKMODE_OPENSEARCH_MARK = `${branding.assetFolderUrl}/opensearch_mark_dark_mode.svg`;

  const darkMode = branding.darkMode;
  const markDefault = branding.mark?.defaultUrl;
  const markDarkMode = branding.mark?.darkModeUrl;

  /**
   * Use branding configurations to check which URL to use for rendering
   * overview logo in default mode. In default mode, overview logo will
   * proritize default mode mark URL. If it is invalid, default opensearch logo
   * will be rendered.
   *
   * @returns a valid custom URL or undefined if no valid URL is provided
   */
  const customOverviewLogoDefaultMode = () => {
    return markDefault ?? DEFAULT_OPENSEARCH_MARK;
  };

  /**
   * Use branding configurations to check which URL to use for rendering
   * overview logo in dark mode. In dark mode, overview logo will render
   * dark mode mark URL if valid. Otherwise, it will render the default
   * mode mark URL if valid. If both dark mode mark URL and default mode mark
   * URL are invalid, the default opensearch logo will be rendered.
   *
   * @returns a valid custom URL or undefined if no valid URL is provided
   */
  const customOverviewLogoDarkMode = () => {
    return markDarkMode ?? markDefault ?? DARKMODE_OPENSEARCH_MARK;
  };

  /**
   * Render custom overview logo for both default mode and dark mode
   *
   * @returns a valid custom loading logo URL, or undefined
   */
  const customOverviewLogo = () => {
    return darkMode ? customOverviewLogoDarkMode() : customOverviewLogoDefaultMode();
  };

  /**
   * Check if we render a custom overview logo or the default opensearch spinner.
   * If customOverviewLogo() returns undefined(no valid custom URL is found), we
   * render the default opensearch logo
   *
   * @returns a image component with custom logo URL, or the default opensearch logo
   */
  const renderBrandingEnabledOrDisabledLogo = (iconTypeInput?: IconType) => {
    return customOverviewLogo() ?? iconTypeInput ?? '';
  };

  return (
    <header
      className={`osdOverviewPageHeader ${
        overlap ? 'osdOverviewPageHeader--hasOverlap' : 'osdOverviewPageHeader--noOverlap'
      }`}
    >
      <div className="osdOverviewPageHeader__inner">
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiFlexGroup gutterSize="m" responsive={false}>
              {iconType && (
                <EuiFlexItem grow={false}>
                  <EuiIcon
                    size="xxl"
                    type={renderBrandingEnabledOrDisabledLogo(iconType)}
                    data-test-subj={`osdOverviewPageHeaderLogo`}
                    data-test-logo={renderBrandingEnabledOrDisabledLogo(iconType)}
                  />
                </EuiFlexItem>
              )}

              <EuiFlexItem>
                <EuiTitle size="m">
                  <h1 id="osdOverviewPageHeader__title">{title}</h1>
                </EuiTitle>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>

          {!hideToolbar && (
            <EuiFlexItem grow={false}>
              <EuiFlexGroup className="osdOverviewPageHeader__actions" responsive={false} wrap>
                <EuiFlexItem className="osdOverviewPageHeader__actionItem" grow={false}>
                  <RedirectAppLinks application={application}>
                    <EuiButtonEmpty
                      className="osdOverviewPageHeader__actionButton"
                      flush="both"
                      href={addBasePath('/app/home#/tutorial_directory')}
                      iconType="indexOpen"
                    >
                      {i18n.translate(
                        'opensearch-dashboards-react.osdOverviewPageHeader.addDataButtonLabel',
                        {
                          defaultMessage: 'Add data',
                        }
                      )}
                    </EuiButtonEmpty>
                  </RedirectAppLinks>
                </EuiFlexItem>

                {showManagementLink && isManagementEnabled ? (
                  <EuiFlexItem className="osdOverviewPageHeader__actionItem" grow={false}>
                    <RedirectAppLinks application={application}>
                      <EuiButtonEmpty
                        className="osdOverviewPageHeader__actionButton"
                        flush="both"
                        iconType="gear"
                        href={addBasePath('/app/management')}
                      >
                        {i18n.translate(
                          'opensearch-dashboards-react.osdOverviewPageHeader.stackManagementButtonLabel',
                          {
                            defaultMessage: 'Manage',
                          }
                        )}
                      </EuiButtonEmpty>
                    </RedirectAppLinks>
                  </EuiFlexItem>
                ) : null}

                {showDevToolsLink && isDevToolsEnabled ? (
                  <EuiFlexItem className="osdOverviewPageHeader__actionItem" grow={false}>
                    <RedirectAppLinks application={application}>
                      <EuiButtonEmpty
                        className="osdOverviewPageHeader__actionButton"
                        flush="both"
                        iconType="wrench"
                        href={addBasePath('/app/dev_tools#/console')}
                      >
                        {i18n.translate(
                          'opensearch-dashboards-react.osdOverviewPageHeader.devToolsButtonLabel',
                          {
                            defaultMessage: 'Dev tools',
                          }
                        )}
                      </EuiButtonEmpty>
                    </RedirectAppLinks>
                  </EuiFlexItem>
                ) : null}
              </EuiFlexGroup>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      </div>
    </header>
  );
};

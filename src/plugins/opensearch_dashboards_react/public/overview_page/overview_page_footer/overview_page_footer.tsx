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

import React, { FC } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiButtonEmpty } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';
import { CoreStart } from 'opensearch-dashboards/public';
import { RedirectAppLinks } from '../../app_links';
import { useOpenSearchDashboards } from '../../context';
import { useUiSetting$ } from '../../ui_settings';

interface Props {
  addBasePath: (path: string) => string;
  /** The path to set as the new default route in advanced settings */
  path: string;
}

export const OverviewPageFooter: FC<Props> = ({ addBasePath, path }) => {
  const [defaultRoute, setDefaultRoute] = useUiSetting$<string>('defaultRoute');
  const {
    services: {
      application,
      notifications: { toasts },
    },
  } = useOpenSearchDashboards<CoreStart>();

  const { show, save } = application.capabilities.advancedSettings ?? {};

  const isAdvancedSettingsEnabled = show && save;

  const defaultRoutebutton =
    defaultRoute === path ? (
      <RedirectAppLinks application={application}>
        <EuiButtonEmpty
          className="osdOverviewPageFooter__button"
          flush="both"
          href={addBasePath('/app/management/opensearch-dashboards/settings#defaultRoute')}
          iconType="home"
          size="xs"
        >
          <FormattedMessage
            id="opensearch-dashboards-react.pageFooter.changeHomeRouteLink"
            defaultMessage="Display a different page on log in"
          />
        </EuiButtonEmpty>
      </RedirectAppLinks>
    ) : (
      <EuiButtonEmpty
        className="osdOverviewPageFooter__button"
        flush="both"
        iconType="home"
        onClick={() => {
          setDefaultRoute(path);
          toasts.addSuccess({
            title: i18n.translate(
              'opensearch-dashboards-react.pageFooter.changeDefaultRouteSuccessToast',
              {
                defaultMessage: 'Landing page updated',
              }
            ),
          });
        }}
        size="xs"
      >
        <FormattedMessage
          id="opensearch-dashboards-react.pageFooter.makeDefaultRouteLink"
          defaultMessage="Make this my landing page"
        />
      </EuiButtonEmpty>
    );

  return (
    <footer className="osdOverviewPageFooter">
      <EuiFlexGroup justifyContent="spaceBetween">
        <EuiFlexItem grow={false}>
          <div>{isAdvancedSettingsEnabled ? defaultRoutebutton : null}</div>
        </EuiFlexItem>

        <EuiFlexItem grow={false}>
          <div>
            <RedirectAppLinks application={application}>
              <EuiButtonEmpty
                className="osdOverviewPageFooter__button"
                data-test-subj="allPlugins"
                flush="both"
                href={addBasePath('/app/home#/feature_directory')}
                iconType="apps"
                size="xs"
              >
                <FormattedMessage
                  id="opensearch-dashboards-react.pageFooter.appDirectoryButtonLabel"
                  defaultMessage="View app directory"
                />
              </EuiButtonEmpty>
            </RedirectAppLinks>
          </div>
        </EuiFlexItem>
      </EuiFlexGroup>
    </footer>
  );
};

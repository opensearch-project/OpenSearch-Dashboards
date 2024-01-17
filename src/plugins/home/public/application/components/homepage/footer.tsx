/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { EuiFlexGroup, EuiFlexItem, EuiButtonEmpty } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { CoreStart } from 'opensearch-dashboards/public';
import { HOME_APP_BASE_PATH } from '../../../../common/constants';
import {
  RedirectAppLinks,
  useOpenSearchDashboards,
  useUiSetting$,
} from '../../../../../opensearch_dashboards_react/public';

export const Footer: React.FC = () => {
  const [defaultRoute, setDefaultRoute] = useUiSetting$<string>('defaultRoute');
  const {
    services: {
      application,
      notifications: { toasts },
    },
  } = useOpenSearchDashboards<CoreStart>();

  const getUrlForApp = application.getUrlForApp;
  const { show, save } = application.capabilities.advancedSettings ?? {};

  const isAdvancedSettingsEnabled = show && save;

  const defaultRouteButton =
    defaultRoute === HOME_APP_BASE_PATH ? (
      <RedirectAppLinks application={application}>
        <EuiButtonEmpty
          flush="both"
          href={getUrlForApp('management', { path: 'opensearch-dashboards/settings#defaultRoute' })}
          iconType="home"
          size="xs"
        >
          <FormattedMessage
            id="home.footer.changeHomeRouteLink"
            defaultMessage="Display a different page on log in"
          />
        </EuiButtonEmpty>
      </RedirectAppLinks>
    ) : (
      <EuiButtonEmpty
        flush="both"
        iconType="home"
        onClick={() => {
          setDefaultRoute(HOME_APP_BASE_PATH);
          toasts.addSuccess({
            title: i18n.translate('home.footer.changeDefaultRouteSuccessToast', {
              defaultMessage: 'Landing page updated',
            }),
          });
        }}
        size="xs"
      >
        <FormattedMessage
          id="home.footer.makeDefaultRouteLink"
          defaultMessage="Make this my landing page"
        />
      </EuiButtonEmpty>
    );

  return (
    <EuiFlexGroup direction="row" wrap>
      {isAdvancedSettingsEnabled && <EuiFlexItem grow={false}>{defaultRouteButton}</EuiFlexItem>}

      <EuiFlexItem grow={false}>
        <RedirectAppLinks application={application}>
          <EuiButtonEmpty
            flush="both"
            href={getUrlForApp('home', { path: '#/feature_directory' })}
            iconType="apps"
            size="xs"
          >
            <FormattedMessage
              id="home.footer.appDirectoryButtonLabel"
              defaultMessage="View app directory"
            />
          </EuiButtonEmpty>
        </RedirectAppLinks>
      </EuiFlexItem>

      <EuiFlexItem grow={false}>
        <RedirectAppLinks application={application}>
          <EuiButtonEmpty
            flush="both"
            href={getUrlForApp('opensearch_dashboards_overview')}
            iconType="visualizeApp"
            size="xs"
          >
            <FormattedMessage
              id="home.footer.visualizeAndAnalyze"
              defaultMessage="Visualize & Analyze"
            />
          </EuiButtonEmpty>
        </RedirectAppLinks>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

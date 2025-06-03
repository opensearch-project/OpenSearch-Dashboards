/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiBreadcrumb, EuiPage } from '@elastic/eui';
import { CoreStart } from 'opensearch-dashboards/public';
import React, { useEffect } from 'react';
import { i18n } from '@osd/i18n';
import {
  ContentManagementPluginSetup,
  ContentManagementPluginStart,
  Content,
} from '../../../content_management/public';
import { NavigationPublicPluginStart } from '../../../navigation/public';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';

const sectionRender = (contents: Content[]) => {
  return (
    <>
      {contents.map((content) => {
        if (content.kind === 'custom') {
          return <React.Fragment key={content.id}>{content.render()}</React.Fragment>;
        }

        return null;
      })}
    </>
  );
};

export const setupUserSettingsPage = (contentManagement?: ContentManagementPluginSetup) => {
  contentManagement?.registerPage({
    id: 'user_settings',
    title: 'User Settings',
    sections: [
      {
        id: 'user_profile',
        order: 1000,
        title: `User's profile`,
        kind: 'custom',
        render: sectionRender,
      },
      {
        id: 'default_workspace',
        order: 2000,
        kind: 'custom',
        render: sectionRender,
      },
      {
        id: 'user_identity_role',
        order: 3000,
        kind: 'custom',
        render: sectionRender,
      },
    ],
  });
};

export const UserSettingsApp = () => {
  const {
    services: {
      contentManagement,
      application,
      chrome,
      navigation: {
        ui: { HeaderControl },
      },
    },
  } = useOpenSearchDashboards<
    CoreStart & {
      contentManagement: ContentManagementPluginStart;
      navigation: NavigationPublicPluginStart;
    }
  >();

  useEffect(() => {
    const breadcrumbs: EuiBreadcrumb[] = [
      {
        text: i18n.translate('advancedSettings.userSettingsLabel', {
          defaultMessage: 'User settings',
        }),
      },
    ];
    chrome.setBreadcrumbs(breadcrumbs);
  }, [chrome]);

  return (
    <EuiPage paddingSize="m">
      <HeaderControl
        controls={[
          {
            description: i18n.translate('advancedSettings.userSettings.description', {
              defaultMessage: 'Configure your personal preferences.',
            }),
          },
        ]}
        setMountPoint={application.setAppDescriptionControls}
      />
      {contentManagement
        ? contentManagement.renderPage('user_settings', { fragmentOnly: true })
        : null}
    </EuiPage>
  );
};

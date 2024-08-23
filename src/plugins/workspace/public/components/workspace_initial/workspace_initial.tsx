/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CoreStart } from 'opensearch-dashboards/public';
import {
  EuiLink,
  EuiPage,
  EuiIcon,
  EuiText,
  EuiCard,
  EuiImage,
  EuiPanel,
  EuiTitle,
  EuiSpacer,
  EuiPageBody,
  EuiFlexItem,
  EuiFlexGroup,
  EuiButtonEmpty,
  EuiPageContent,
  EuiSmallButton,
  EuiToolTip,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import BackgroundLightSVG from '../../assets/background_light.svg';
import BackgroundDarkSVG from '../../assets/background_light.svg';
import { WORKSPACE_CREATE_APP_ID } from '../../../common/constants';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';

export const WorkspaceInitial = () => {
  const {
    services: { application, chrome, uiSettings },
  } = useOpenSearchDashboards<CoreStart>();
  const isDashboardAdmin = application.capabilities.dashboards?.isDashboardAdmin;
  const logos = chrome.logos;
  const createWorkspaceUrl = application.getUrlForApp(WORKSPACE_CREATE_APP_ID, { absolute: true });
  const settingsAndSetupUrl = application.getUrlForApp('settings_landing', { absolute: true });
  const isDarkTheme = uiSettings.get('theme:darkMode');
  const backGroundUrl = isDarkTheme ? BackgroundDarkSVG : BackgroundLightSVG;

  const noAdminToolTip = i18n.translate('workspace.initial.card.createWorkspace.toolTip', {
    defaultMessage:
      'Contact your administrator to create a workspace or to be added to an existing one.',
  });

  const createButton = (
    <EuiSmallButton
      fill
      iconType="plus"
      key={WORKSPACE_CREATE_APP_ID}
      data-test-subj="workspace-initial-card-createWorkspace-button"
      href={createWorkspaceUrl}
    >
      {i18n.translate('workspace.initial.card.createWorkspace.button', {
        defaultMessage: 'Create Workspace',
      })}
    </EuiSmallButton>
  );

  const cards = (
    <EuiFlexGroup className="eui-xScrollWithShadows">
      <EuiFlexItem grow={false}>
        <EuiCard
          style={{ width: '270px' }}
          textAlign="left"
          title={i18n.translate('workspace.initial.card.createWorkspace.title', {
            defaultMessage: 'Create a workspace',
          })}
          description={
            <EuiToolTip content={isDashboardAdmin ? null : noAdminToolTip}>
              <>
                {i18n.translate('workspace.initial.card.createWorkspace.description', {
                  defaultMessage: 'Organize projects by use case in a collaborative workspace.',
                })}
              </>
            </EuiToolTip>
          }
          footer={isDashboardAdmin && createButton}
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiCard
          style={{ width: '270px', height: '162px' }}
          textAlign="left"
          title={i18n.translate('workspace.initial.card.tryOpenSearch.title', {
            defaultMessage: 'Try OpenSearch',
          })}
          description={i18n.translate('workspace.initial.card.tryOpenSearch.description', {
            defaultMessage: 'Explore sample data before adding your own.',
          })}
          footer={
            <EuiText color="subdued" style={{ fontSize: '18px' }}>
              {i18n.translate('workspace.initial.card.tryOpenSearch.footer', {
                defaultMessage: 'with Sample Datasets',
              })}
            </EuiText>
          }
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiCard
          style={{ width: '270px', height: '162px' }}
          textAlign="left"
          title={i18n.translate('workspace.initial.card.addData.title', {
            defaultMessage: 'Add your data',
          })}
          description={i18n.translate('workspace.initial.card.addData.description', {
            defaultMessage: 'Start collecting and analyzing your data.',
          })}
          footer={
            <EuiText color="subdued" style={{ fontSize: '18px' }}>
              {i18n.translate('workspace.initial.card.addData.footer', {
                defaultMessage: 'with Getting Started Guide',
              })}
            </EuiText>
          }
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiCard
          style={{ width: '270px', height: '162px' }}
          textAlign="left"
          title={i18n.translate('workspace.initial.card.discoverInsights.title', {
            defaultMessage: 'Discover insights',
          })}
          description={i18n.translate('workspace.initial.card.discoverInsights.description', {
            defaultMessage: 'Explore data interactively to uncover insights.',
          })}
          footer={
            <EuiText color="subdued" style={{ fontSize: '18px' }}>
              {i18n.translate('workspace.initial.card.discoverInsights.footer', {
                defaultMessage: 'with Discover',
              })}
            </EuiText>
          }
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiCard
          style={{ width: '270px', height: '162px' }}
          title={''}
          description={i18n.translate('workspace.initial.card.muchMore.description', {
            defaultMessage: 'And much more...',
          })}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );

  const content = (
    <EuiFlexGroup direction="column">
      <EuiFlexItem grow={false}>
        <EuiTitle size="l">
          <h1>
            {i18n.translate('workspace.initial.title', {
              defaultMessage: 'Getting started with OpenSearch',
            })}
          </h1>
        </EuiTitle>
      </EuiFlexItem>
      <EuiFlexItem grow={false} style={{ maxWidth: '650px' }}>
        <EuiText grow={false}>
          {i18n.translate('workspace.initial.description', {
            defaultMessage:
              'OpenSearch is a flexible, scalable, open-source way to build solutions for data-intensive search and analytics applications. Explore, enrich, and visualize your data, using developer-friendly tools and powerful integrations for machine learning, data processing, and more.',
          })}
        </EuiText>
      </EuiFlexItem>
      <EuiFlexItem grow={false} className="eui-displayInline">
        <EuiButtonEmpty
          href="https://www.opensearch.org/"
          iconType="popout"
          iconSide="right"
          flush="left"
          data-test-subj="workspace-initial-button-openSearch"
        >
          <EuiText>
            {i18n.translate('workspace.initial.button.openSearch', {
              defaultMessage: 'Learn more from documentation and more.',
            })}
          </EuiText>
        </EuiButtonEmpty>
      </EuiFlexItem>

      <EuiFlexItem grow={false} style={{ maxWidth: '540px' }}>
        <EuiPanel color="subdued" borderRadius="none" hasShadow={false} hasBorder={false}>
          <EuiText>
            <EuiIcon type="dashboardApp" size="l" />
            &nbsp;&nbsp;Explore live demo environment at{' '}
            <EuiLink href="https://playground.opensearch.org/">playground.opensearch.org</EuiLink>
          </EuiText>
        </EuiPanel>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>{cards}</EuiFlexItem>
    </EuiFlexGroup>
  );

  return (
    <EuiPage style={{ minHeight: '100vh' }}>
      <EuiPageBody>
        <EuiFlexGroup direction="column" justifyContent="center" alignItems="center">
          <EuiFlexItem grow={false}>
            <EuiImage size="l" alt="OpenSearch" src={logos.OpenSearch.url} />
          </EuiFlexItem>
          <EuiSpacer />
          <EuiFlexItem grow={false} style={{ width: '1122px' }} className="eui-displayInline">
            <EuiPageContent
              style={{
                backgroundImage: `url(${backGroundUrl})`,
                backgroundSize: '490px 380px',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px top 20px',
              }}
            >
              {content}
            </EuiPageContent>
            <EuiButtonEmpty
              iconType="gear"
              iconSide="left"
              flush="left"
              href={settingsAndSetupUrl}
              data-test-subj="workspace-initial-button-settingsAndSetup"
            >
              <EuiText>
                {i18n.translate('workspace.initial.button.settingsAndSetup', {
                  defaultMessage: 'Settings and setup',
                })}
              </EuiText>
            </EuiButtonEmpty>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPageBody>
    </EuiPage>
  );
};

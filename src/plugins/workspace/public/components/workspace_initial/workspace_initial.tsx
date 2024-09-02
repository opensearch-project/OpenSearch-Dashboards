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
  EuiPageContent,
  EuiSmallButton,
  EuiSmallButtonEmpty,
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

  const noAdminText = (
    <EuiText style={{ maxWidth: '340px' }} size="s">
      {i18n.translate('workspace.initial.card.createWorkspace.text', {
        defaultMessage:
          'Contact your administrator to create a workspace or to be added to an existing one.',
      })}
    </EuiText>
  );

  const cards = (
    <EuiFlexGroup>
      <EuiFlexItem grow={false}>
        <EuiCard
          style={{ width: '270px', height: '137px' }}
          layout="horizontal"
          icon={<EuiIcon color="subdued" size="xl" type="wsObservability" />}
          title={i18n.translate('workspace.initial.card.observability.title', {
            defaultMessage: 'Observability',
          })}
          description={i18n.translate('workspace.initial.card.observability.description', {
            defaultMessage: 'Gain visibility into your applications and infrastructure',
          })}
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiCard
          style={{ width: '270px', height: '137px' }}
          layout="horizontal"
          icon={<EuiIcon color="subdued" size="xl" type="wsSecurityAnalytics" />}
          title={i18n.translate('workspace.initial.card.securityAnalytics.title', {
            defaultMessage: 'Security Analytics',
          })}
          description={i18n.translate('workspace.initial.card.securityAnalytics.description', {
            defaultMessage: 'Enhance your security posture with advanced analytics',
          })}
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiCard
          style={{ width: '270px', height: '137px' }}
          layout="horizontal"
          icon={<EuiIcon color="subdued" size="xl" type="wsSearch" />}
          title={i18n.translate('workspace.initial.card.search.title', {
            defaultMessage: 'Search',
          })}
          description={i18n.translate('workspace.initial.card.search.description', {
            defaultMessage: 'Discover and query your data with ease',
          })}
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiCard
          style={{ width: '270px', height: '137px' }}
          layout="horizontal"
          icon={<EuiIcon color="subdued" size="xl" type="wsEssentials" />}
          title={i18n.translate('workspace.initial.card.essentials.title', {
            defaultMessage: 'Essentials',
          })}
          description={i18n.translate('workspace.initial.card.essentials.description', {
            defaultMessage: 'Just the basics for exploring and analyzing data',
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
              defaultMessage: 'Create a workspace to get started',
            })}
          </h1>
        </EuiTitle>
      </EuiFlexItem>
      <EuiFlexItem grow={false} style={{ maxWidth: '730px' }}>
        <EuiText size="s">
          {i18n.translate('workspace.initial.description', {
            defaultMessage:
              'Welcome to OpenSearch! This interface supports you to easily explore, enrich and visualize your data with developer-friendly tools and powerful integrations for machine learning, data process, and more. To begin, create a workspace for your use case.',
          })}
        </EuiText>
      </EuiFlexItem>
      <EuiFlexItem grow={false} className="eui-displayInline">
        <EuiSmallButtonEmpty
          href="https://docs.aws.amazon.com/opensearch-service/latest/developerguide/what-is.html"
          iconType="popout"
          iconSide="right"
          flush="left"
          data-test-subj="workspace-initial-button-openSearch"
        >
          <EuiText size="s">
            {i18n.translate('workspace.initial.button.openSearch', {
              defaultMessage: 'Learn more from documentation',
            })}
          </EuiText>
        </EuiSmallButtonEmpty>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiTitle size="m">
          <h2>
            {i18n.translate('workspace.initial.createWorkspace.title', {
              defaultMessage: 'Create a workspace',
            })}
          </h2>
        </EuiTitle>
        <EuiText size="s">
          {i18n.translate('workspace.initial.createWorkspace.describe', {
            defaultMessage: 'Organize projects by use case in a collaborative workspace',
          })}
        </EuiText>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>{cards}</EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiFlexGroup direction="row" justifyContent="spaceBetween" alignItems="center">
          <EuiFlexItem grow={false}>{isDashboardAdmin ? createButton : noAdminText}</EuiFlexItem>
          <EuiFlexItem grow={false} style={{ maxWidth: '540px' }}>
            <EuiPanel color="subdued" paddingSize="s" hasShadow={false} hasBorder={false}>
              <EuiText size="s">
                <EuiIcon type="dashboardApp" size="l" />
                &nbsp;&nbsp;Explore live demo environment at{' '}
                <EuiLink href="https://playground.opensearch.org/">
                  playground.opensearch.org
                </EuiLink>
              </EuiText>
            </EuiPanel>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlexItem>
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
          <EuiFlexItem grow={false} style={{ width: '1200px' }} className="eui-displayInline">
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
            <EuiSmallButtonEmpty
              iconType="gear"
              iconSide="left"
              flush="left"
              href={settingsAndSetupUrl}
              data-test-subj="workspace-initial-button-settingsAndSetup"
            >
              <EuiText size="s">
                {i18n.translate('workspace.initial.button.settingsAndSetup', {
                  defaultMessage: 'Settings and setup',
                })}
              </EuiText>
            </EuiSmallButtonEmpty>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPageBody>
    </EuiPage>
  );
};

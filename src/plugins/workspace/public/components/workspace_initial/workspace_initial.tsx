/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { ChromeNavControl, CoreStart } from 'opensearch-dashboards/public';
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
import { useObservable } from 'react-use';
import { BehaviorSubject } from 'rxjs';
import BackgroundLightSVG from '../../assets/background_light.svg';
import BackgroundDarkSVG from '../../assets/background_light.svg';
import { WORKSPACE_CREATE_APP_ID } from '../../../common/constants';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { WorkspaceUseCase } from '../../types';
import { WorkspaceUseCaseCard } from './workspace_usecase_card';
import { getFirstUseCaseOfFeatureConfigs } from '../../utils';

export interface WorkspaceInitialProps {
  registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]>;
}

export const WorkspaceInitial = ({ registeredUseCases$ }: WorkspaceInitialProps) => {
  const {
    services: { application, chrome, uiSettings, workspaces, http },
  } = useOpenSearchDashboards<CoreStart>();
  const isDashboardAdmin = application.capabilities.dashboards?.isDashboardAdmin;
  const logos = chrome.logos;
  const createWorkspaceUrl = application.getUrlForApp(WORKSPACE_CREATE_APP_ID, { absolute: true });
  const settingsAndSetupUrl = application.getUrlForApp('settings_landing', { absolute: true });
  const isDarkTheme = uiSettings.get('theme:darkMode');
  const backGroundUrl = isDarkTheme ? BackgroundDarkSVG : BackgroundLightSVG;
  const availableUseCases = registeredUseCases$
    .getValue()
    .filter((item) => !item.systematic || item.id === 'all');
  const workspaceList = workspaces.workspaceList$.getValue();

  const useCaseCards = availableUseCases.map((useCase) => {
    const filterWorkspaces = workspaceList.filter(
      (workspace) => getFirstUseCaseOfFeatureConfigs(workspace?.features || []) === useCase.id
    );
    return (
      <WorkspaceUseCaseCard
        useCase={useCase}
        workspaces={filterWorkspaces}
        application={application}
        http={http}
      />
    );
  });

  const mountUserAccountRef = useRef<HTMLDivElement>(null);
  const mountSettingRef = useRef<HTMLDivElement>(null);

  const [userAccountMount, setUserAccountMount] = useState<ChromeNavControl | undefined>(undefined);
  const [settingMount, setSettingMount] = useState<ChromeNavControl | undefined>(undefined);
  // const subscription = useObservable(chrome.navControls.getLeftBottom$());

  useEffect(() => {
    const subscription = chrome.navControls.getLeftBottom$().subscribe((items) => {
      setSettingMount(items.at(2));
      setUserAccountMount(items.at(-1));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [chrome.navControls]);

  useEffect(() => {
    if (
      userAccountMount?.mount &&
      settingMount?.mount &&
      mountUserAccountRef.current &&
      mountSettingRef.current
    ) {
      userAccountMount.mount(mountUserAccountRef.current);
      settingMount.mount(mountSettingRef.current);
    }
  }, [settingMount, userAccountMount]);

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
      {useCaseCards}
      {/* <EuiFlexItem grow={false}>
        <EuiCard
          style={{ width: '326px', height: '484px', borderRadius: '24px' }}
          layout="horizontal"
          // display="subdued"
          title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <EuiIcon
                color="subdued"
                size="xl"
                type="wsObservability"
                className="eui-alignMiddle"
              />
              &nbsp;&nbsp;
              {i18n.translate('workspace.initial.card.observability.title', {
                defaultMessage: 'Observability',
              })}
            </div>
          }
          description={i18n.translate('workspace.initial.card.observability.description', {
            defaultMessage: 'Gain visibility into your applications and infrastructure',
          })}
        />
      </EuiFlexItem>
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
      </EuiFlexItem> */}
    </EuiFlexGroup>
  );

  const content = (
    <EuiFlexGroup direction="column">
      <EuiFlexItem grow={false}>
        <EuiTitle size="l">
          <h1 style={{ fontWeight: 400, fontSize: 64 }}>
            {i18n.translate('workspace.initial.title', {
              defaultMessage: 'Welcome to OpenSearch',
            })}
          </h1>
        </EuiTitle>
        <EuiText>
          {i18n.translate('workspace.initial.description', {
            defaultMessage: 'Search and analytics at scale.',
          })}
        </EuiText>
      </EuiFlexItem>
      <EuiSpacer size="xl" />
      <EuiFlexItem grow={false} className="eui-displayInline">
        <EuiText size="s" className="eui-alignMiddle">
          <EuiIcon type="reporter" size="s" />
          &nbsp;&nbsp;
          <EuiLink
            href="https://docs.aws.amazon.com/opensearch-service/latest/developerguide/what-is.html"
            target="_blank"
            style={{ fontWeight: 'normal' }}
          >
            {i18n.translate('workspace.initial.button.openSearch', {
              defaultMessage: 'Learn more from documentation',
            })}
          </EuiLink>
        </EuiText>
        <EuiText size="s" className="eui-alignMiddle">
          <EuiIcon type="dashboardApp" size="s" />
          &nbsp;&nbsp;
          <EuiLink
            href="https://playground.opensearch.org/"
            target="_blank"
            style={{ fontWeight: 'normal' }}
          >
            {i18n.translate('workspace.initial.button.openSearch', {
              defaultMessage: 'Explore live demo environment at playground.opensearch.org',
            })}
          </EuiLink>
        </EuiText>
      </EuiFlexItem>
      <EuiSpacer size="xxl" />
      <EuiFlexItem grow={false}>
        <EuiFlexGroup direction="row" justifyContent="spaceBetween" style={{ maxWidth: '1750px' }}>
          <EuiFlexItem grow={false}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <EuiIcon type="wsSelector" size="xl" />
              &nbsp;
              <span style={{ fontWeight: 400, fontSize: '36px' }}>
                {i18n.translate('workspace.initial.title', {
                  defaultMessage: 'My workspaces',
                })}
              </span>
            </div>
            <EuiText size="xs">
              {i18n.translate('workspace.initial.createWorkspace.describe', {
                defaultMessage: 'Organize projects by use case in a collaborative workspace.',
              })}
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>{isDashboardAdmin ? createButton : noAdminText}</EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlexItem>
      <EuiFlexItem
        className="eui-xScrollWithShadows"
        style={{ maxWidth: '100%', overflowY: 'hidden' }}
      >
        {cards}
      </EuiFlexItem>
    </EuiFlexGroup>
  );

  return (
    <EuiPage style={{ minHeight: '100vh' }}>
      <EuiPageContent hasShadow={false} borderRadius="none">
        {/* <EuiPageBody style={{ paddingTop: '24px' }}> */}
        <EuiImage size="m" alt="OpenSearch" src={logos.OpenSearch.url} />
        <EuiFlexGroup direction="column" style={{ padding: '60px' }}>
          {/* <EuiFlexItem grow={false}  className="eui-displayInline">
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
          </EuiFlexItem> */}
          <EuiFlexItem grow={false} className="eui-displayInline">
            {content}
          </EuiFlexItem>
        </EuiFlexGroup>
        <div ref={mountSettingRef} />
        <EuiSpacer size="s" />
        <div ref={mountUserAccountRef} />
        {/* </EuiPageBody> */}
      </EuiPageContent>
    </EuiPage>
  );
};

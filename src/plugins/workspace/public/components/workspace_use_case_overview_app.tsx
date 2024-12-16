/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { I18nProvider } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';
import { useObservable } from 'react-use';
import {
  EuiBreadcrumb,
  EuiButtonIcon,
  EuiContextMenu,
  EuiIcon,
  EuiPopover,
  EuiToolTip,
} from '@elastic/eui';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { Services } from '../types';
import {
  ANALYTICS_WORKSPACE_DISMISS_GET_STARTED,
  ESSENTIAL_WORKSPACE_DISMISS_GET_STARTED,
} from '../../common/constants';
import { getStartedSection } from './use_case_overview/setup_overview';
import {
  ESSENTIAL_OVERVIEW_PAGE_ID,
  ANALYTICS_ALL_OVERVIEW_PAGE_ID,
  SECTIONS,
} from '../../../content_management/public';
import { DEFAULT_NAV_GROUPS } from '../../../../core/public';

interface WorkspaceUseCaseOverviewProps {
  pageId: string;
}

export const WorkspaceUseCaseOverviewApp = (props: WorkspaceUseCaseOverviewProps) => {
  const {
    services: { contentManagement, workspaces, chrome, application, uiSettings, navigationUI },
  } = useOpenSearchDashboards<Services>();

  const currentWorkspace = useObservable(workspaces.currentWorkspace$);

  useEffect(() => {
    const breadcrumbs: EuiBreadcrumb[] = [
      {
        text: i18n.translate('workspace.overview.title', { defaultMessage: 'Overview' }),
      },
    ];
    chrome.setBreadcrumbs(breadcrumbs);
  }, [chrome, currentWorkspace]);

  const { pageId } = props;

  const uiSettingsKeyMap: Record<string, string> = {
    [ESSENTIAL_OVERVIEW_PAGE_ID]: ESSENTIAL_WORKSPACE_DISMISS_GET_STARTED,
    [ANALYTICS_ALL_OVERVIEW_PAGE_ID]: ANALYTICS_WORKSPACE_DISMISS_GET_STARTED,
  };

  const useCaseNameMap: Record<string, string> = {
    [ESSENTIAL_OVERVIEW_PAGE_ID]: DEFAULT_NAV_GROUPS.essentials.title,
    [ANALYTICS_ALL_OVERVIEW_PAGE_ID]: DEFAULT_NAV_GROUPS.all.title,
  };

  const uiSettingsKey = uiSettingsKeyMap[pageId];
  const useCaseName = useCaseNameMap[pageId];

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isGetStartedDismissed, setIsGetStartedDismissed] = useState<boolean>(
    !!uiSettings.get(uiSettingsKey)
  );

  const togglePopover = () => setIsPopoverOpen(!isPopoverOpen);
  const closePopover = () => setIsPopoverOpen(false);

  const page = contentManagement?.getPage(pageId);

  const HeaderControl = navigationUI?.HeaderControl;

  const dismissGetStartCards = async (state: boolean) => {
    uiSettings.set(uiSettingsKey, state);
    setIsGetStartedDismissed(state);
  };

  useEffect(() => {
    if (isGetStartedDismissed) {
      page?.removeSection(SECTIONS.GET_STARTED);
    } else {
      page?.createSection(getStartedSection);
    }
  }, [isGetStartedDismissed, page]);

  const hide = i18n.translate('workspace.overview.getStartedCard.setting.hide.label', {
    defaultMessage: 'Hide Get started with {useCaseName}',
    values: {
      useCaseName,
    },
  });

  const show = i18n.translate('workspace.overview.getStartedCard.setting.show.label', {
    defaultMessage: 'Show Get started with {useCaseName}',
    values: {
      useCaseName,
    },
  });
  const contextMenuItems = [
    {
      name: isGetStartedDismissed ? show : hide,
      icon: <EuiIcon type={isGetStartedDismissed ? 'eye' : 'eyeClosed'} />,
      onClick: async () => {
        await dismissGetStartCards(!isGetStartedDismissed);
        closePopover();
      },
    },
  ];

  const settingToolTip = i18n.translate('workspace.overview.getStartedCard.setting.tooltip', {
    defaultMessage: 'Page settings',
  });

  const pageHeaderButton = () => {
    const popOver = (
      <EuiPopover
        button={
          <EuiButtonIcon
            iconType="gear"
            aria-label={settingToolTip}
            color="primary"
            onClick={togglePopover}
            display="base"
            data-test-subj={`${pageId}-setting-button`}
            size="s"
          />
        }
        isOpen={isPopoverOpen}
        closePopover={closePopover}
        panelPaddingSize="none"
      >
        <EuiContextMenu
          size="s"
          initialPanelId={0}
          panels={[
            {
              id: 0,
              items: contextMenuItems,
            },
          ]}
        />
      </EuiPopover>
    );
    return isPopoverOpen ? popOver : <EuiToolTip content={settingToolTip}>{popOver}</EuiToolTip>;
  };

  const TopNavControls = [
    {
      renderComponent: pageHeaderButton(),
    },
  ];

  return (
    <I18nProvider>
      {HeaderControl && (
        <HeaderControl setMountPoint={application.setAppRightControls} controls={TopNavControls} />
      )}
      {contentManagement ? contentManagement.renderPage(pageId) : null}
    </I18nProvider>
  );
};

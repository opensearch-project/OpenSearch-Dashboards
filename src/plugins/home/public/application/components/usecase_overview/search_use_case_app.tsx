/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useObservable } from 'react-use';
import { CoreStart } from 'opensearch-dashboards/public';
import {
  EuiBreadcrumb,
  EuiButtonIcon,
  EuiContextMenu,
  EuiIcon,
  EuiPopover,
  EuiToolTip,
} from '@elastic/eui';
import { I18nProvider } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import {
  ContentManagementPluginStart,
  SEARCH_OVERVIEW_PAGE_ID,
  SECTIONS,
} from '../../../../../content_management/public';
import { SEARCH_USE_CASE_ID } from '../../../../../../core/public';
import { NavigationPublicPluginStart } from '../../../../../navigation/public';
import { getStartedSection } from './search_use_case_setup';
import { SEARCH_WORKSPACE_DISMISS_GET_STARTED } from '../../../../common/constants';

interface Props {
  contentManagement: ContentManagementPluginStart;
  navigation: NavigationPublicPluginStart;
}

export const SearchUseCaseOverviewApp = ({ contentManagement, navigation }: Props) => {
  const {
    services: { chrome, application, uiSettings },
  } = useOpenSearchDashboards<CoreStart>();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isGetStartedDismissed, setIsGetStartedDismissed] = useState<boolean>(
    !!uiSettings.get(SEARCH_WORKSPACE_DISMISS_GET_STARTED)
  );

  const togglePopover = () => setIsPopoverOpen(!isPopoverOpen);
  const closePopover = () => setIsPopoverOpen(false);

  const currentNavGroup = useObservable(chrome.navGroup.getCurrentNavGroup$());
  const isSearchUseCase = currentNavGroup?.id === SEARCH_USE_CASE_ID;

  const HeaderControl = navigation.ui.HeaderControl;
  const page = contentManagement.getPage(SEARCH_OVERVIEW_PAGE_ID);

  useEffect(() => {
    const title = i18n.translate('home.searchOverview.title', { defaultMessage: 'Overview' });
    const titleWithUseCase = i18n.translate('home.searchOverview.titleWithUseCase', {
      defaultMessage: 'Search Overview',
    });

    /**
     * There have three cases for the page title:
     * 1. Search workspace which currentNavGroup is Search, then the page title is "Overview" as workspace name has the use case information
     * 2. Analytics(All) workspace which currentNavGroup is All, then the page title is "Search Overview" to differentiate with other overview pages like Observability/Security Analytics
     * 3. workspace is disable, the currentNavGroup is undefined or All, then the page title is "Search Overview" to indicate this overview page is for search
     */
    const breadcrumbs: EuiBreadcrumb[] = [
      {
        text: isSearchUseCase ? title : titleWithUseCase,
      },
    ];
    chrome.setBreadcrumbs(breadcrumbs);
  }, [chrome, isSearchUseCase]);

  const dismissGetStartCards = async (state: boolean) => {
    uiSettings.set(SEARCH_WORKSPACE_DISMISS_GET_STARTED, state);
    setIsGetStartedDismissed(state);
  };

  useEffect(() => {
    if (isGetStartedDismissed) {
      page?.removeSection(SECTIONS.GET_STARTED);
    } else {
      page?.createSection(getStartedSection);
    }
  }, [isGetStartedDismissed, page]);

  const hide = i18n.translate('home.searchOverview.getStartedCard.setting.hide.label', {
    defaultMessage: 'Hide Get started with Search',
  });

  const show = i18n.translate('home.searchOverview.getStartedCard.setting.show.label', {
    defaultMessage: 'Show Get started with Search',
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

  const settingToolTip = i18n.translate('home.searchOverview.getStartedCard.setting.tooltip', {
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
            data-test-subj="search-overview-setting-button"
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
      <HeaderControl setMountPoint={application.setAppRightControls} controls={TopNavControls} />
      {contentManagement ? contentManagement.renderPage(SEARCH_OVERVIEW_PAGE_ID) : null}
    </I18nProvider>
  );
};

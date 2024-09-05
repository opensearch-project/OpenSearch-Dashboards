/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { CoreStart } from 'opensearch-dashboards/public';
import { EuiIcon } from '@elastic/eui';
import { BehaviorSubject } from 'rxjs';
import { i18n } from '@osd/i18n';
import {
  ContentManagementPluginStart,
  HOME_CONTENT_AREAS,
} from '../../../../content_management/public';
import { WorkspaceUseCase } from '../../types';
import { getFirstUseCaseOfFeatureConfigs, getUseCaseUrl } from '../../utils';
import { UseCaseCardTitle } from './use_case_card_title';
import './setup_get_start_card.scss';

const createContentCard = (useCase: WorkspaceUseCase, core: CoreStart) => {
  const { workspaces, application, http } = core;
  const workspaceList = workspaces.workspaceList$.getValue();
  const isDashboardAdmin = application.capabilities?.dashboards?.isDashboardAdmin;
  const filterWorkspaces = workspaceList.filter(
    (workspace) => getFirstUseCaseOfFeatureConfigs(workspace?.features || []) === useCase.id
  );
  if (filterWorkspaces.length === 0 && !isDashboardAdmin) {
    return {
      title: useCase.title,
      toolTipContent: i18n.translate('workspace.getStartCard.noWorkspace.toolTip', {
        defaultMessage:
          'Contact your administrator to create a workspace or to be added to an existing one.',
      }),
    };
  } else if (filterWorkspaces.length === 1) {
    const useCaseUrl = getUseCaseUrl(useCase, filterWorkspaces[0], application, http);
    return {
      onClick: () => {
        application.navigateToUrl(useCaseUrl);
      },
      title: useCase.title,
    };
  }
  return {
    getTitle: () =>
      React.createElement(UseCaseCardTitle, {
        filterWorkspaces,
        useCase,
        core,
      }),
  };
};

export const registerGetStartedCardToNewHome = (
  core: CoreStart,
  contentManagement: ContentManagementPluginStart,
  registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]>
) => {
  const availableUseCases = registeredUseCases$.getValue().filter((item) => !item.systematic);
  availableUseCases.forEach((useCase, index) => {
    const content = createContentCard(useCase, core);
    contentManagement.registerContentProvider({
      id: `home_get_start_${useCase.id}`,
      getTargetArea: () => [HOME_CONTENT_AREAS.GET_STARTED],
      getContent: () => ({
        id: useCase.id,
        kind: 'card',
        order: (index + 1) * 1000,
        description: useCase.description,
        ...content,
        getIcon: () =>
          React.createElement(EuiIcon, {
            size: 'xl',
            type: useCase.icon || 'logoOpenSearch',
            className: 'homeGettingStartedWorkspaceCardsIcon',
          }),
        cardProps: {
          layout: 'horizontal',
        },
      }),
    });
  });
};

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiEmptyPrompt,
  EuiLoadingSpinner,
  EuiPageHeader,
  EuiPanel,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { History } from 'history';
import { useEffect, useMemo } from 'react';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { TopNavControlDescriptionData } from '../../../../navigation/public';
import { DataSourceManagementContext } from '../../types';
import { getListBreadcrumbs } from '../breadcrumbs';
import { CreateDataSourceCardView } from '../data_source_creation_panel/create_data_source_card_view';
import { DataConnectionTypeCards, useDataConnectionTypeCards } from './data_connection_type_cards';

interface CreateDataConnectionPanelProps {
  useNewUX: boolean;
  /** The data sources app's history, for the built-in types' cards. */
  history: History;
  featureFlagStatus: boolean;
}

const pageTitle = () =>
  i18n.translate('dataSourcesManagement.createDataConnection.title', {
    defaultMessage: 'Create data connection',
  });

const pageDescription = () =>
  i18n.translate('dataSourcesManagement.createDataConnection.description', {
    defaultMessage: 'Pick what you want to connect.',
  });

/** Data sources, then this page. The new header shows the last crumb as the page title. */
export const getCreateDataConnectionBreadcrumbs = () => [
  ...getListBreadcrumbs(),
  { text: pageTitle(), href: '/create' },
];

/**
 * The Create data connection page of the data connections experience: the first of two pages. It
 * lists the types that can be connected in the app as cards: the built-in types for users who can
 * manage data sources (unless the registered experience hides them), then the connection flows'
 * cards. A card opens the type's setup page, the second page. It shows a spinner while the flows
 * are still being resolved and there is nothing else to show, and says so when there are no types.
 * The registered experience may add a note under the cards. Only the data connections experience
 * shows it, so its title and description differ from the Create data source page it replaces.
 */
export const CreateDataConnectionPanel = ({
  useNewUX,
  history,
  featureFlagStatus,
}: CreateDataConnectionPanelProps) => {
  const { application, navigation, setBreadcrumbs, dataConnectionsExperience } =
    useOpenSearchDashboards<DataSourceManagementContext>().services;

  useEffect(() => {
    setBreadcrumbs(getCreateDataConnectionBreadcrumbs());
  }, [setBreadcrumbs]);

  const descriptionControls = useMemo(
    () => [{ description: pageDescription() } as TopNavControlDescriptionData],
    []
  );

  const { cards, loading } = useDataConnectionTypeCards();
  const showBuiltInTypes =
    !!application.capabilities?.dataSource?.canManage &&
    !dataConnectionsExperience?.hideBuiltInTypes;
  const note = dataConnectionsExperience?.createPageNote;
  const noteText = note ? (
    <EuiText size="s" color="subdued" data-test-subj="dataConnectionTypesNote">
      <p>{note}</p>
    </EuiText>
  ) : null;
  let content;
  if (cards.length > 0 || showBuiltInTypes) {
    content = (
      <>
        {showBuiltInTypes && (
          <div data-test-subj="dataConnectionBuiltInTypes">
            <CreateDataSourceCardView history={history} featureFlagStatus={featureFlagStatus} />
          </div>
        )}
        {showBuiltInTypes && cards.length > 0 && <EuiSpacer size="m" />}
        {cards.length > 0 && <DataConnectionTypeCards cards={cards} />}
        {noteText && (
          <>
            <EuiSpacer size="m" />
            {noteText}
          </>
        )}
      </>
    );
  } else if (loading) {
    // Spinner, as on a flow's own page while its visibility resolves.
    content = <EuiLoadingSpinner size="xl" data-test-subj="dataConnectionTypeCardsLoading" />;
  } else {
    // No type can be connected in the app; the note, if any, says where sources are added instead.
    content = (
      <EuiEmptyPrompt
        data-test-subj="dataConnectionTypesEmpty"
        titleSize="xs"
        title={
          <h2>
            {i18n.translate('dataSourcesManagement.createDataConnection.noTypesTitle', {
              defaultMessage: 'No data source types can be connected here',
            })}
          </h2>
        }
        body={note ? <p data-test-subj="dataConnectionTypesNote">{note}</p> : undefined}
      />
    );
  }

  if (useNewUX) {
    const { HeaderControl } = navigation.ui;
    return (
      <>
        <HeaderControl
          setMountPoint={application.setAppDescriptionControls}
          controls={descriptionControls}
        />
        {content}
      </>
    );
  }
  return (
    <EuiPanel>
      <EuiPageHeader>
        <div>
          <EuiText size="s">
            <h1>{pageTitle()}</h1>
          </EuiText>
          <EuiSpacer size="s" />
          <EuiText size="s">
            <p>{pageDescription()}</p>
          </EuiText>
        </div>
      </EuiPageHeader>
      <EuiSpacer />
      {content}
    </EuiPanel>
  );
};

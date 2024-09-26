/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Fragment } from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { EuiSmallButton, EuiEmptyPrompt, EuiLink, EuiText } from '@elastic/eui';
import { ApplicationStart } from 'opensearch-dashboards/public';

export const getNoItemsMessage = (
  hideWriteControls: boolean,
  createItem: () => void,
  application: ApplicationStart
) => {
  if (hideWriteControls) {
    return (
      <EuiEmptyPrompt
        iconType="dashboardApp"
        title={
          <EuiText size="s">
            <h1 id="dashboardListingHeading">
              <FormattedMessage
                id="dashboard.listing.noItemsMessage"
                defaultMessage="Looks like you don't have any dashboards."
              />
            </h1>
          </EuiText>
        }
      />
    );
  }

  return (
    <EuiEmptyPrompt
      iconType="dashboardApp"
      title={
        <EuiText size="s">
          <h1 id="dashboardListingHeading">
            <FormattedMessage
              id="dashboard.listing.createNewDashboard.title"
              defaultMessage="Create your first dashboard"
            />
          </h1>
        </EuiText>
      }
      body={
        <Fragment>
          <EuiText size="s">
            <p>
              <FormattedMessage
                id="dashboard.listing.createNewDashboard.combineDataViewFromOpenSearchDashboardsAppDescription"
                defaultMessage="You can combine data views from any OpenSearch Dashboards app into one dashboard and see everything in one place."
              />
            </p>
            <p>
              <FormattedMessage
                id="dashboard.listing.createNewDashboard.newToOpenSearchDashboardsDescription"
                defaultMessage="New to OpenSearch Dashboards? {sampleDataInstallLink} to take a test drive."
                values={{
                  sampleDataInstallLink: (
                    <EuiLink onClick={() => application.navigateToApp('import_sample_data')}>
                      <FormattedMessage
                        id="dashboard.listing.createNewDashboard.sampleDataInstallLinkText"
                        defaultMessage="Install some sample data"
                      />
                    </EuiLink>
                  ),
                }}
              />
            </p>
          </EuiText>
        </Fragment>
      }
      actions={
        <EuiSmallButton
          onClick={createItem}
          fill
          iconType="plus"
          data-test-subj="createDashboardPromptButton"
        >
          <FormattedMessage
            id="dashboard.listing.createNewDashboard.createButtonLabel"
            defaultMessage="Create new dashboard"
          />
        </EuiSmallButton>
      }
    />
  );
};

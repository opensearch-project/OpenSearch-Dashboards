/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

import { FormattedMessage, I18nProvider } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';
import { EuiLink, EuiButton, EuiEmptyPrompt } from '@elastic/eui';

import { TableListView } from '../../../../opensearch_dashboards_react/public';
import { CreateButton } from './create_button';

export const EMPTY_FILTER = '';

// saved object client does not support sorting by title because title is only mapped as analyzed
// the legacy implementation got around this by pulling `listingLimit` items and doing client side sorting
// and not supporting server-side paging.
// This component does not try to tackle these problems (yet) and is just feature matching the legacy component
// TODO support server side sorting/paging once title and description are sortable on the server.
export class DashboardListing extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <I18nProvider>
        <TableListView
          headingId="dashboardListingHeading"
          createItem={this.props.hideWriteControls ? null : this.props.createItem}
          createButton={
            this.props.hideWriteControls ? null : (
              <CreateButton dashboardProviders={this.props.dashboardProviders} />
            )
          }
          findItems={this.props.findItems}
          deleteItems={this.props.hideWriteControls ? null : this.props.deleteItems}
          editItem={this.props.hideWriteControls ? null : this.props.editItem}
          viewItem={this.props.hideWriteControls ? null : this.props.viewItem}
          tableColumns={this.getTableColumns()}
          listingLimit={this.props.listingLimit}
          initialFilter={this.props.initialFilter}
          initialPageSize={this.props.initialPageSize}
          noItemsFragment={this.getNoItemsMessage()}
          entityName={i18n.translate('dashboard.listing.table.entityName', {
            defaultMessage: 'dashboard',
          })}
          entityNamePlural={i18n.translate('dashboard.listing.table.entityNamePlural', {
            defaultMessage: 'dashboards',
          })}
          tableListTitle={i18n.translate('dashboard.listing.dashboardsTitle', {
            defaultMessage: 'Dashboards',
          })}
          toastNotifications={this.props.core.notifications.toasts}
          uiSettings={this.props.core.uiSettings}
        />
      </I18nProvider>
    );
  }

  getNoItemsMessage() {
    if (this.props.hideWriteControls) {
      return (
        <div>
          <EuiEmptyPrompt
            iconType="visualizeApp"
            title={
              <h1 id="dashboardListingHeading">
                <FormattedMessage
                  id="dashboard.listing.noItemsMessage"
                  defaultMessage="Looks like you don't have any dashboards."
                />
              </h1>
            }
          />
        </div>
      );
    }

    return (
      <div>
        <EuiEmptyPrompt
          iconType="dashboardApp"
          title={
            <h1 id="dashboardListingHeading">
              <FormattedMessage
                id="dashboard.listing.createNewDashboard.title"
                defaultMessage="Create your first dashboard"
              />
            </h1>
          }
          body={
            <Fragment>
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
                      <EuiLink
                        onClick={() =>
                          this.props.core.application.navigateToApp('home', {
                            path: '#/tutorial_directory/sampleData',
                          })
                        }
                      >
                        <FormattedMessage
                          id="dashboard.listing.createNewDashboard.sampleDataInstallLinkText"
                          defaultMessage="Install some sample data"
                        />
                      </EuiLink>
                    ),
                  }}
                />
              </p>
            </Fragment>
          }
          actions={
            <EuiButton
              onClick={this.props.createItem}
              fill
              iconType="plusInCircle"
              data-test-subj="createDashboardPromptButton"
            >
              <FormattedMessage
                id="dashboard.listing.createNewDashboard.createButtonLabel"
                defaultMessage="Create new dashboard"
              />
            </EuiButton>
          }
        />
      </div>
    );
  }

  getTableColumns() {
    const dateFormat = this.props.core.uiSettings.get('dateFormat');

    return [
      {
        field: 'title',
        name: i18n.translate('dashboard.listing.table.titleColumnName', {
          defaultMessage: 'Title',
        }),
        sortable: true,
        render: (field, record) => (
          <EuiLink
            href={record.viewUrl}
            data-test-subj={`dashboardListingTitleLink-${record.title.split(' ').join('-')}`}
          >
            {field}
          </EuiLink>
        ),
      },
      {
        field: 'type',
        name: i18n.translate('dashboard.listing.table.typeColumnName', {
          defaultMessage: 'Type',
        }),
        dataType: 'string',
        sortable: true,
      },
      {
        field: 'description',
        name: i18n.translate('dashboard.listing.table.descriptionColumnName', {
          defaultMessage: 'Description',
        }),
        dataType: 'string',
        sortable: true,
      },
      {
        field: `updated_at`,
        name: i18n.translate('dashboard.listing.table.columnUpdatedAtName', {
          defaultMessage: 'Last updated',
        }),
        dataType: 'date',
        sortable: true,
        description: i18n.translate('dashboard.listing.table.columnUpdatedAtDescription', {
          defaultMessage: 'Last update of the saved object',
        }),
        ['data-test-subj']: 'updated-at',
        render: (updatedAt) => updatedAt && moment(updatedAt).format(dateFormat),
      },
    ];
  }
}

DashboardListing.propTypes = {
  createItem: PropTypes.func,
  dashboardProviders: PropTypes.object,
  findItems: PropTypes.func.isRequired,
  deleteItems: PropTypes.func.isRequired,
  editItem: PropTypes.func.isRequired,
  getViewUrl: PropTypes.func,
  editItemAvailable: PropTypes.func,
  viewItem: PropTypes.func,
  listingLimit: PropTypes.number.isRequired,
  hideWriteControls: PropTypes.bool.isRequired,
  initialFilter: PropTypes.string,
  initialPageSize: PropTypes.number.isRequired,
};

DashboardListing.defaultProps = {
  initialFilter: EMPTY_FILTER,
};

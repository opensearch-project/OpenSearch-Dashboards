/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { History } from 'history';
import { EuiLink } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { ApplicationStart } from 'opensearch-dashboards/public';
import { IUiSettingsClient } from 'src/core/public';
import moment from 'moment';

export const getTableColumns = (
  application: ApplicationStart,
  history: History,
  uiSettings: IUiSettingsClient
) => {
  const dateFormat = uiSettings.get('dateFormat');

  return [
    {
      field: 'title',
      name: i18n.translate('dashboard.listing.table.titleColumnName', {
        defaultMessage: 'Title',
      }),
      sortable: true,
      render: (field: string, record: { viewUrl?: string; title: string }) => (
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
      render: (updatedAt: string) => updatedAt && moment(updatedAt).format(dateFormat),
    },
  ];
};

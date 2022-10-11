/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

/* Generic */
export const CANCEL_TEXT = i18n.translate('cancel', {
  defaultMessage: 'Cancel',
});

export const DELETE_TEXT = i18n.translate('delete', {
  defaultMessage: 'Delete',
});

export const TITLE = i18n.translate('title', {
  defaultMessage: 'Title',
});

export const DESCRIPTION = i18n.translate('description', {
  defaultMessage: 'Description',
});

export const OPTIONAL = i18n.translate('optional', {
  defaultMessage: 'optional',
});

export const USERNAME = i18n.translate('username', {
  defaultMessage: 'Username',
});

export const PASSWORD = i18n.translate('password', {
  defaultMessage: 'Password',
});

/* Datasource listing page */
export const DS_LISTING_ARIA_REGION = i18n.translate(
  'dataSourcesManagement.createDataSourcesLiveRegionAriaLabel',
  {
    defaultMessage: 'Data Sources',
  }
);
export const DS_LISTING_TITLE = i18n.translate('dataSourcesManagement.dataSourcesTable.title', {
  defaultMessage: 'Data Sources',
});

export const DS_LISTING_DESCRIPTION = i18n.translate(
  'dataSourcesManagement.dataSourcesTable.description',
  {
    defaultMessage:
      'Create and manage data source connections to help you retrieve data from multiple OpenSearch compatible sources.',
  }
);

export const DS_LISTING_PAGE_TITLE = i18n.translate(
  'dataSourcesManagement.dataSourcesTable.dataSourcesTitle',
  {
    defaultMessage: 'Data Sources',
  }
);

export const DS_LISTING_NO_DATA = i18n.translate('dataSourcesManagement.dataSourcesTable.noData', {
  defaultMessage: 'No Data Source Connections have been created yet.',
});

export const DS_LISTING_DATA_SOURCE_MULTI_DELETE_TITLE = i18n.translate(
  'dataSourcesManagement.dataSourcesTable.multiDeleteTitle',
  {
    defaultMessage: 'Delete data source connection(s)',
  }
);

export const DS_UPDATE_DATA_SOURCE_DELETE_TITLE = i18n.translate(
  'dataSourcesManagement.dataSourcesUpdate.deleteTitle',
  {
    defaultMessage: 'Delete data source connection',
  }
);

export const DS_LISTING_DATA_SOURCE_DELETE_ACTION = i18n.translate(
  'dataSourcesManagement.dataSourcesTable.deleteDescription',
  {
    defaultMessage: 'This action will delete the selected data source connections',
  }
);

export const DS_LISTING_DATA_SOURCE_DELETE_IMPACT = i18n.translate(
  'dataSourcesManagement.dataSourcesTable.deleteConfirmation',
  {
    defaultMessage:
      'Any objects created using data from these sources, including Index Patterns, Visualizations, and Observability Panels, will be impacted.',
  }
);

export const DS_LISTING_DATA_SOURCE_DELETE_WARNING = i18n.translate(
  'dataSourcesManagement.dataSourcesTable.deleteWarning',
  {
    defaultMessage: 'This action cannot be undone.',
  }
);

/* CREATE DATA SOURCE */
export const CREATE_DATA_SOURCE_BUTTON_TEXT = i18n.translate(
  'dataSourcesManagement.dataSourceListing.createButton',
  {
    defaultMessage: 'Create data source connection',
  }
);
export const CREATE_DATA_SOURCE_HEADER = i18n.translate(
  'dataSourcesManagement.createDataSourceHeader',
  {
    defaultMessage: 'Create data source connection',
  }
);
export const DATA_SOURCE_DESCRIPTION_PLACEHOLDER = i18n.translate(
  'dataSourcesManagement.createDataSource.descriptionPlaceholder',
  {
    defaultMessage: 'Description of the data source',
  }
);
export const ENDPOINT_URL = i18n.translate('dataSourcesManagement.createDataSource.endpointURL', {
  defaultMessage: 'Endpoint URL',
});
export const ENDPOINT_PLACEHOLDER = i18n.translate(
  'dataSourcesManagement.createDataSource.endpointPlaceholder',
  {
    defaultMessage: 'The connection URL',
  }
);
export const USERNAME_PLACEHOLDER = i18n.translate(
  'dataSourcesManagement.createDataSource.usernamePlaceholder',
  {
    defaultMessage: 'Username to connect to data source',
  }
);
export const DATA_SOURCE_PASSWORD_PLACEHOLDER = i18n.translate(
  'dataSourcesManagement.createDataSource.passwordPlaceholder',
  {
    defaultMessage: 'Password to connect to data source',
  }
);
export const CREDENTIAL_SOURCE = i18n.translate(
  'dataSourcesManagement.createDataSource.credentialSource',
  {
    defaultMessage: 'Credential Source',
  }
);

/* Edit data source */
export const DATA_SOURCE_NOT_FOUND = i18n.translate(
  'dataSourcesManagement.editDataSource.dataSourceNotFound',
  {
    defaultMessage: 'Data Source not found!',
  }
);
export const DELETE_THIS_DATA_SOURCE = i18n.translate(
  'dataSourcesManagement.editDataSource.deleteThisDataSource',
  {
    defaultMessage: 'Delete this Data Source',
  }
);
export const NEW_PASSWORD_TEXT = i18n.translate(
  'dataSourcesManagement.editDataSource.newPassword',
  {
    defaultMessage: 'New password',
  }
);
export const UPDATE_STORED_PASSWORD = i18n.translate(
  'dataSourcesManagement.editDataSource.updateStoredPassword',
  {
    defaultMessage: 'Update stored password',
  }
);
export const CONNECTION_DETAILS_TITLE = i18n.translate(
  'dataSourcesManagement.editDataSource.connectionDetailsText',
  {
    defaultMessage: 'Connection Details',
  }
);
export const OBJECT_DETAILS_TITLE = i18n.translate(
  'dataSourcesManagement.editDataSource.objectDetailsText',
  {
    defaultMessage: 'Object Details',
  }
);
export const OBJECT_DETAILS_DESCRIPTION = i18n.translate(
  'dataSourcesManagement.editDataSource.objectDetailsDescription',
  {
    defaultMessage:
      'This connection information is used for reference in tables and when adding to a data source connection',
  }
);
export const CREDENTIAL = i18n.translate('dataSourcesManagement.editDataSource.credential', {
  defaultMessage: 'Credential',
});
export const AUTHENTICATION_TITLE = i18n.translate(
  'dataSourcesManagement.editDataSource.authenticationTitle',
  {
    defaultMessage: 'Authentication',
  }
);
export const AUTHENTICATION_METHOD = i18n.translate(
  'dataSourcesManagement.editDataSource.authenticationMethod',
  {
    defaultMessage: 'Authentication Method',
  }
);
export const ENDPOINT_TITLE = i18n.translate('dataSourcesManagement.editDataSource.endpointTitle', {
  defaultMessage: 'Endpoint',
});
export const ENDPOINT_DESCRIPTION = i18n.translate(
  'dataSourcesManagement.editDataSource.endpointDescription',
  {
    defaultMessage:
      'This connection information is used for reference in tables and when adding to a data source connection',
  }
);

export const CANCEL_CHANGES = i18n.translate(
  'dataSourcesManagement.editDataSource.cancelButtonLabel',
  {
    defaultMessage: 'Cancel changes',
  }
);
export const SAVE_CHANGES = i18n.translate('dataSourcesManagement.editDataSource.saveButtonLabel', {
  defaultMessage: 'Save changes',
});

/* Create/Edit validation */
export const DATA_SOURCE_VALIDATION_TITLE_EXISTS = i18n.translate(
  'dataSourcesManagement.validation.titleExists',
  {
    defaultMessage: 'This title is already in use',
  }
);

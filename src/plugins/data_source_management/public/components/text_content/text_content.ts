/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

/* Generic */
export const cancelText = i18n.translate('cancel', {
  defaultMessage: 'Cancel',
});

export const deleteText = i18n.translate('delete', {
  defaultMessage: 'Delete',
});

export const TITLE = i18n.translate('title', {
  defaultMessage: 'Title',
});

export const DESCRIPTION = i18n.translate('description', {
  defaultMessage: 'Description',
});

export const USERNAME = i18n.translate('username', {
  defaultMessage: 'Username',
});

export const PASSWORD = i18n.translate('password', {
  defaultMessage: 'Password',
});

export const OPTIONAL = i18n.translate('optional', {
  defaultMessage: 'optional',
});
/* Datasource listing page */
export const dsListingAriaRegion = i18n.translate(
  'dataSourcesManagement.createDataSourcesLiveRegionAriaLabel',
  {
    defaultMessage: 'Data Sources',
  }
);
export const dsListingTitle = i18n.translate('dataSourcesManagement.dataSourcesTable.title', {
  defaultMessage: 'Data Sources',
});

export const dsListingDescription = i18n.translate(
  'dataSourcesManagement.dataSourcesTable.description',
  {
    defaultMessage:
      'Create and manage the data sources that help you retrieve your data from multiple Elasticsearch clusters',
  }
);

export const dsListingPageTitle = i18n.translate(
  'dataSourcesManagement.dataSourcesTable.dataSourcesTitle',
  {
    defaultMessage: 'Data Sources',
  }
);

export const dsListingDeleteDataSourceTitle = i18n.translate(
  'dataSourcesManagement.dataSourcesTable.deleteTitle',
  {
    defaultMessage: 'Delete Data Source connection(s) permanently?',
  }
);

export const dsListingDeleteDataSourceDescription = i18n.translate(
  'dataSourcesManagement.dataSourcesTable.deleteDescription',
  {
    defaultMessage:
      'This will delete data source connections(s) and all Index Patterns using this credential will be invalid for access.',
  }
);

export const dsListingDeleteDataSourceConfirmation = i18n.translate(
  'dataSourcesManagement.dataSourcesTable.deleteConfirmation',
  {
    defaultMessage: 'To confirm deletion, click delete button.',
  }
);

export const dsListingDeleteDataSourceWarning = i18n.translate(
  'dataSourcesManagement.dataSourcesTable.deleteWarning',
  {
    defaultMessage: 'Note: this action is irrevocable!',
  }
);

/* CREATE DATA SOURCE */
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
export const AUTHENTICATION_METHOD_DESCRIPTION = i18n.translate(
  'dataSourcesManagement.createDataSource.authenicationMethodDescription',
  {
    defaultMessage:
      'Provide authentication details require to gain access to the endpoint. If no authentication is required, choose ',
  }
);
export const NO_AUTHENTICATION = i18n.translate(
  'dataSourcesManagement.createDataSource.noAuthentication',
  {
    defaultMessage: 'No authentication',
  }
);

/* Edit data source */
export const dataSourceNotFound = i18n.translate(
  'dataSourcesManagement.editDataSource.dataSourceNotFound',
  {
    defaultMessage: 'Data Source not found!',
  }
);
export const deleteThisDataSource = i18n.translate(
  'dataSourcesManagement.editDataSource.deleteThisDataSource',
  {
    defaultMessage: 'Delete this Data Source',
  }
);
export const oldPasswordText = i18n.translate('dataSourcesManagement.editDataSource.oldPassword', {
  defaultMessage: 'Old password',
});
export const newPasswordText = i18n.translate('dataSourcesManagement.editDataSource.newPassword', {
  defaultMessage: 'New password',
});
export const confirmNewPasswordText = i18n.translate(
  'dataSourcesManagement.editDataSource.confirmNewPassword',
  {
    defaultMessage: 'Confirm new password',
  }
);
export const updatePasswordText = i18n.translate(
  'dataSourcesManagement.editDataSource.updatePasswordText',
  {
    defaultMessage: 'Update password',
  }
);
export const connectionDetailsText = i18n.translate(
  'dataSourcesManagement.editDataSource.connectionDetailsText',
  {
    defaultMessage: 'Connection Details',
  }
);
export const objectDetailsText = i18n.translate(
  'dataSourcesManagement.editDataSource.objectDetailsText',
  {
    defaultMessage: 'Object Details',
  }
);
export const objectDetailsDescription = i18n.translate(
  'dataSourcesManagement.editDataSource.objectDetailsDescription',
  {
    defaultMessage:
      'This connection information is used for reference in tables and when adding to a data source connection',
  }
);
export const authenticationMethodTitle = i18n.translate(
  'dataSourcesManagement.editDataSource.authenticationMethodTitle',
  {
    defaultMessage: 'Authentication Method',
  }
);
export const authenticationTitle = i18n.translate(
  'dataSourcesManagement.editDataSource.authenticationTitle',
  {
    defaultMessage: 'Authentication',
  }
);
export const authenticationDetailsText = i18n.translate(
  'dataSourcesManagement.editDataSource.authenticationDetailsText',
  {
    defaultMessage: 'Authentication Details',
  }
);
export const authenticationDetailsDescription = i18n.translate(
  'dataSourcesManagement.editDataSource.authenticationDetailsDescription',
  {
    defaultMessage: 'Modify these to update the authentication type and associated details',
  }
);
export const endpointTitle = i18n.translate('dataSourcesManagement.editDataSource.endpointTitle', {
  defaultMessage: 'Endpoint',
});
export const endpointDescription = i18n.translate(
  'dataSourcesManagement.editDataSource.endpointDescription',
  {
    defaultMessage:
      'This connection information is used for reference in tables and when adding to a data source connection',
  }
);

export const cancelChangesText = i18n.translate(
  'dataSourcesManagement.editDataSource.cancelButtonLabel',
  {
    defaultMessage: 'Cancel changes',
  }
);
export const saveChangesText = i18n.translate(
  'dataSourcesManagement.editDataSource.saveButtonLabel',
  {
    defaultMessage: 'Save changes',
  }
);

export const validationErrorTooltipText = i18n.translate(
  'dataSourcesManagement.editDataSource.saveButtonTooltipWithInvalidChanges',
  {
    defaultMessage: 'Fix invalid settings before saving.',
  }
);

/* Password validation */

export const dataSourceValidationOldPasswordEmpty = i18n.translate(
  'dataSourcesManagement.validation.oldPasswordEmpty',
  {
    defaultMessage: 'Old password cannot be empty',
  }
);
export const dataSourceValidationNewPasswordEmpty = i18n.translate(
  'dataSourcesManagement.validation.newPasswordEmpty',
  {
    defaultMessage: 'New password cannot be empty',
  }
);
export const dataSourceValidationNoPasswordMatch = i18n.translate(
  'dataSourcesManagement.validation.noPasswordMatch',
  {
    defaultMessage: 'Passwords do not match',
  }
);

/* Create/Edit validation */

export const dataSourceValidationTitleEmpty = i18n.translate(
  'dataSourcesManagement.validation.titleEmpty',
  {
    defaultMessage: 'Title must not be empty',
  }
);
export const dataSourceValidationEndpointNotValid = i18n.translate(
  'dataSourcesManagement.validation.endpointNotValid',
  {
    defaultMessage: 'Endpoint is not valid',
  }
);
export const dataSourceValidationUsernameEmpty = i18n.translate(
  'dataSourcesManagement.validation.usernameEmpty',
  {
    defaultMessage: 'Username should not be empty',
  }
);
export const dataSourceValidationPasswordEmpty = i18n.translate(
  'dataSourcesManagement.validation.passwordEmpty',
  {
    defaultMessage: 'Password should not be empty',
  }
);

/* Experimental call out text */
export const EXPERIMENTAL_FEATURE = i18n.translate('experimentalFeature', {
  defaultMessage: 'Experimental Feature',
});

export const EXPERIMENTAL_FEATURE_CALL_OUT_DESCRIPTION = i18n.translate(
  'dataSourcesManagement.experimentalFeatureCallout.description',
  {
    defaultMessage:
      'The feature is experimental and should not be used in a production environment. Any index patterns, visualization, and observability panels will be impacted if the feature is deactivated. For more information see ',
  }
);

export const DATA_SOURCE_DOCUMENTATION_TEXT = i18n.translate(
  'dataSourcesManagement.experimentalFeatureCallout.documentationText',
  {
    defaultMessage: 'Data Source Documentation',
  }
);

export const DATA_SOURCE_LEAVE_FEEDBACK_TEXT = i18n.translate(
  'dataSourcesManagement.experimentalFeatureCallout.feedbackText',
  {
    defaultMessage: 'To leave feedback, visit ',
  }
);

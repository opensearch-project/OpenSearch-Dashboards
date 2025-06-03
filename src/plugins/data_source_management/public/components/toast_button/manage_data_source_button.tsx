/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { EuiButton, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import React from 'react';
import { i18n } from '@osd/i18n';
import { ApplicationStart } from 'opensearch-dashboards/public';
import { DSM_APP_ID } from '../../plugin';

export const getManageDataSourceButton = (application?: ApplicationStart) => {
  return (
    <>
      <EuiFlexGroup
        data-test-subj="manageDataSourceButtonContainer"
        justifyContent="flexEnd"
        gutterSize="s"
      >
        <EuiFlexItem grow={false}>
          <EuiButton
            data-test-subj="manageDataSourceButton"
            size="s"
            onClick={() =>
              application?.navigateToApp('management', {
                path: `opensearch-dashboards/${DSM_APP_ID}`,
              })
            }
          >
            {i18n.translate('dataSourcesManagement.manageDataSourceToastButtonLabel', {
              defaultMessage: 'Manage data sources',
            })}
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  );
};

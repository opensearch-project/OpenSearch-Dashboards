/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiFlexGroup,
  EuiHorizontalRule,
  EuiFlexItem,
  EuiSmallButton,
} from '@elastic/eui';
import React from 'react';
import { AuthMethod } from '../../../constants';
import { Role } from '../../../../types';

interface ConfigurePrometheusDatasourceProps {
  selectedQueryPermissionRoles: Role[];
  currentName: string;
  currentDetails: string;
  currentArn: string;
  currentStore: string;
  currentUsername: string;
  currentAuthMethod: AuthMethod;
  goBack: () => void;
}

export const ReviewPrometheusDatasource = (props: ConfigurePrometheusDatasourceProps) => {
  const {
    currentStore,
    currentName,
    currentDetails,
    currentAuthMethod,
    selectedQueryPermissionRoles,
    goBack,
  } = props;

  return (
    <div>
      <EuiPanel>
        <EuiText size="s">
          <h1 data-test-subj="reviewTitle">{`Review Prometheus data source configuration`}</h1>
        </EuiText>
        <EuiSpacer size="s" />
        <EuiSpacer />
        <EuiFlexGroup justifyContent="spaceBetween">
          <EuiFlexItem grow={false}>
            <EuiText>
              <h3 data-test-subj="dataSourceConfigTitle">Data source configuration</h3>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiSmallButton onClick={goBack} data-test-subj="editButton">
              Edit
            </EuiSmallButton>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiHorizontalRule />
        <EuiSpacer />
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiFlexGroup direction="column">
              <EuiFlexItem grow={false}>
                <EuiText className="overview-title" data-test-subj="dataSourceNameTitle">
                  Data source name
                </EuiText>
                <EuiText size="s" className="overview-content" data-test-subj="currentName">
                  {currentName}
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiText className="overview-title" data-test-subj="descriptionTitle">
                  Description
                </EuiText>
                <EuiText size="s" className="overview-content" data-test-subj="currentDetails">
                  {currentDetails}
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFlexGroup direction="column">
              <EuiFlexItem grow={false}>
                <EuiText className="overview-title" data-test-subj="prometheusURITitle">
                  Prometheus URI
                </EuiText>
                <EuiText size="s" className="overview-content" data-test-subj="currentStore">
                  {currentStore}
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiText className="overview-title" data-test-subj="authMethodTitle">
                  Authentication method
                </EuiText>
                <EuiText size="s" className="overview-content" data-test-subj="currentAuthMethod">
                  {currentAuthMethod === 'basicauth'
                    ? 'Basic authentication'
                    : 'AWS Signature Version 4'}
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFlexGroup direction="column">
              <EuiFlexItem grow={false}>
                <EuiText className="overview-title" data-test-subj="queryPermissionsTitle">
                  Query permissions
                </EuiText>
                <EuiText size="s" className="overview-content" data-test-subj="currentPermissions">
                  {selectedQueryPermissionRoles && selectedQueryPermissionRoles.length
                    ? `Restricted - ${selectedQueryPermissionRoles
                        .map((role) => role.label)
                        .join(',')}`
                    : 'Everyone'}
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    </div>
  );
};

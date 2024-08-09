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

interface ConfigureS3DatasourceProps {
  selectedQueryPermissionRoles: Role[];
  currentName: string;
  currentDetails: string;
  currentArn: string;
  currentStore: string;
  currentAuthMethod: AuthMethod;
  goBack: () => void;
}

export const ReviewS3Datasource = (props: ConfigureS3DatasourceProps) => {
  const {
    currentStore,
    currentName,
    currentDetails,
    currentArn,
    selectedQueryPermissionRoles,
    currentAuthMethod,
    goBack,
  } = props;

  return (
    <div>
      <EuiPanel>
        <EuiText size="s">
          <h1 data-test-subj="reviewTitle">{`Review Amazon S3 data source configuration`}</h1>
        </EuiText>
        <EuiSpacer size="s" />
        <EuiSpacer />
        <EuiFlexGroup justifyContent="spaceBetween">
          <EuiFlexItem grow={false}>
            <EuiText>
              <h3>Data source configuration</h3>
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
                <EuiText className="overview-title">Data source name</EuiText>
                <EuiText size="s" className="overview-content" data-test-subj="currentName">
                  {currentName}
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiText className="overview-title">Description</EuiText>
                <EuiText size="s" className="overview-content" data-test-subj="currentDetails">
                  {currentDetails}
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFlexGroup direction="column">
              <EuiFlexItem grow={false}>
                <EuiText className="overview-title">AWS Glue authentication ARN</EuiText>
                <EuiText size="s" className="overview-content" data-test-subj="currentArn">
                  {currentArn}
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiText className="overview-title">AWS Glue index store URI</EuiText>
                <EuiText size="s" className="overview-content" data-test-subj="currentStore">
                  {currentStore}
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFlexGroup direction="column">
              <EuiFlexItem grow={false}>
                <EuiText className="overview-title">Query permissions</EuiText>
                <EuiText size="s" className="overview-content" data-test-subj="currentPermissions">
                  {selectedQueryPermissionRoles && selectedQueryPermissionRoles.length
                    ? `Restricted - ${selectedQueryPermissionRoles
                        .map((role) => role.label)
                        .join(',')}`
                    : 'Everyone'}
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiText className="overview-title">Authentication method</EuiText>
                <EuiText size="s" className="overview-content" data-test-subj="currentAuthMethod">
                  {currentAuthMethod === 'basicauth' ? 'Basic authentication' : 'No authentication'}
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    </div>
  );
};

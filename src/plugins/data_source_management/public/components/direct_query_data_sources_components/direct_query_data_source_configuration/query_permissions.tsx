/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiCompressedComboBox,
  EuiFlexGroup,
  EuiFlexItem,
  EuiCompressedFormRow,
  EuiCompressedRadioGroup,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import React, { useState } from 'react';
import { QUERY_ALL, QUERY_RESTRICTED } from '../../../constants';
import { PermissionsConfigurationProps } from '../../../types';

export const QueryPermissionsConfiguration = (props: PermissionsConfigurationProps) => {
  const { roles, selectedRoles, setSelectedRoles, layout, hasSecurityAccess } = props;

  const [selectedAccessLevel, setSelectedAccessLevel] = useState(
    selectedRoles.length ? QUERY_RESTRICTED : QUERY_ALL
  );

  const accessLevelOptions = [
    {
      id: QUERY_RESTRICTED,
      label: 'Restricted - accessible by users with specific OpenSearch roles',
      disabled: !hasSecurityAccess,
    },
    {
      id: QUERY_ALL,
      label: 'Admin only - only accessible by the admin',
      disabled: !hasSecurityAccess,
    },
  ];

  const ConfigureRoles = () => {
    return (
      <div>
        <EuiSpacer size="s" />
        <EuiText>OpenSearch Roles</EuiText>
        <EuiText size="xs">
          Select one or more OpenSearch roles that can query this data connection.
        </EuiText>
        <EuiCompressedFormRow
          isInvalid={selectedRoles.length === 0}
          error={
            selectedRoles.length === 0
              ? 'Select an OpenSearch role or roles that will have query access to this data source'
              : undefined
          }
        >
          <EuiCompressedComboBox
            placeholder="Select one or more options"
            options={roles}
            selectedOptions={selectedRoles}
            onChange={setSelectedRoles}
            isClearable={true}
            data-test-subj="query-permissions-combo-box"
            isInvalid={selectedRoles.length === 0}
          />
        </EuiCompressedFormRow>
      </div>
    );
  };

  return (
    <EuiFlexItem>
      <EuiFlexGroup direction={layout === 'horizontal' ? 'row' : 'column'}>
        <EuiFlexItem>
          <EuiText size="s">
            <h2>Query permissions</h2>
          </EuiText>
          <EuiText size="s">
            <p>
              Control which OpenSearch roles have permission to query and index data from this data
              source.
            </p>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiCompressedRadioGroup
            options={accessLevelOptions}
            idSelected={selectedAccessLevel}
            onChange={(id) => {
              if (id === QUERY_ALL) {
                setSelectedRoles([]);
              }
              setSelectedAccessLevel(id);
            }}
            name="query-radio-group"
            legend={{
              children: <span>Query access level</span>,
            }}
          />
          {selectedAccessLevel === QUERY_RESTRICTED && <ConfigureRoles />}
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiFlexItem>
  );
};

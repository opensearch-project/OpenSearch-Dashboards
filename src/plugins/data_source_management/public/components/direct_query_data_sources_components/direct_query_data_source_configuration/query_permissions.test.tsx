/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { EuiCompressedComboBox, EuiRadioGroup } from '@elastic/eui';
import { QUERY_ALL, QUERY_RESTRICTED } from '../../../constants';
import { QueryPermissionsConfiguration } from './query_permissions';
import { Role } from '../../../types';

const roles: Role[] = [
  { label: 'Admin', value: 'admin' },
  { label: 'User', value: 'user' },
];

describe('QueryPermissionsConfiguration', () => {
  let wrapper: ReactWrapper;

  beforeEach(() => {
    const TestComponent = () => {
      const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
      return (
        <QueryPermissionsConfiguration
          roles={roles}
          selectedRoles={selectedRoles}
          setSelectedRoles={setSelectedRoles}
          layout="vertical"
          hasSecurityAccess={true}
        />
      );
    };

    wrapper = mount(<TestComponent />);
  });

  test('renders correctly', () => {
    expect(wrapper).toMatchSnapshot();
  });

  test('renders the radio group with correct options', () => {
    const radioGroup = wrapper.find(EuiRadioGroup);
    expect(radioGroup.exists()).toBe(true);
    expect(radioGroup.prop('options')).toHaveLength(2);
  });

  test('changes access level state on radio group change', async () => {
    const radioGroup = wrapper.find(EuiRadioGroup);
    expect(radioGroup.prop('idSelected')).toBe(QUERY_ALL);

    await act(async () => {
      radioGroup.prop('onChange')!(QUERY_RESTRICTED);
    });

    wrapper.update();
    expect(wrapper.find(EuiRadioGroup).prop('idSelected')).toBe(QUERY_RESTRICTED);
  });

  test('renders EuiCompressedComboBox when QUERY_RESTRICTED is selected', async () => {
    await act(async () => {
      wrapper.find(EuiRadioGroup).prop('onChange')!(QUERY_RESTRICTED);
    });

    wrapper.update();
    expect(wrapper.find(EuiCompressedComboBox).exists()).toBe(true);
  });

  test('validates EuiCompressedComboBox correctly', async () => {
    await act(async () => {
      wrapper.find(EuiRadioGroup).prop('onChange')!(QUERY_RESTRICTED);
    });

    wrapper.update();
    const comboBox = wrapper.find(EuiCompressedComboBox);

    expect(comboBox.prop('isInvalid')).toBe(true);

    await act(async () => {
      comboBox.prop('onChange')!([{ label: 'Admin', value: 'admin' }]);
    });

    wrapper.update();

    const updatedComboBox = wrapper.find(EuiCompressedComboBox);
    expect(updatedComboBox.prop('isInvalid')).toBe(false);
  });
});

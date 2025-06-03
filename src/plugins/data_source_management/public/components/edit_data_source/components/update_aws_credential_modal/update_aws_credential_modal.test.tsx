/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mount, shallow } from 'enzyme';
import { render } from '@testing-library/react';
import { UpdateAwsCredentialModal } from './update_aws_credential_modal';
import { SigV4ServiceName } from '../../../../../../data_source/common/data_sources';
import { EuiCompressedFormRow, EuiModalHeaderTitle } from '@elastic/eui';
import { FormattedMessage } from 'react-intl';

describe('UpdateAwsCredentialModal', () => {
  const mockHandleUpdateAwsCredential = jest.fn();
  const mockCloseUpdateAwsCredentialModal = jest.fn();

  const props = {
    region: 'us-east-1',
    service: SigV4ServiceName.OpenSearch,
    handleUpdateAwsCredential: mockHandleUpdateAwsCredential,
    closeUpdateAwsCredentialModal: mockCloseUpdateAwsCredentialModal,
    canManageDataSource: true,
  };

  it('updates new access key state on input change', () => {
    const wrapper = shallow(<UpdateAwsCredentialModal {...props} />);
    const newAccessKeyInput = wrapper.find('[name="updatedAccessKey"]');
    newAccessKeyInput.simulate('change', { target: { value: 'new_access_key' } });
    expect(wrapper.find('[name="updatedAccessKey"]').prop('value')).toEqual('new_access_key');
  });

  it('renders modal with correct header title', () => {
    const wrapper = shallow(<UpdateAwsCredentialModal {...props} />);
    const headerTitle = wrapper.find(EuiModalHeaderTitle).props().children;
    expect(headerTitle).toEqual(
      <h1>
        <FormattedMessage
          defaultMessage="Update stored AWS credential"
          id="dataSourcesManagement.editDataSource.updateStoredAwsCredential"
          values={{}}
        />
      </h1>
    );
  });

  it('renders modal with correct label for updated secret key', () => {
    const wrapper = shallow(<UpdateAwsCredentialModal {...props} />);
    expect(wrapper.find(EuiCompressedFormRow).at(4).props().label).toEqual('Updated secret key');
  });

  it('renders modal with correct label for updated access key', () => {
    const wrapper = shallow(<UpdateAwsCredentialModal {...props} />);
    expect(wrapper.find(EuiCompressedFormRow).at(3).props().label).toEqual('Updated access key');
  });

  it('renders modal with correct region', () => {
    const container = render(<UpdateAwsCredentialModal {...props} />);
    expect(container.getByTestId('data-source-update-credential-region')).toBeVisible();
    const text = container.getByTestId('data-source-update-credential-region');
    expect(text.textContent).toBe(props.region);
  });

  it('renders modal with service name select', () => {
    const container = render(<UpdateAwsCredentialModal {...props} />);
    expect(container.getByTestId('data-source-update-credential-service-name')).toBeVisible();
  });
});

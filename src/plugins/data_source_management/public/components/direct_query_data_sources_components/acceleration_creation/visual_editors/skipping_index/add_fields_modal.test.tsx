/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { waitFor } from '@testing-library/dom';
import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import toJson from 'enzyme-to-json';
import React from 'react';
import { CreateAccelerationForm } from '../../../../../../framework/types';
import { createAccelerationEmptyDataMock, skippingIndexDataMock } from '../../../../../mocks';
import { AddFieldsModal } from './add_fields_modal';

describe('Add fields modal in skipping index', () => {
  configure({ adapter: new Adapter() });

  it('renders add fields modal in skipping index with default options', async () => {
    const accelerationFormData = createAccelerationEmptyDataMock;
    const setAccelerationFormData = jest.fn();
    const setIsAddModalVisible = jest.fn();
    const wrapper = mount(
      <AddFieldsModal
        setIsAddModalVisible={setIsAddModalVisible}
        accelerationFormData={accelerationFormData}
        setAccelerationFormData={setAccelerationFormData}
      />
    );
    wrapper.update();
    await waitFor(() => {
      expect(
        toJson(wrapper, {
          noKey: false,
          mode: 'deep',
        })
      ).toMatchSnapshot();
    });
  });

  it('renders add fields modal in skipping index with different options', async () => {
    const accelerationFormData: CreateAccelerationForm = {
      ...createAccelerationEmptyDataMock,
      accelerationIndexType: 'skipping',
      skippingIndexQueryData: skippingIndexDataMock,
    };
    const setAccelerationFormData = jest.fn();
    const setIsAddModalVisible = jest.fn();
    const wrapper = mount(
      <AddFieldsModal
        setIsAddModalVisible={setIsAddModalVisible}
        accelerationFormData={accelerationFormData}
        setAccelerationFormData={setAccelerationFormData}
      />
    );
    wrapper.update();
    await waitFor(() => {
      expect(
        toJson(wrapper, {
          noKey: false,
          mode: 'deep',
        })
      ).toMatchSnapshot();
    });
  });
});

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { waitFor } from '@testing-library/dom';
import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import toJson from 'enzyme-to-json';
import React from 'react';
import { CreateAccelerationForm } from '../../../../../framework/types';
import {
  coveringIndexDataMock,
  createAccelerationEmptyDataMock,
  materializedViewValidDataMock,
  skippingIndexDataMock,
} from '../../../../mocks';
import { QueryVisualEditor } from './query_visual_editor';

describe('Visual builder components', () => {
  configure({ adapter: new Adapter() });

  it('renders visual builder with default options', async () => {
    const accelerationFormData = createAccelerationEmptyDataMock;
    const setAccelerationFormData = jest.fn();
    const wrapper = mount(
      <QueryVisualEditor
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

  it('renders visual builder with skipping index options', async () => {
    const accelerationFormData: CreateAccelerationForm = {
      ...createAccelerationEmptyDataMock,
      accelerationIndexName: 'skipping',
      accelerationIndexType: 'skipping',
      skippingIndexQueryData: skippingIndexDataMock,
    };
    const setAccelerationFormData = jest.fn();
    const wrapper = mount(
      <QueryVisualEditor
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

  it('renders visual builder with covering index options', async () => {
    const accelerationFormData: CreateAccelerationForm = {
      ...createAccelerationEmptyDataMock,
      accelerationIndexName: 'cv-idx',
      accelerationIndexType: 'covering',
      coveringIndexQueryData: coveringIndexDataMock,
    };
    const setAccelerationFormData = jest.fn();
    const wrapper = mount(
      <QueryVisualEditor
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

  it('renders visual builder with materialized view options', async () => {
    const accelerationFormData: CreateAccelerationForm = {
      ...createAccelerationEmptyDataMock,
      accelerationIndexType: 'materialized',
      materializedViewQueryData: materializedViewValidDataMock,
    };
    const setAccelerationFormData = jest.fn();
    const wrapper = mount(
      <QueryVisualEditor
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

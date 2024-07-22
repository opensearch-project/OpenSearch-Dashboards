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
import {
  createAccelerationEmptyDataMock,
  materializedViewValidDataMock,
} from '../../../../../mocks';
import { AddColumnPopOver } from './add_column_popover';

describe('Column popover components in materialized view', () => {
  configure({ adapter: new Adapter() });

  it('renders column popover components in materialized view with default options', async () => {
    const accelerationFormData = createAccelerationEmptyDataMock;
    const setAccelerationFormData = jest.fn();
    const setIsColumnPopOverOpen = jest.fn();
    const setColumnExpressionValues = jest.fn();
    const wrapper = mount(
      <AddColumnPopOver
        isColumnPopOverOpen={false}
        setIsColumnPopOverOpen={setIsColumnPopOverOpen}
        columnExpressionValues={[]}
        setColumnExpressionValues={setColumnExpressionValues}
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

  it('renders column popover components in materialized view with different options', async () => {
    const accelerationFormData: CreateAccelerationForm = {
      ...createAccelerationEmptyDataMock,
      accelerationIndexType: 'materialized',
      materializedViewQueryData: materializedViewValidDataMock,
    };
    const setAccelerationFormData = jest.fn();
    const setIsColumnPopOverOpen = jest.fn();
    const setColumnExpressionValues = jest.fn();
    const wrapper = mount(
      <AddColumnPopOver
        isColumnPopOverOpen={false}
        setIsColumnPopOverOpen={setIsColumnPopOverOpen}
        columnExpressionValues={materializedViewValidDataMock.columnsValues}
        setColumnExpressionValues={setColumnExpressionValues}
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

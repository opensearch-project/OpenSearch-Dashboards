/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { waitFor } from '@testing-library/dom';
import { configure, mount } from 'enzyme';
// @ts-expect-error TS7016 TODO(ts-error): fixme
import Adapter from 'enzyme-adapter-react-16';
import toJson from 'enzyme-to-json';
import React from 'react';
import { CreateAccelerationForm } from '../../../../../../framework/types';
import {
  createAccelerationEmptyDataMock,
  materializedViewValidDataMock,
} from '../../../../../mocks';
import { ColumnExpression } from './column_expression';

describe('Column expression components in materialized view', () => {
  configure({ adapter: new Adapter() });

  it('renders column expression components in materialized view with default options', async () => {
    const accelerationFormData: CreateAccelerationForm = {
      ...createAccelerationEmptyDataMock,
      accelerationIndexType: 'materialized',
      materializedViewQueryData: materializedViewValidDataMock,
    };
    const setAccelerationFormData = jest.fn();
    const setColumnExpressionValues = jest.fn();
    const wrapper = mount(
      <ColumnExpression
        index={0}
        currentColumnExpressionValue={materializedViewValidDataMock.columnsValues[0]}
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

  it('renders column expression components in materialized view with different options', async () => {
    const accelerationFormData: CreateAccelerationForm = {
      ...createAccelerationEmptyDataMock,
      accelerationIndexType: 'materialized',
      materializedViewQueryData: materializedViewValidDataMock,
    };
    const setAccelerationFormData = jest.fn();
    const setColumnExpressionValues = jest.fn();
    const wrapper = mount(
      <ColumnExpression
        index={1}
        currentColumnExpressionValue={materializedViewValidDataMock.columnsValues[1]}
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

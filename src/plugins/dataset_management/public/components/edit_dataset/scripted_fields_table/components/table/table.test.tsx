/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { shallow } from 'enzyme';

import { Table } from '../table';
import { ScriptedFieldItem } from '../../types';
// @ts-expect-error TS2305 TODO(ts-error): fixme
import { IDataset } from 'src/plugins/data/public';

const getDatasetMock = (mockedFields: any = {}) => ({ ...mockedFields } as IDataset);

const items: ScriptedFieldItem[] = [{ name: '1', lang: 'Elastic', script: '' }];

describe('Table', () => {
  let dataset: IDataset;

  beforeEach(() => {
    dataset = getDatasetMock({
      fieldFormatMap: {
        Elastic: {
          type: {
            title: 'string',
          },
        },
      },
    });
  });

  test('should render normally', () => {
    const component = shallow<Table>(
      <Table dataset={dataset} items={items} editField={() => {}} deleteField={() => {}} />
    );

    expect(component).toMatchSnapshot();
  });

  test('should render the format', () => {
    const component = shallow(
      <Table dataset={dataset} items={items} editField={() => {}} deleteField={() => {}} />
    );

    const formatTableCell = shallow(component.prop('columns')[3].render('Elastic'));
    expect(formatTableCell).toMatchSnapshot();
  });

  test('should allow edits', () => {
    const editField = jest.fn();

    const component = shallow(
      <Table dataset={dataset} items={items} editField={editField} deleteField={() => {}} />
    );

    // Click the delete button
    component.prop('columns')[4].actions[0].onClick();
    expect(editField).toBeCalled();
  });

  test('should allow deletes', () => {
    const deleteField = jest.fn();

    const component = shallow(
      <Table dataset={dataset} items={items} editField={() => {}} deleteField={deleteField} />
    );

    // Click the delete button
    component.prop('columns')[4].actions[1].onClick();
    expect(deleteField).toBeCalled();
  });
});

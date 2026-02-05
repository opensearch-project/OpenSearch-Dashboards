/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { shallow } from 'enzyme';
// @ts-expect-error TS2305 TODO(ts-error): fixme
import { IDataset } from 'src/plugins/data/public';
import { IndexedFieldItem } from '../../types';
import { Table } from './table';

const dataset = {
  timeFieldName: 'timestamp',
} as IDataset;

const items: IndexedFieldItem[] = [
  {
    name: 'Elastic',
    displayName: 'Elastic',
    searchable: true,
    info: [],
    type: 'name',
    excluded: false,
    format: '',
  },
  {
    name: 'timestamp',
    displayName: 'timestamp',
    type: 'date',
    info: [],
    excluded: false,
    format: 'YYYY-MM-DD',
  },
  {
    name: 'conflictingField',
    displayName: 'conflictingField',
    type: 'conflict',
    info: [],
    excluded: false,
    format: '',
  },
];

describe('Table', () => {
  test('should render normally', () => {
    const component = shallow(<Table dataset={dataset} items={items} editField={() => {}} />);

    expect(component).toMatchSnapshot();
  });

  test('should render normal field name', () => {
    const component = shallow(<Table dataset={dataset} items={items} editField={() => {}} />);

    const tableCell = shallow(component.prop('columns')[0].render('Elastic', items[0]));
    expect(tableCell).toMatchSnapshot();
  });

  test('should render timestamp field name', () => {
    const component = shallow(<Table dataset={dataset} items={items} editField={() => {}} />);

    const tableCell = shallow(component.prop('columns')[0].render('timestamp', items[1]));
    expect(tableCell).toMatchSnapshot();
  });

  test('should render the boolean template (true)', () => {
    const component = shallow(<Table dataset={dataset} items={items} editField={() => {}} />);

    const tableCell = shallow(component.prop('columns')[3].render(true));
    expect(tableCell).toMatchSnapshot();
  });

  test('should render the boolean template (false)', () => {
    const component = shallow(<Table dataset={dataset} items={items} editField={() => {}} />);

    const tableCell = shallow(component.prop('columns')[3].render(false, items[2]));
    expect(tableCell).toMatchSnapshot();
  });

  test('should render normal type', () => {
    const component = shallow(<Table dataset={dataset} items={items} editField={() => {}} />);

    const tableCell = shallow(component.prop('columns')[1].render('string'));
    expect(tableCell).toMatchSnapshot();
  });

  test('should render conflicting type', () => {
    const component = shallow(<Table dataset={dataset} items={items} editField={() => {}} />);

    const tableCell = shallow(component.prop('columns')[1].render('conflict', true));
    expect(tableCell).toMatchSnapshot();
  });

  test('should allow edits', () => {
    const editField = jest.fn();

    const component = shallow(<Table dataset={dataset} items={items} editField={editField} />);

    // Click the edit button
    component.prop('columns')[6].actions[0].onClick();
    expect(editField).toBeCalled();
  });
});

/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

jest.mock(
  'lodash',
  () => ({
    ...jest.requireActual('lodash'),
    debounce: (func: (...args: any[]) => any) => {
      const debounced = (...args: any[]) => func(...args);
      debounced.cancel = jest.fn();
      return debounced;
    },
  }),
  { virtual: true }
);

import React from 'react';
import { act } from 'react';
import { shallow } from 'enzyme';
import { TableListView, TableListViewProps } from './table_list_view';

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
};

const createProps = (
  findItems: TableListViewProps['findItems'],
  refreshKey: string
): TableListViewProps => ({
  entityName: 'dashboard',
  entityNamePlural: 'dashboards',
  findItems,
  initialFilter: '',
  initialPageSize: 10,
  listingLimit: 100,
  noItemsFragment: <div />,
  tableColumns: [],
  tableListTitle: 'Dashboards',
  toastNotifications: {} as TableListViewProps['toastNotifications'],
  refreshKey,
});

describe('TableListView', () => {
  it('ignores results fetched for an older refresh key', async () => {
    const first = createDeferred<{ total: number; hits: any[] }>();
    const second = createDeferred<{ total: number; hits: any[] }>();
    const findItems = jest
      .fn()
      .mockResolvedValueOnce({ total: 0, hits: [] })
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const component = shallow(<TableListView {...createProps(findItems, 'initial')} />);

    await act(async () => {
      await flushPromises();
    });

    component.setProps({ refreshKey: 'tag-a' });
    component.setProps({ refreshKey: 'tag-b' });

    await act(async () => {
      second.resolve({ total: 1, hits: [{ id: 'b', title: 'B' }] });
      await flushPromises();
    });
    component.update();
    expect(component.state('items')).toEqual([{ id: 'b', title: 'B' }]);

    await act(async () => {
      first.resolve({ total: 1, hits: [{ id: 'a', title: 'A' }] });
      await flushPromises();
    });
    component.update();
    expect(component.state('items')).toEqual([{ id: 'b', title: 'B' }]);
  });
});

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataSourceConnectionType } from '../../common/types';
import {
  DataSourceAssociationFilters,
  getDataSourceAssociationFilters,
} from './data_source_association_filters';

const connection = {
  id: 'dc-1',
  name: 'example-connection',
  type: 'example-direct-query',
  connectionType: DataSourceConnectionType.DataConnection,
  attributes: { owner: 'example-plugin' },
};

describe('DataSourceAssociationFilters', () => {
  it('allows every connection when no filter is registered', () => {
    const filters = new DataSourceAssociationFilters();
    expect(filters.isAssociable(connection, undefined)).toBe(true);
    expect(filters.getRequestedFields()).toEqual([]);
  });

  it('passes the connection and workspace features to every filter', () => {
    const filters = new DataSourceAssociationFilters();
    const allowObservabilityOnly = jest.fn((_c, features?: string[]) =>
      (features ?? []).includes('use-case-observability')
    );
    filters.register({ isAssociable: allowObservabilityOnly });
    filters.register({ isAssociable: () => true });

    expect(filters.isAssociable(connection, ['use-case-observability'])).toBe(true);
    expect(filters.isAssociable(connection, ['use-case-search'])).toBe(false);
    expect(filters.isAssociable(connection, undefined)).toBe(false);
    expect(allowObservabilityOnly).toHaveBeenCalledWith(connection, ['use-case-search']);
  });

  it('lets a filter decide from the saved object attributes it requested', () => {
    const filters = new DataSourceAssociationFilters();
    filters.register({
      fields: ['owner'],
      isAssociable: (c, features) =>
        c.attributes?.owner !== 'example-plugin' || (features ?? []).includes('use-case-search'),
    });
    expect(filters.isAssociable(connection, ['use-case-search'])).toBe(true);
    expect(filters.isAssociable(connection, ['use-case-observability'])).toBe(false);
    expect(
      filters.isAssociable({ ...connection, attributes: {} }, ['use-case-observability'])
    ).toBe(true);
  });

  it('collects the requested fields of every filter once', () => {
    const filters = new DataSourceAssociationFilters();
    filters.register({ fields: ['owner', 'kind'], isAssociable: () => true });
    filters.register({ fields: ['kind'], isAssociable: () => true });
    filters.register({ isAssociable: () => true });
    expect(filters.getRequestedFields()).toEqual(['owner', 'kind']);
  });

  it('hides a connection when a filter throws, and warns once per filter', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const filters = new DataSourceAssociationFilters();
      const error = new Error('boom');
      filters.register({
        isAssociable: () => {
          throw error;
        },
      });
      expect(filters.isAssociable(connection, ['use-case-observability'])).toBe(false);
      expect(filters.isAssociable({ ...connection, id: 'dc-2' }, undefined)).toBe(false);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][1]).toBe(error);
    } finally {
      warn.mockRestore();
    }
  });

  it('keeps registrations per instance', () => {
    const first = new DataSourceAssociationFilters();
    const second = new DataSourceAssociationFilters();
    first.register({ fields: ['owner'], isAssociable: () => false });
    expect(first.isAssociable(connection, undefined)).toBe(false);
    expect(second.isAssociable(connection, undefined)).toBe(true);
    expect(second.getRequestedFields()).toEqual([]);
  });
});

describe('getDataSourceAssociationFilters', () => {
  it("returns the workspace client's filters", () => {
    const filters = new DataSourceAssociationFilters();
    expect(
      getDataSourceAssociationFilters({ getDataSourceAssociationFilters: () => filters })
    ).toBe(filters);
  });

  it('returns undefined for a client without them', () => {
    expect(getDataSourceAssociationFilters({})).toBeUndefined();
    expect(getDataSourceAssociationFilters(null)).toBeUndefined();
    expect(getDataSourceAssociationFilters(undefined)).toBeUndefined();
  });
});
